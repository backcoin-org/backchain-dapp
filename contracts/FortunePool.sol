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
 * @title Fortune Pool (Tiger Game)
 * @notice An exciting chance-based game fueled by Backcoin ($BKC).
 * @dev Users spend $BKC to play. Fees trigger the Proof-of-Purchase mining mechanism.
 * Optimized for BNB Chain using storage packing and bytes32 keys.
 */
contract FortunePool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // --- State Variables ---

    IEcosystemManager public ecosystemManager;
    BKCToken public bkcToken;
    IDelegationManager public delegationManager;
    
    address public miningManagerAddress; 
    address public oracleAddress;

    uint256 public oracleFeeInWei;
    uint256 public gameCounter;

    // Optimized Struct: Fits entirely in 1 storage slot (32 bytes)
    // uint128 (16 bytes) + uint64 (8 bytes) + bool (1 byte) = 25 bytes < 32 bytes
    struct PrizeTier {
        uint128 chanceDenominator;
        uint64 multiplierBips;
        bool isInitialized;
    }

    mapping(uint256 => PrizeTier) public prizeTiers;
    uint256 public prizePoolBalance;
    uint256 public activeTierCount;
    
    // Stores the result rolls for transparency
    mapping(uint256 => uint256[3]) public gameResults;

    // Constants
    uint256 public constant TOTAL_FEE_BIPS = 1000; // 10% Fee
    uint256 public constant TOTAL_BIPS = 10000;
    uint256 public constant MAX_PRIZE_PAYOUT_BIPS = 5000; // Max 50% of pool per win
    
    // Optimized Service Key
    bytes32 public constant SERVICE_KEY = keccak256("TIGER_GAME_SERVICE");

    // --- Events ---

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

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidTierID();
    error OracleTransferFailed();
    error Unauthorized();
    error GameAlreadyFulfilled();
    error CoreContractsNotSet();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _ecosystemManagerAddress
    ) public initializer {
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_ecosystemManagerAddress == address(0)) revert InvalidAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        ecosystemManager = IEcosystemManager(_ecosystemManagerAddress);

        address _bkcTokenAddress = ecosystemManager.getBKCTokenAddress();
        address _dmAddress = ecosystemManager.getDelegationManagerAddress();
        address _miningManagerAddr = ecosystemManager.getMiningManagerAddress();

        if (
            _bkcTokenAddress == address(0) ||
            _dmAddress == address(0) ||
            _miningManagerAddr == address(0)
        ) revert CoreContractsNotSet();

        bkcToken = BKCToken(_bkcTokenAddress);
        delegationManager = IDelegationManager(_dmAddress);
        miningManagerAddress = _miningManagerAddr;
        
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---

    function setOracleAddress(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert InvalidAddress();
        oracleAddress = _oracle;
        emit OracleAddressSet(_oracle);
    }
    
    function setOracleFee(uint256 _feeInWei) external onlyOwner {
        oracleFeeInWei = _feeInWei;
        emit OracleFeeSet(_feeInWei);
    }

    function setPrizeTier(
        uint256 _tierId,
        uint128 _chanceDenominator,
        uint64 _multiplierBips
    ) external onlyOwner {
        if (_tierId == 0 || _tierId > 9) revert InvalidTierID();
        
        if (!prizeTiers[_tierId].isInitialized) {
            activeTierCount++;
        }
        
        prizeTiers[_tierId] = PrizeTier({
            chanceDenominator: _chanceDenominator,
            multiplierBips: _multiplierBips,
            isInitialized: true
        });

        emit TierCreated(_tierId, _chanceDenominator, _multiplierBips);
    }

    function topUpPool(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert InvalidAmount();
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(_amount);
        emit PrizePoolToppedUp(_amount);
    }

    function emergencyWithdraw() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) revert CoreContractsNotSet();
        
        uint256 totalBalance = prizePoolBalance;
        prizePoolBalance = 0;
        
        if (totalBalance > 0) {
            bkcToken.safeTransfer(treasury, totalBalance);
        }
    }

    // --- Game Logic ---

    function participate(uint256 _amount) external payable nonReentrant {
        if (_amount == 0) revert InvalidAmount();
        if (msg.value != oracleFeeInWei) revert InvalidFee();
        
        // Forward native fee (BNB) to Oracle
        (bool sent, ) = oracleAddress.call{value: msg.value}("");
        if (!sent) revert OracleTransferFailed();

        // Process Logic
        uint256 purchaseAmount = _processFeesAndMining(_amount);
        
        // Unchecked increment for gas savings
        unchecked {
            gameCounter++;
        }
        
        emit GameRequested(gameCounter, msg.sender, purchaseAmount);
    }
    
    function fulfillGame(
        uint256 _gameId,
        address _user,
        uint256 _purchaseAmount,
        uint256 _randomNumber
    ) external nonReentrant {
        // Only the trusted Oracle can fulfill
        if (msg.sender != oracleAddress) revert Unauthorized();
        if (gameResults[_gameId][0] != 0) revert GameAlreadyFulfilled();

        uint256 highestPrizeWon = 0;
        uint256[3] memory rolls;
        uint256 currentBalance = prizePoolBalance;

        // Use cached count to save gas
        uint256 tiers = activeTierCount;

        for (uint256 tierId = 1; tierId <= tiers;) {
            PrizeTier memory tier = prizeTiers[tierId]; // Read packed struct from storage once

            if (tier.isInitialized && currentBalance > 0) {
                // Pseudo-randomness is acceptable here as Oracle is trusted/controlled by dev
                uint256 roll = (uint256(keccak256(abi.encodePacked(_randomNumber, tierId))) % tier.chanceDenominator) + 1;
                
                // Record first 3 rolls for UI
                if (tierId <= 3) { 
                    rolls[tierId-1] = roll; 
                } 

                if (roll == 1) { 
                    uint256 potentialPrize = (_purchaseAmount * tier.multiplierBips) / TOTAL_BIPS;
                    
                    // Safety Cap: Max 50% of current pool
                    uint256 maxPayout = (currentBalance * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
                    
                    uint256 actualPrize = (potentialPrize > maxPayout) ? maxPayout : potentialPrize;

                    if (actualPrize > highestPrizeWon) {
                        highestPrizeWon = actualPrize;
                    }
                }
            }
            unchecked { ++tierId; }
        }

        // Register that game is complete by storing rolls
        // If no rolls happened (tier count 0), we store [1,1,1] just to mark as done to prevent reentrancy
        if (rolls[0] == 0 && rolls[1] == 0 && rolls[2] == 0) {
            rolls[0] = 999; 
        }
        gameResults[_gameId] = rolls;

        if (highestPrizeWon > 0) {
            // Update state before transfer
            prizePoolBalance -= highestPrizeWon;
            bkcToken.safeTransfer(_user, highestPrizeWon);
        }

        emit GameFulfilled(_gameId, _user, highestPrizeWon, rolls);
    }

    // --- Internal Helpers ---

    /**
     * @notice Splits user amount: 90% to Prize Pool, 10% to Mining/Fees.
     */
    function _processFeesAndMining(uint256 _amount) internal returns (uint256 purchaseAmount) {
        // 1. Calculate 10% Fee (This is the PoP amount)
        uint256 totalFee = (_amount * TOTAL_FEE_BIPS) / TOTAL_BIPS;
        uint256 prizePoolAmount = _amount - totalFee;
        purchaseAmount = totalFee;

        if (miningManagerAddress == address(0)) revert CoreContractsNotSet();

        // 2. Pull total amount from user
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // 3. Add 90% to the Prize Pool
        _addAmountToPool(prizePoolAmount);

        // 4. Transfer the PoP amount (10% fee) to the Mining Manager
        bkcToken.safeTransfer(miningManagerAddress, purchaseAmount);

        // 5. Trigger Mining Funnel ($BKC Mint + Fee Distro)
        // Using new bytes32 key interface
        IMiningManager(miningManagerAddress)
            .performPurchaseMining(SERVICE_KEY, purchaseAmount);
            
        return purchaseAmount;
    }
    
    function _addAmountToPool(uint256 _amount) internal {
        if (_amount == 0) return;
        // If no tiers are set, send funds to treasury to prevent locking funds forever
        if (activeTierCount == 0) {
            address treasury = ecosystemManager.getTreasuryAddress();
            if (treasury != address(0)) {
                bkcToken.safeTransfer(treasury, _amount);
                return;
            }
        }
        prizePoolBalance += _amount;
    }
}