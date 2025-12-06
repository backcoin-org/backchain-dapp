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
 * @title Fortune Pool (Strategic Betting)
 * @notice A skill-based prediction game fueled by Backcoin ($BKC).
 * @dev Users predict 3 numbers. Fees trigger the Proof-of-Purchase mining mechanism.
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

    struct PrizeTier {
        uint128 chanceDenominator; // Max range (3, 10, 100)
        uint64 multiplierBips;     // Reward multiplier (3x, 10x, 100x)
        bool isInitialized;
    }

    // NEW: Stores user guesses pending oracle resolution
    struct GameRequest {
        address user;
        uint256 purchaseAmount;
        uint8[3] guesses; // User predictions [1-3, 1-10, 1-100]
        bool isCumulative; // True = All wins paid; False = Highest win only
    }

    mapping(uint256 => PrizeTier) public prizeTiers;
    mapping(uint256 => GameRequest) public pendingGames; // Store pending requests
    mapping(uint256 => uint256[3]) public gameResults;   // Store final rolls

    uint256 public prizePoolBalance;
    uint256 public activeTierCount;
    
    // Constants
    uint256 public constant TOTAL_FEE_BIPS = 1000; // 10% Fee
    uint256 public constant TOTAL_BIPS = 10000;
    uint256 public constant MAX_PRIZE_PAYOUT_BIPS = 5000; // Max 50% of pool per win
    
    // Service Key
    bytes32 public constant SERVICE_KEY = keccak256("TIGER_GAME_SERVICE");

    // --- Events ---

    event TierCreated(uint256 indexed tierId, uint256 chance, uint256 multiplier);
    event PrizePoolToppedUp(uint256 amount);
    event OracleAddressSet(address indexed oracle);
    event OracleFeeSet(uint256 newFeeInWei);
    
    event GameRequested(
        uint256 indexed gameId, 
        address indexed user, 
        uint256 purchaseAmount,
        uint8[3] guesses,
        bool isCumulative
    );
    
    event GameFulfilled(
        uint256 indexed gameId,
        address indexed user,
        uint256 prizeWon,
        uint256[3] rolls,
        uint8[3] guesses
    );

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidTierID();
    error InvalidGuess();
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
        if (_tierId == 0 || _tierId > 3) revert InvalidTierID(); // Limit to 3 tiers for UI consistency
        
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

    /**
     * @notice Play the game by submitting guesses.
     * @param _amount Amount of BKC to wager.
     * @param _guesses Array of 3 numbers [1-3, 1-10, 1-100].
     * @param _isCumulative If true, pays ALL wins (riskier). If false, pays HIGHEST win.
     */
    function participate(
        uint256 _amount, 
        uint8[3] calldata _guesses, 
        bool _isCumulative
    ) external payable nonReentrant {
        if (_amount == 0) revert InvalidAmount();
        
        // Validate Guesses
        if (_guesses[0] < 1 || _guesses[0] > 3) revert InvalidGuess();
        if (_guesses[1] < 1 || _guesses[1] > 10) revert InvalidGuess();
        if (_guesses[2] < 1 || _guesses[2] > 100) revert InvalidGuess();

        // Calculate Oracle Fee (5x for Cumulative Mode to prevent spam/exploit)
        uint256 requiredFee = _isCumulative ? oracleFeeInWei * 5 : oracleFeeInWei;
        if (msg.value != requiredFee) revert InvalidFee();
        
        // Forward native fee to Oracle
        (bool sent, ) = oracleAddress.call{value: msg.value}("");
        if (!sent) revert OracleTransferFailed();

        // Process BKC (90% Pool / 10% Mining)
        uint256 purchaseAmount = _processFeesAndMining(_amount);
        
        unchecked {
            gameCounter++;
        }
        
        // Store request for fulfillment
        pendingGames[gameCounter] = GameRequest({
            user: msg.sender,
            purchaseAmount: purchaseAmount, // This is the NET wager used for calculation
            guesses: _guesses,
            isCumulative: _isCumulative
        });
        
        emit GameRequested(gameCounter, msg.sender, purchaseAmount, _guesses, _isCumulative);
    }
    
    function fulfillGame(
        uint256 _gameId,
        uint256 _randomNumber
    ) external nonReentrant {
        if (msg.sender != oracleAddress) revert Unauthorized();
        if (gameResults[_gameId][0] != 0) revert GameAlreadyFulfilled();

        GameRequest memory request = pendingGames[_gameId];
        if (request.user == address(0)) revert Unauthorized(); // Invalid game ID

        uint256 totalPrize = 0;
        uint256[3] memory rolls;
        uint256 currentPool = prizePoolBalance;

        // Process 3 Tiers
        for (uint256 i = 1; i <= 3; i++) {
            PrizeTier memory tier = prizeTiers[i];
            if (!tier.isInitialized) continue;

            // Generate Roll
            uint256 roll = (uint256(keccak256(abi.encodePacked(_randomNumber, i))) % tier.chanceDenominator) + 1;
            rolls[i-1] = roll;

            // Check Win (User Guess vs Oracle Roll)
            if (request.guesses[i-1] == roll) {
                uint256 winAmount = (request.purchaseAmount * tier.multiplierBips) / TOTAL_BIPS;
                
                if (request.isCumulative) {
                    totalPrize += winAmount;
                } else {
                    // Keep only the highest single win
                    if (winAmount > totalPrize) {
                        totalPrize = winAmount;
                    }
                }
            }
        }

        // Safety Cap (Max 50% of pool total)
        uint256 maxPayout = (currentPool * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
        if (totalPrize > maxPayout) {
            totalPrize = maxPayout;
        }

        // Save Result
        gameResults[_gameId] = rolls;
        
        // Payout
        if (totalPrize > 0) {
            prizePoolBalance -= totalPrize;
            bkcToken.safeTransfer(request.user, totalPrize);
        }

        // Clean up storage (Gas Refund)
        delete pendingGames[_gameId];

        emit GameFulfilled(_gameId, request.user, totalPrize, rolls, request.guesses);
    }

    // --- Internal Helpers ---

    function _processFeesAndMining(uint256 _amount) internal returns (uint256 purchaseAmount) {
        uint256 totalFee = (_amount * TOTAL_FEE_BIPS) / TOTAL_BIPS;
        uint256 prizePoolAmount = _amount - totalFee;
        purchaseAmount = _amount; // NOTE: We base multipliers on the GROSS amount for UX simplicity

        if (miningManagerAddress == address(0)) revert CoreContractsNotSet();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(prizePoolAmount);
        
        // Fee Mining Logic
        bkcToken.safeTransfer(miningManagerAddress, totalFee);
        IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, totalFee);
            
        return purchaseAmount;
    }
    
    function _addAmountToPool(uint256 _amount) internal {
        if (_amount == 0) return;
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