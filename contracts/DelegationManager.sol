// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BKCToken.sol";
import "./EcosystemManager.sol"; // Import Hub interfaces

/**
 * @title DelegationManager
 * @dev Manages staking, validators, and rewards.
 * @notice V2: Connected to EcosystemManager.
 * @notice V3: delegate() is FREE. claimDelegatorReward() HAS A FEE.
 */
contract DelegationManager is Ownable, ReentrancyGuard {
    BKCToken public immutable bkcToken;
    IEcosystemManager public immutable ecosystemManager;
    
    address public rewardManagerAddress;

    // --- Staking Constants (Fixed) ---
    uint256 public constant MIN_LOCK_DURATION = 1 days;
    uint256 public constant MAX_LOCK_DURATION = 3650 days; // 10 years
    uint256 public constant VALIDATOR_LOCK_DURATION = 1825 days; // 5 years
    
    // (Fee constants removed - managed by Hub)

    uint256 public constant MAX_SUPPLY = 200_000_000 * 10**18;
    uint256 public constant TGE_SUPPLY = 40_000_000 * 10**18;
    uint256 public constant MINT_POOL = MAX_SUPPLY - TGE_SUPPLY;
    uint256 public constant DYNAMIC_STAKE_BIPS = 3;
    uint256 public constant SAFETY_MARGIN_BIPS = 10100;

    struct Validator {
        bool isRegistered;
        uint256 selfStakeAmount;
        uint256 selfStakeUnlockTime;
        uint256 totalPStake;
        uint256 totalDelegatedAmount;
    }

    struct Delegation {
        uint256 amount;
        uint256 unlockTime;
        uint256 lockDuration;
        address validator;
    }
    
    mapping(address => bool) public hasPaidRegistrationFee;
    mapping(address => Validator) public validators;
    mapping(address => Delegation[]) public userDelegations;
    address[] public validatorsArray;
    uint256 public totalNetworkPStake;
    mapping(address => uint256) public userTotalPStake;
    
    uint256 public accValidatorRewardPerStake;
    uint256 public accDelegatorRewardPerStake;
    mapping(address => uint256) public validatorRewardDebt;
    mapping(address => uint256) public delegatorRewardDebt;

    event ValidatorRegistered(address indexed validator, uint256 selfStake);
    event Delegated(address indexed user, address indexed validator, uint256 delegationIndex, uint256 amount, uint256 feePaid);
    event Unstaked(address indexed user, uint256 delegationIndex, uint256 amount, uint256 feePaid);
    event RewardsDeposited(address indexed from, uint256 validatorAmount, uint256 delegatorAmount);
    event ValidatorRewardClaimed(address indexed validator, uint256 amount);
    event DelegatorRewardClaimed(address indexed delegator, uint256 amount);

    constructor(
        address _bkcTokenAddress,
        address _ecosystemManagerAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_bkcTokenAddress != address(0), "DM: BKCToken address cannot be zero");
        require(_ecosystemManagerAddress != address(0), "DM: EcosystemManager address cannot be zero");
        
        bkcToken = BKCToken(_bkcTokenAddress);
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);
    }

    // --- Setup Functions ---
    function setRewardManager(address _manager) external onlyOwner {
        require(_manager != address(0), "DM: RewardManager cannot be zero address");
        rewardManagerAddress = _manager;
    }
    
    function getMinValidatorStake() public view returns (uint256) {
        uint256 dynamicStake = (bkcToken.totalSupply() * DYNAMIC_STAKE_BIPS) / 10000;
        return (dynamicStake * SAFETY_MARGIN_BIPS) / 10000;
    }

    function payRegistrationFee() external nonReentrant {
        uint256 stakeAmount = getMinValidatorStake();
        require(!hasPaidRegistrationFee[msg.sender], "DM: Fee already paid");
        
        address treasury = ecosystemManager.getTreasuryAddress();
        require(treasury != address(0), "DM: Treasury not set in Hub");
        require(bkcToken.transferFrom(msg.sender, treasury, stakeAmount), "DM: Fee transfer failed");
        hasPaidRegistrationFee[msg.sender] = true;
    }

    function registerValidator(address _validatorAddress) external nonReentrant {
        uint256 stakeAmount = getMinValidatorStake();
        require(msg.sender == _validatorAddress, "DM: Can only register self");
        require(hasPaidRegistrationFee[msg.sender], "DM: Must pay registration fee first");
        require(!validators[_validatorAddress].isRegistered, "DM: Validator already registered");
        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "DM: Stake transfer failed");

        validators[_validatorAddress] = Validator({
            isRegistered: true,
            selfStakeAmount: stakeAmount,
            selfStakeUnlockTime: block.timestamp + VALIDATOR_LOCK_DURATION,
            totalPStake: _calculatePStake(stakeAmount, VALIDATOR_LOCK_DURATION),
            totalDelegatedAmount: 0
        });
        validatorsArray.push(_validatorAddress);
        
        emit ValidatorRegistered(_validatorAddress, stakeAmount);
    }
    
    // --- Staking Functions ---

    /**
     * @notice Delegates tokens to a validator.
     * @dev CHANGED: This function is now FREE, as requested.
     * @param _validatorAddress The validator to delegate to.
     * @param _totalAmount The total amount of BKC to delegate (100% will be used).
     * @param _lockDuration The lock time in seconds.
     */
    function delegate(address _validatorAddress, uint256 _totalAmount, uint256 _lockDuration) external nonReentrant {
        _claimDelegatorReward(msg.sender); // Claims pending rewards (which will be taxed)
        
        require(validators[_validatorAddress].isRegistered, "DM: Invalid validator");
        require(_totalAmount > 0, "DM: Invalid amount");
        require(_lockDuration >= MIN_LOCK_DURATION && _lockDuration <= MAX_LOCK_DURATION, "DM: Invalid lock duration");

        // --- FEE LOGIC REMOVED ---
        uint256 stakeAmount = _totalAmount; // 100% of the amount is used as stake
        uint256 feeAmount = 0; // The fee is zero
        
        // 1. Pull the Stake (100% of the amount) to this contract
        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "DM: Failed to delegate tokens");

        // 2. Add the delegation
        userDelegations[msg.sender].push(Delegation({
            amount: stakeAmount,
            unlockTime: block.timestamp + _lockDuration,
            lockDuration: _lockDuration,
            validator: _validatorAddress
        }));

        // 3. Update pStake
        uint256 pStake = _calculatePStake(stakeAmount, _lockDuration);
        totalNetworkPStake += pStake;
        validators[_validatorAddress].totalPStake += pStake;
        validators[_validatorAddress].totalDelegatedAmount += stakeAmount;
        userTotalPStake[msg.sender] += pStake;
        
        delegatorRewardDebt[msg.sender] = userTotalPStake[msg.sender] * accDelegatorRewardPerStake / 1e18;
        emit Delegated(msg.sender, _validatorAddress, userDelegations[msg.sender].length - 1, stakeAmount, feeAmount);
    }

    /**
     * @notice Unstakes a delegation (after lockup ends).
     * @dev CHANGED: The fee (BIPS) is fetched from the Hub.
     */
    function unstake(uint256 _delegationIndex) external nonReentrant {
        _claimDelegatorReward(msg.sender); // Claims pending rewards (which will be taxed)
        
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        require(block.timestamp >= d.unlockTime, "DM: Lock period not over");

        uint256 pStakeToRemove = _calculatePStake(d.amount, d.lockDuration);
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= d.amount;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        // Fetch fee (in BIPS) from the Hub
        uint256 feeBips = ecosystemManager.getFee("UNSTAKE_FEE_BIPS");
        uint256 feeAmount = (d.amount * feeBips) / 10000;
        uint256 amountToUser = d.amount - feeAmount;

        if (feeAmount > 0) {
            _distributeFees(feeAmount);
        }
        
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();
        
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to transfer tokens back");
        delegatorRewardDebt[msg.sender] = userTotalPStake[msg.sender] * accDelegatorRewardPerStake / 1e18;

        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }
    
    /**
     * @notice Force unstakes a delegation (before lockup ends).
     * @dev CHANGED: The penalty (BIPS) is fetched from the Hub.
     * @dev NEW V4: Accepts boosterTokenId to apply discount to the penalty.
     * @param _delegationIndex The index of the delegation to force unstake.
     * @param _boosterTokenId The user's Booster NFT token ID (0 if none) to get a discount.
     */
    function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external nonReentrant {
        _claimDelegatorReward(msg.sender); // Claims pending rewards (which will be taxed)
        
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        require(block.timestamp < d.unlockTime, "DM: Delegation is already unlocked, use regular unstake");

        uint256 originalAmount = d.amount;
        
        // --- NEW DISCOUNT LOGIC ---
        // 1. Fetch base penalty from Hub
        uint256 basePenaltyBips = ecosystemManager.getFee("FORCE_UNSTAKE_PENALTY_BIPS");
        uint256 discountBips = 0;

        // 2. Fetch booster address from Hub
        address rewardBoosterAddress = ecosystemManager.getBoosterAddress();

        // 3. Check for discount (logic from NFTLiquidityPool)
        if (_boosterTokenId > 0 && rewardBoosterAddress != address(0)) {
            // We use a try/catch block to safely check NFT ownership
            // without reverting the entire transaction if the token is invalid.
            try IRewardBoosterNFT(rewardBoosterAddress).ownerOf(_boosterTokenId) returns (address owner) {
                if (owner == msg.sender) {
                    uint256 userBoostBips = IRewardBoosterNFT(rewardBoosterAddress).boostBips(_boosterTokenId);
                    // Get the IMMUTABLE discount from the Hub
                    discountBips = ecosystemManager.getBoosterDiscount(userBoostBips);
                }
            } catch {
                // Ignore if booster is invalid or ownerOf fails
            }
        }

        // 4. Calculate final penalty
        uint256 finalPenaltyBips = (basePenaltyBips > discountBips) ? (basePenaltyBips - discountBips) : 0;
        
        // 5. Apply final penalty
        uint256 penaltyAmount = (originalAmount * finalPenaltyBips) / 10000;
        uint256 amountToUser = originalAmount - penaltyAmount;
        // --- END OF NEW LOGIC ---
        
        uint256 pStakeToRemove = _calculatePStake(originalAmount, d.lockDuration);
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= originalAmount;
        userTotalPStake[msg.sender] -= pStakeToRemove;

        if (penaltyAmount > 0) {
            _distributeFees(penaltyAmount);
        }
        
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to return tokens to user");
        
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();
        
        delegatorRewardDebt[msg.sender] = userTotalPStake[msg.sender] * accDelegatorRewardPerStake / 1e18;
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    // --- Internal 50/50 fee distribution function ---
    function _distributeFees(uint256 _amount) internal {
        if (_amount == 0) return;
        
        address treasury = ecosystemManager.getTreasuryAddress();
        require(treasury != address(0), "DM: Treasury not set in Hub");

        uint256 treasuryAmount = _amount / 2;
        uint256 delegatorAmount = _amount - treasuryAmount;

        if (treasuryAmount > 0) {
            // 1. Send 50% to Treasury
            require(bkcToken.transfer(treasury, treasuryAmount), "DM: Fee to Treasury failed");
        }

        if (delegatorAmount > 0) {
            // 2. Add 50% to the reward pool (internal logic)
            _depositRewards(delegatorAmount);
        }
    }
    
    // --- Reward Functions (CHANGED) ---

    // Internal function that ONLY does the math
    function _depositRewards(uint256 _delegatorAmount) internal {
        if (_delegatorAmount > 0 && totalNetworkPStake > 0) {
            accDelegatorRewardPerStake += (_delegatorAmount * 1e18) / totalNetworkPStake;
            emit RewardsDeposited(address(this), 0, _delegatorAmount);
        }
    }

    // External function that PULLS tokens (called by other contracts like Notary)
    function depositRewards(uint256 _validatorAmount, uint256 _delegatorAmount) external nonReentrant {
        if (_validatorAmount > 0) {
            // (Validator logic not implemented)
        }

        if (_delegatorAmount > 0) {
            // BUG FIX: Pull funds from the service contract (e.g., Notary)
            require(
                bkcToken.transferFrom(msg.sender, address(this), _delegatorAmount),
                "DM: Failed to pull delegator rewards"
            );
            _depositRewards(_delegatorAmount);
        } else {
             emit RewardsDeposited(msg.sender, _validatorAmount, 0);
        }
    }

    // Public claim function
    function claimDelegatorReward() external nonReentrant {
        _claimDelegatorReward(msg.sender);
    }
    
    /**
     * @notice Claims pending rewards for the user.
     * @dev CHANGED: This function now charges a fee (BIPS) defined in the Hub.
     */
    function _claimDelegatorReward(address _user) internal {
        uint256 pending = pendingDelegatorRewards(_user);
        if (pending > 0) {
            // --- NEW FEE LOGIC ---
            // 1. Get the fee (in BIPS) from the Hub
            uint256 feeBips = ecosystemManager.getFee("CLAIM_REWARD_FEE_BIPS");
            uint256 feeAmount = (pending * feeBips) / 10000;
            uint256 amountToUser = pending - feeAmount;

            // 2. Update the reward debt (always with the total pending amount)
            delegatorRewardDebt[_user] = userTotalPStake[_user] * accDelegatorRewardPerStake / 1e18;

            // 3. Distribute the fee (50/50)
            if (feeAmount > 0) {
                _distributeFees(feeAmount);
            }

            // 4. Pay the net amount to the user
            if (amountToUser > 0) {
                require(bkcToken.transfer(_user, amountToUser), "DM: Failed to transfer delegator rewards");
            }
            
            emit DelegatorRewardClaimed(_user, amountToUser);
        }
    }
    
    // --- View Functions ---
    
    function pendingDelegatorRewards(address _user) public view returns (uint256) {
        return (userTotalPStake[_user] * accDelegatorRewardPerStake / 1e18) - delegatorRewardDebt[_user];
    }
    
    function _calculatePStake(uint256 _amount, uint256 _lockDuration) internal pure returns (uint256) {
        uint256 amountInEther = _amount / 1e18;
        return (amountInEther * (_lockDuration / 1 days));
    }
    
    function getDelegationsOf(address _user) external view returns (Delegation[] memory) {
        return userDelegations[_user];
    }

    function getAllValidators() external view returns (address[] memory) {
        return validatorsArray;
    }
}