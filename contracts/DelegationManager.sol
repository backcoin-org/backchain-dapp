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
    uint256 public constant VALIDATOR_LOCK_DURATION = 1825 days;
    
    uint256 private constant E18 = 10**18;
    string public constant VALIDATOR_REGISTRATION_KEY = "VALIDATOR_REGISTRATION_FEE";
    
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

    // REMOVIDO: mapping(address => bool) public hasPaidRegistrationFee;
    mapping(address => Validator) public validators;
    address[] public validatorsArray;
    uint256 public totalValidatorSelfStake; 
    uint256 public accValidatorRewardPerStake;
    mapping(address => uint256) public validatorRewardDebt;
    mapping(address => Delegation[]) public userDelegations;
    mapping(address => uint256) public userTotalPStake;
    uint256 public totalNetworkPStake;
    uint256 public accDelegatorRewardPerStake;
    mapping(address => uint256) public delegatorRewardDebt;
    mapping(address => uint256) public pendingRegistrationBonus; // Bônus de registro não reivindicado
    
    // Eventos ajustados
    event ValidatorRegistered(address indexed validator, uint256 selfStake, uint256 feePaid); // ADD feePaid
    event ValidatorUnregistered(address indexed validator, uint256 selfStakeReturned);
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

    function depositMiningRewards(
        uint256 _validatorShare,
        uint256 _delegatorShare
    ) external nonReentrant {
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

    function depositRewards(uint256, uint256 _delegatorAmount)
        external
        nonReentrant
    {
        if (_delegatorAmount > 0) {
            require(
                bkcToken.transferFrom(msg.sender, address(this), _delegatorAmount),
                "DM: Failed to pull delegator rewards"
            );
            
            if (totalNetworkPStake > 0) {
                accDelegatorRewardPerStake +=
                    (_delegatorAmount * E18) / totalNetworkPStake;
            }
            emit RewardsDeposited(msg.sender, 0, _delegatorAmount);
        }
    }
    
    // REMOVIDO: function payRegistrationFee() ... { ... }
    
    function claimRegistrationBonus() external nonReentrant {
        uint256 amount = pendingRegistrationBonus[msg.sender];
        require(amount > 0, "DM: No pending bonus to claim");
        
        pendingRegistrationBonus[msg.sender] = 0;
        
        require(bkcToken.transfer(msg.sender, amount), "DM: Bonus transfer failed");
        emit RegistrationBonusClaimed(msg.sender, amount);
    }

    // FUNDIDO: Lógica de payRegistrationFee() movida para cá.
    function registerValidator(address _validatorAddress) external nonReentrant {
        require(msg.sender == _validatorAddress, "DM: Can only register self");
        require(!validators[_validatorAddress].isRegistered, "DM: Validator already registered");
        
        // 1. Cobrança da Taxa (Lógica movida de payRegistrationFee)
        uint256 feeToPay = ecosystemManager.getFee(VALIDATOR_REGISTRATION_KEY);
        require(feeToPay > 0, "DM: Registration fee is zero or not configured");
        
        // 1.1. Transferir Taxa TOTAL do Usuário para o DM
        require(
            bkcToken.transferFrom(msg.sender, address(this), feeToPay),
            "DM: Fee transfer failed or insufficient allowance"
        );

        // 1.2. Distribuição Simples da Taxa
        address treasury = ecosystemManager.getTreasuryAddress();
        require(treasury != address(0), "DM: Treasury not set in Hub");
        
        uint256 treasuryAmount = feeToPay / 2;
        uint256 delegatorAmount = feeToPay - treasuryAmount;

        // 1.3. Transferência para Tesouraria
        if (treasuryAmount > 0) {
            // Transferência direta do DM (que recebeu os tokens)
            require(bkcToken.transfer(treasury, treasuryAmount), "DM: Fee to Treasury failed");
        }
        
        // 1.4. Transferência para o Pool de Delegadores (Acumula em accDelegatorRewardPerStake)
        if (delegatorAmount > 0) {
            if (totalNetworkPStake > 0) {
                 accDelegatorRewardPerStake += (delegatorAmount * E18) / totalNetworkPStake;
            }
            emit RewardsDeposited(address(this), 0, delegatorAmount);
        }
        
        // 2. Registro do Validador
        
        // Claim de recompensas (para atualizar o debt antes do registro)
        _claimDelegatorReward(msg.sender, 0);

        validators[_validatorAddress] = Validator({
            isRegistered: true,
            selfStakeAmount: 0, // Stake é ZERO
            selfStakeUnlockTime: block.timestamp, // Desbloqueio Imediato (sem stake)
            totalPStake: 0,
            totalDelegatedAmount: 0
        });
        validatorsArray.push(_validatorAddress);

        // 3. Emite o evento de Registro
        emit ValidatorRegistered(_validatorAddress, 0, feeToPay); // ADD feePaid
    }

    // ... (restante das funções inalteradas, pois não dependem de hasPaidRegistrationFee) ...
    function delegate(
        address _validatorAddress, 
        uint256 _totalAmount, 
        uint256 _lockDuration,
        uint256 _boosterTokenId 
    ) external nonReentrant {
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        require(validators[_validatorAddress].isRegistered, "DM: Invalid validator");
        require(_totalAmount > 0, "DM: Invalid amount");
        require(
            _lockDuration >= MIN_LOCK_DURATION && _lockDuration <= MAX_LOCK_DURATION,
            "DM: Invalid lock duration"
        );
        uint256 stakeAmount = _totalAmount; 
        uint256 feeAmount = 0; 
        
        require(bkcToken.transferFrom(msg.sender, address(this), stakeAmount), "DM: Failed to delegate tokens");

        uint256 delegationIndex = userDelegations[msg.sender].length;
        userDelegations[msg.sender].push(Delegation({
            amount: stakeAmount,
            unlockTime: block.timestamp + _lockDuration,
            lockDuration: _lockDuration,
            validator: _validatorAddress
        }));
        uint256 pStake = _calculatePStake(stakeAmount, _lockDuration);
        totalNetworkPStake += pStake;
        validators[_validatorAddress].totalPStake += pStake;
        validators[_validatorAddress].totalDelegatedAmount += stakeAmount;
        userTotalPStake[msg.sender] += pStake;
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;

        emit Delegated(msg.sender, _validatorAddress, delegationIndex, stakeAmount, feeAmount);
    }

    function unstake(
        uint256 _delegationIndex, 
        uint256 _boosterTokenId 
    ) external nonReentrant {
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        require(block.timestamp >= d.unlockTime, "DM: Lock period not over");
        
        uint256 pStakeToRemove = _calculatePStake(d.amount, d.lockDuration);
        uint256 feeBips = ecosystemManager.getFee("UNSTAKE_FEE_BIPS");
        uint256 finalFeeBips = _applyBoosterDiscount(feeBips, _boosterTokenId);
        
        uint256 feeAmount = (d.amount * finalFeeBips) / 10000;
        uint256 amountToUser = d.amount - feeAmount;
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= d.amount;
        userTotalPStake[msg.sender] -= pStakeToRemove;
        if (feeAmount > 0) {
            _distributeFees(feeAmount);
        }

        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();

        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to transfer tokens back");
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;
        // CORREÇÃO: Remove d.pStakeValue
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, feeAmount);
    }

    function forceUnstake(uint256 _delegationIndex, uint256 _boosterTokenId) external nonReentrant {
        _claimDelegatorReward(msg.sender, _boosterTokenId);
        Delegation[] storage delegationsOfUser = userDelegations[msg.sender];
        require(_delegationIndex < delegationsOfUser.length, "DM: Invalid index");
        
        Delegation storage d = delegationsOfUser[_delegationIndex];
        require(
            block.timestamp < d.unlockTime,
            "DM: Delegation is unlocked, use regular unstake"
        );
        uint256 originalAmount = d.amount;

        uint256 basePenaltyBips = ecosystemManager.getFee("FORCE_UNSTAKE_PENALTY_BIPS");
        uint256 finalPenaltyBips = _applyBoosterDiscount(basePenaltyBips, _boosterTokenId);
        uint256 penaltyAmount = (originalAmount * finalPenaltyBips) / 10000;
        uint256 amountToUser = originalAmount - penaltyAmount;
        uint256 pStakeToRemove = _calculatePStake(originalAmount, d.lockDuration);
        totalNetworkPStake -= pStakeToRemove;
        validators[d.validator].totalPStake -= pStakeToRemove;
        validators[d.validator].totalDelegatedAmount -= originalAmount;
        userTotalPStake[msg.sender] -= pStakeToRemove;
        if (penaltyAmount > 0) {
            _distributeFees(penaltyAmount);
        }
        
        if (delegationsOfUser.length > 1 && _delegationIndex != delegationsOfUser.length - 1) {
            delegationsOfUser[_delegationIndex] = delegationsOfUser[delegationsOfUser.length - 1];
        }
        delegationsOfUser.pop();
        
        require(bkcToken.transfer(msg.sender, amountToUser), "DM: Failed to return tokens to user");
        delegatorRewardDebt[msg.sender] = (userTotalPStake[msg.sender] * accDelegatorRewardPerStake) / E18;
        // CORREÇÃO: Remove d.pStakeValue
        emit Unstaked(msg.sender, _delegationIndex, amountToUser, penaltyAmount);
    }

    function claimDelegatorReward(uint256 _boosterTokenId) external nonReentrant {
        _claimDelegatorReward(msg.sender, _boosterTokenId);
    }

    function claimValidatorReward() external nonReentrant {
        address _validator = msg.sender;
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

    function _claimDelegatorReward(address _user, uint256 _boosterTokenId) internal {
        uint256 pending = pendingDelegatorRewards(_user);
        if (pending > 0) {
            uint256 baseFeeBips = ecosystemManager.getFee("CLAIM_REWARD_FEE_BIPS");
            uint256 finalFeeBips = _applyBoosterDiscount(baseFeeBips, _boosterTokenId);

            uint256 feeAmount = (pending * finalFeeBips) / 10000;
            uint256 amountToUser = pending - feeAmount;
            delegatorRewardDebt[_user] = (userTotalPStake[_user] * accDelegatorRewardPerStake) / E18;

            if (feeAmount > 0) {
                _distributeFees(feeAmount);
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

    function _distributeFees(uint256 _amount) internal {
        if (_amount == 0) return;
        address treasury = ecosystemManager.getTreasuryAddress();
        require(treasury != address(0), "DM: Treasury not set in Brain");

        uint256 treasuryAmount = _amount / 2;
        uint256 delegatorAmount = _amount - treasuryAmount;

        if (treasuryAmount > 0) {
            require(
                bkcToken.transfer(treasury, treasuryAmount),
                "DM: Fee to Treasury failed"
            );
        }

        if (delegatorAmount > 0) {
            if (totalNetworkPStake > 0) {
                 accDelegatorRewardPerStake += (delegatorAmount * E18) / totalNetworkPStake;
            }
            emit RewardsDeposited(address(this), 0, delegatorAmount);
        }
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
        }
        return _baseFeeBips;
    }

    function _calculatePStake(uint256 _amount, uint256 _lockDuration)
        internal
        pure
        returns (uint256)
    {
        return (_amount * (_lockDuration / 1 days)) / E18;
    }

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