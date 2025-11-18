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
    string public constant VALIDATOR_REGISTRATION_KEY = "VALIDATOR_REGISTRATION_FEE";
    string public constant UNSTAKE_FEE_KEY = "UNSTAKE_FEE_BIPS";
    string public constant FORCE_UNSTAKE_PENALTY_KEY = "FORCE_UNSTAKE_PENALTY_BIPS";
    string public constant CLAIM_REWARD_FEE_KEY = "CLAIM_REWARD_FEE_BIPS";
    
    struct Validator {
        bool isRegistered;
        uint256 selfStakeAmount;
        uint256 totalPStake;
        uint256 totalDelegatedAmount;
    }

    struct Delegation {
        uint256 amount;
        uint256 unlockTime;
        uint256 lockDuration;
        address validator;
    }

    mapping(address => Validator) public validators;
    address[] public validatorsArray;
    uint256 public totalValidatorSelfStake;
    uint256 public accValidatorRewardPerStake;
    mapping(address => uint256) public validatorRewardDebt;
    mapping(address => Delegation[]) public userDelegations;
    mapping(address => uint256) public userTotalPStake;
    uint256 public totalNetworkPStake;
    mapping(address => uint256) public pendingRegistrationBonus;
    uint256 public accDelegatorRewardPerStake;
    mapping(address => uint256) public delegatorRewardDebt;

    event ValidatorRegistered(address indexed validator, uint256 selfStake, uint256 feePaid);
    event Delegated(
        address indexed user,
        address indexed validator,
        uint256 delegationIndex,
        uint256 amount,
        uint256 feePaid
    );
    event Unstaked(
        address indexed user,
        uint256 delegationIndex,
        uint256 amount,
        uint256 feePaid
    );
    event RewardsDeposited(
        address indexed from,
        uint256 validatorAmount,
        uint256 delegatorAmount
    );
    event ValidatorRewardClaimed(address indexed validator, uint256 amount);
    event DelegatorRewardClaimed(address indexed delegator, uint256 amount);
    event RegistrationBonusClaimed(address indexed user, uint256 amount);
    
    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(
            _ecosystemManagerAddress != address(0),
            "DM: EcosystemManager cannot be zero"
        );
        require(_initialOwner != address(0), "DM: Invalid owner address");
        
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        require(
            _bkcTokenAddress != address(0),
            "DM: BKCToken not set in EcosystemManager"
        );
        bkcToken = BKCToken(_bkcTokenAddress);
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice The universal entry point for ALL rewards (minted + fees) from the MiningManager.
     * @dev REMOVED nonReentrant to allow reentrancy from MiningManager flow.
     */
    function depositMiningRewards(
        uint256 _validatorShare,
        uint256 _delegatorShare
    ) external { 
        require(
            msg.sender == ecosystemManager.getMiningManagerAddress(),
            "DM: Caller is not the authorized MiningManager"
        );

        if (_validatorShare > 0 && totalValidatorSelfStake > 0) {
            accValidatorRewardPerStake +=
                (_validatorShare * E18) / totalValidatorSelfStake;
        }

        if (_delegatorShare > 0 && totalNetworkPStake > 0) {
            accDelegatorRewardPerStake +=
                (_delegatorShare * E18) / totalNetworkPStake;
        }

        if (_validatorShare > 0 || _delegatorShare > 0) {
            emit RewardsDeposited(msg.sender, _validatorShare, _delegatorShare);
        }
    }
    
    /**
     * @notice Kept for compatibility, but no longer funded by the new PoP logic.
     */
    function claimRegistrationBonus() external nonReentrant {
        uint256 amount = pendingRegistrationBonus[msg.sender];
        require(amount > 0, "DM: No pending bonus to claim");
        
        pendingRegistrationBonus[msg.sender] = 0;
        
        require(bkcToken.transfer(msg.sender, amount), "DM: Bonus transfer failed");
        emit RegistrationBonusClaimed(msg.sender, amount);
    }

    /**
     * @notice Registers the caller as a validator by paying a PoP fee.
     * @dev Sends 100% of the fee to the MiningManager to trigger the universal revenue funnel.
     */
    function registerValidator(address _validatorAddress) external nonReentrant {
        require(msg.sender == _validatorAddress, "DM: Can only register self");
        require(!validators[_validatorAddress].isRegistered, "DM: Validator already registered");
        
        // 1. Get Fee
        uint256 feeToPay = ecosystemManager.getFee(VALIDATOR_REGISTRATION_KEY);
        require(feeToPay > 0, "DM: Registration fee is zero or not configured");
        
        // 2. Pull Fee from User
        require(
            bkcToken.transferFrom(msg.sender, address(this), feeToPay),
            "DM: Fee transfer failed or insufficient allowance"
        );

        // 3. Transfer 100% Fee to MiningManager (PoP Trigger)
        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        require(miningManagerAddress != address(0), "DM: MM not set in Hub");
        require(
            bkcToken.transfer(miningManagerAddress, feeToPay),
            "DM: Transfer to MiningManager failed"
        );
        
        // 4. Call MiningManager to process both mining and fee distribution
        IMiningManager(miningManagerAddress)
            .performPurchaseMining(
                VALIDATOR_REGISTRATION_KEY,
                feeToPay
            );

        // 5. Register the Validator (with zero self-stake)
        // NOTE: The internal call to _claimDelegatorReward was removed.
        
        validators[_validatorAddress] = Validator({
            isRegistered: true,
            selfStakeAmount: 0,
            totalPStake: 0,
            totalDelegatedAmount: 0
        });
        validatorsArray.push(_validatorAddress);

        emit ValidatorRegistered(_validatorAddress, 0, feeToPay);
    }

    /**
     * @notice Delegates BKC to a validator, or self-delegates if validator is self.
     * @dev This is the only function that can increase selfStakeAmount for validators.
     */
    function delegate(
        address _validatorAddress, 
        uint256 _totalAmount, 
        uint256 _lockDuration,
        uint256 _boosterTokenId 
    ) external nonReentrant {
        require(validators[_validatorAddress].isRegistered, "DM: Invalid validator");
        require(_totalAmount > 0, "DM: Invalid amount");
        require(
            _lockDuration >= MIN_LOCK_DURATION && _lockDuration <= MAX_LOCK_DURATION,
            "DM: Invalid lock duration"
        );

        // 1. Settle rewards before changing stake
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        bool isSelfDelegation = msg.sender == _validatorAddress;
        if (isSelfDelegation) {
            _claimValidatorReward(msg.sender);
        }
        
        uint256 stakeAmount = _totalAmount;
        uint256 feeAmount = 0; // No fee on delegation
        
        // 2. Pull tokens
        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "DM: Failed to delegate tokens");

        // 3. Update self-stake (if applicable)
        if (isSelfDelegation) {
            validators[_validatorAddress].selfStakeAmount += stakeAmount;
            totalValidatorSelfStake += stakeAmount;
        }

        // 4. Create delegation entry
        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: stakeAmount,
            unlockTime: block.timestamp + _lockDuration,
            lockDuration: _lockDuration,
            validator: _validatorAddress
        }));
        
        // 5. Update pStake
        uint256 pStake = _calculatePStake(stakeAmount, _lockDuration);
        totalNetworkPStake += pStake;
        validators[_validatorAddress].totalPStake += pStake;
        validators[_validatorAddress].totalDelegatedAmount += stakeAmount;
        userTotalPStake[msg.sender] += pStake;
        
        // 6. Update reward debts based on new stake
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;
        if (isSelfDelegation) {
            validatorRewardDebt[msg.sender] = (validators[msg.sender].selfStakeAmount * accValidatorRewardPerStake) / E18;
        }

        emit Delegated(msg.sender, _validatorAddress, delegationIndex, stakeAmount, feeAmount);
    }

    function unstake(
        uint256 _delegationIndex, 
        uint256 _boosterTokenId 
    ) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        bool isSelfDelegation = msg.sender == d.validator;

        // 1. Settle rewards
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        if (isSelfDelegation) {
            _claimValidatorReward(msg.sender);
        }
        
        require(block.timestamp >= d.unlockTime, "DM: Lock period not over");
        
        uint256 originalAmount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(originalAmount, d.lockDuration);
        uint256 feeBips = ecosystemManager.getFee(UNSTAKE_FEE_KEY);
        uint256 finalFeeBips = _applyBoosterDiscount(feeBips, _boosterTokenId);
        
        uint256 feeAmount = (originalAmount * finalFeeBips) / 10000;
        uint256 amountToUser = originalAmount - feeAmount;

        // 2. Update self-stake (if applicable)
        if (isSelfDelegation) {
            validators[msg.sender].selfStakeAmount -= originalAmount;
            totalValidatorSelfStake -= originalAmount;
        }

        // 3. Update pStake
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= originalAmount;
        userTotalPStake[msg.sender] -= pStakeToRemove;
        
        // 4. Send fee to MiningManager (PoP Trigger)
        if (feeAmount > 0) {
            _sendFeeToMiningManager(UNSTAKE_FEE_KEY, feeAmount);
        }

        // 5. Remove delegation from array
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();

        // 6. Return funds to user
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to transfer tokens back");
        
        // 7. Update reward debts
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;
        if (isSelfDelegation) {
            validatorRewardDebt[msg.sender] = (validators[msg.sender].selfStakeAmount * accValidatorRewardPerStake) / E18;
        }
        
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }

    function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external nonReentrant {
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        bool isSelfDelegation = msg.sender == d.validator;

        // 1. Settle rewards
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        if (isSelfDelegation) {
            _claimValidatorReward(msg.sender);
        }
        
        require(
            block.timestamp < d.unlockTime,
            "DM: Delegation is unlocked, use regular unstake"
        );
        
        uint256 originalAmount = d.amount;
        uint256 pStakeToRemove = _calculatePStake(originalAmount, d.lockDuration);

        uint256 basePenaltyBips = ecosystemManager.getFee(FORCE_UNSTAKE_PENALTY_KEY);
        uint256 finalPenaltyBips = _applyBoosterDiscount(basePenaltyBips, _boosterTokenId);
        uint256 penaltyAmount = (originalAmount * finalPenaltyBips) / 10000;
        uint256 amountToUser = originalAmount - penaltyAmount;

        // 2. Update self-stake (if applicable)
        if (isSelfDelegation) {
            validators[msg.sender].selfStakeAmount -= originalAmount;
            totalValidatorSelfStake -= originalAmount;
        }

        // 3. Update pStake
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= originalAmount;
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
        
        // 7. Update reward debts
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;
        if (isSelfDelegation) {
            validatorRewardDebt[msg.sender] = (validators[msg.sender].selfStakeAmount * accValidatorRewardPerStake) / E18;
        }
        
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    function claimDelegatorReward(uint256 _boosterTokenId) external nonReentrant {
        _claimDelegatorReward(msg.sender, _boosterTokenId);
    }

    function claimValidatorReward() external nonReentrant {
        _claimValidatorReward(msg.sender);
    }

    function _claimDelegatorReward(address _user, uint256 _boosterTokenId) internal {
        uint256 pending = pendingDelegatorRewards(_user);
        if (pending > 0) {
            uint256 baseFeeBips = ecosystemManager.getFee(CLAIM_REWARD_FEE_KEY);
            uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

            uint256 feeAmount = (pending * finalFeeBips) / 10000;
            uint256 amountToUser = pending - feeAmount;
            
            delegatorRewardDebt[_user] = (userTotalPStake[_user] * accDelegatorRewardPerStake) / E18;

            // 1. Send fee to MiningManager (PoP Trigger)
            if (feeAmount > 0) {
                _sendFeeToMiningManager(CLAIM_REWARD_FEE_KEY, feeAmount);
            }

            if (amountToUser > 0) {
                require(
                    bkcToken.transfer(_user, amountToUser),
                    "DM: Failed to transfer delegator rewards"
                );
            }

            emit DelegatorRewardClaimed(_user, amountToUser);
        }
    }

    function _claimValidatorReward(address _validator) internal {
        Validator storage v = validators[_validator];
        require(v.isRegistered, "DM: Not a validator");
        
        uint256 pending = pendingValidatorRewards(_validator);
        if (pending > 0) {
            validatorRewardDebt[_validator] = (v.selfStakeAmount * accValidatorRewardPerStake) / E18;
            require(
                bkcToken.transfer(_validator, pending),
                "DM: Validator reward transfer failed"
            );
            emit ValidatorRewardClaimed(_validator, pending);
        }
    }

    /**
     * @notice Internal helper to send collected fees to the MiningManager funnel.
     */
    function _sendFeeToMiningManager(string memory _serviceKey, uint256 _feeAmount) internal {
        address miningManagerAddress = ecosystemManager.getMiningManagerAddress();
        require(miningManagerAddress != address(0), "DM: MM not set in Hub");
        
        // Tokens are already in this contract, just transfer
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

    function pendingDelegatorRewards(address _user)
        public
        view
        returns (uint256)
    {
        return (userTotalPStake[_user] * accDelegatorRewardPerStake / E18) -
            delegatorRewardDebt[_user];
    }

    function pendingValidatorRewards(address _validator)
        public
        view
        returns (uint256)
    {
        Validator storage v = validators[_validator];
        if (!v.isRegistered) return 0;
        return (v.selfStakeAmount * accValidatorRewardPerStake / E18) -
            validatorRewardDebt[_validator];
    }

    function getDelegationsOf(address _user)
        external
        view
        returns (Delegation[] memory)
    {
        return userDelegations[_user];
    }

    function getAllValidators() external view returns (address[] memory) {
        return validatorsArray;
    }
}