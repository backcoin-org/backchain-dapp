// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./IInterfaces.sol";
import "./BKCToken.sol";

contract FortunePool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    IDelegationManager public delegationManager;
    // VARIÁVEL DE ESTADO
    address public miningManagerAddress; 

    address public oracleAddress;
    uint256 public oracleFeeInWei;
    uint256 public gameCounter;

    // Total fee taken from the user's game value (10%)
    uint256 public constant TOTAL_FEE_BIPS = 1000;
    uint256 public constant TOTAL_BIPS = 10000;
    uint256 public constant MAX_PRIZE_PAYOUT_BIPS = 5000;

    struct PrizeTier {
        bool isInitialized;
        uint256 chanceDenominator;
        uint256 multiplierBips;
    }
    mapping(uint256 => PrizeTier) public prizeTiers;
    uint256 public prizePoolBalance;
    uint256 public activeTierCount;
    mapping(uint256 => uint256[3]) public gameResults;

    event TierCreated(uint256 indexed tierId, uint256 chance, uint256 multiplier);
    event PrizePoolToppedUp(uint256 amount);
    event OracleAddressSet(address indexed oracle);
    event OracleFeeSet(uint256 newFeeInWei);
    event GameRequested(uint256 indexed gameId, address indexed user, uint256 purchaseAmount);
    event GameFulfilled(
        uint256 indexed gameId,
        address indexed user,
        uint256 prizeWon,
        uint256[3] rolls
    );

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(
            _ecosystemManagerAddress != address(0),
            "FP: EcosystemManager cannot be zero"
        );
        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();
        
        require(
            _bkcTokenAddress != address(0) &&
                _dmAddress != address(0) &&
                _miningManagerAddr != address(0),
            "FP: Core contracts not set in Brain"
        );
        
        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr; // Usa a variável de estado
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setOracleAddress(address _oracle) external onlyOwner {
        require(_oracle != address(0), "FP: Oracle cannot be zero address");
        oracleAddress = _oracle;
        emit OracleAddressSet(_oracle);
    }
    
    function setOracleFee(uint256 _feeInWei) external onlyOwner {
        oracleFeeInWei = _feeInWei;
        emit OracleFeeSet(_feeInWei);
    }

    function setPrizeTier(
        uint256 _tierId,
        uint256 _chanceDenominator,
        uint256 _multiplierBips
    ) external onlyOwner {
        require(_tierId > 0 && _tierId < 10, "FP: Invalid tier ID (1-9)");
        if (!prizeTiers[_tierId].isInitialized) {
            activeTierCount++;
        }
        prizeTiers[_tierId].isInitialized = true;
        prizeTiers[_tierId].chanceDenominator = _chanceDenominator;
        prizeTiers[_tierId].multiplierBips = _multiplierBips;
        emit TierCreated(_tierId, _chanceDenominator, _multiplierBips);
    }

    function topUpPool(uint256 _amount) external onlyOwner {
        require(_amount > 0, "FP: Amount must be greater than zero");
        bkcToken.transferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(_amount);
        emit PrizePoolToppedUp(_amount);
    }

    function emergencyWithdraw() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        require(treasury != address(0), "FP: Treasury not set in Brain");
        uint256 totalBalance = prizePoolBalance;
        prizePoolBalance = 0;
        if (totalBalance > 0) {
            bkcToken.transfer(treasury, totalBalance);
        }
    }

    function participate(uint256 _amount) external payable nonReentrant {
        require(_amount > 0, "FP: Amount must be greater than zero");
        require(msg.value == oracleFeeInWei, "FP: Invalid native fee sent for Oracle");
        
        (bool sent, ) = oracleAddress.call{value: msg.value}("");
        require(sent, "FP: Failed to forward fee to Oracle");

        uint256 purchaseAmount = _processFeesAndMining(_amount);
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        emit GameRequested(newGameId, msg.sender, purchaseAmount);
    }
    
    function fulfillGame(
        uint256 _gameId,
        address _user,
        uint256 _purchaseAmount,
        uint256 _randomNumber
    ) external nonReentrant {
        require(msg.sender == oracleAddress, "FP: Caller is not the authorized Oracle");
        require(gameResults[_gameId][0] == 0, "FP: Game already fulfilled");

        uint256 highestPrizeWon = 0;
        uint256[3] memory rolls;
        
        for (uint256 tierId = 1; tierId <= activeTierCount; tierId++) {
            PrizeTier storage tier = prizeTiers[tierId];
            if (tier.isInitialized && prizePoolBalance > 0) {
                uint256 roll = (uint256(keccak256(abi.encodePacked(_randomNumber, tierId))) % tier.chanceDenominator) + 1;
                if(tierId <= 3) { rolls[tierId-1] = roll; } 

                if (roll == 1) { 
                    uint256 maxPrizeMultiplier = (_purchaseAmount * tier.multiplierBips) / TOTAL_BIPS;
                    uint256 maxPrizeSustainability = (prizePoolBalance * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
                    uint256 prizeAmount = (maxPrizeMultiplier < maxPrizeSustainability)
                        ? maxPrizeMultiplier
                        : maxPrizeSustainability;
                    if (prizeAmount > highestPrizeWon) {
                        highestPrizeWon = prizeAmount;
                    }
                }
            }
        }

        gameResults[_gameId] = rolls;
        
        if (highestPrizeWon > 0) {
            prizePoolBalance -= highestPrizeWon;
            bkcToken.transfer(_user, highestPrizeWon);
        }

        emit GameFulfilled(_gameId, _user, highestPrizeWon, rolls);
    }

    /**
     * @notice Internal function to process user's BKC commitment.
     * @dev Splits amount into Prize Pool (90%) and Fees (10%).
     * @dev The 10% fee is transferred to MiningManager for PoP and fee distribution.
     */
    function _processFeesAndMining(uint256 _amount) internal nonReentrant returns (uint256 purchaseAmount) {
        // 1. Calculate 90% for Prize Pool and 10% for Fees/PoP
        uint256 totalFee = (_amount * TOTAL_FEE_BIPS) / TOTAL_BIPS;
        uint256 prizePoolAmount = _amount - totalFee;
        purchaseAmount = totalFee; // The PoP amount is the 10% fee

        // ✅ CORREÇÃO APLICADA: Uso direto da variável de estado 'miningManagerAddress'
        require(miningManagerAddress != address(0), "FP: MM not set in Brain");

        // 2. Pull total amount from user
        bkcToken.transferFrom(msg.sender, address(this), _amount);

        // 3. Add 90% to the Prize Pool
        _addAmountToPool(prizePoolAmount);
        
        // 4. Transfer the PoP amount (10% fee) to the Mining Manager
        // This triggers the universal revenue funnel.
        require(
            bkcToken.transfer(miningManagerAddress, purchaseAmount),
            "FP: Transfer to MiningManager failed"
        );
        
        // 5. Call MiningManager (no longer returns a bonus)
        IMiningManager(miningManagerAddress)
            .performPurchaseMining("TIGER_GAME_SERVICE", purchaseAmount);
        
        return purchaseAmount;
    }
    
    function _addAmountToPool(uint256 _amount) internal {
        if (_amount == 0) return;
        
        // If no tiers are set, send funds to treasury to prevent locking
        if (activeTierCount == 0) {
            address treasury = ecosystemManager.getTreasuryAddress();
            require(treasury != address(0), "FP: Treasury not set in Brain");
            bkcToken.transfer(treasury, _amount);
            return;
        }
        
        prizePoolBalance += _amount;
    }
}