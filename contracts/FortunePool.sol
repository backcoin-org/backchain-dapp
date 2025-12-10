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
 * @title Fortune Pool (Dynamic Strategic Betting) - V2.0
 * @notice A fully dynamic, skill-based prediction game fueled by Backcoin ($BKC).
 * @dev 
 * - Supports variable number of tiers and adjustable number ranges.
 * - Open Access: Anyone can play by paying the fee + wager.
 * - Proof-of-Purchase: Game fees trigger the MiningManager to mint new rewards.
 * - Oracle Integration: Uses an external oracle for randomness.
 * 
 * V2.0 Changes:
 * - Added getGameResults() for proper array retrieval
 * - Added getGameStatus() for comprehensive game state queries
 * - Added getPendingGame() for oracle verification
 * - Added isGameFulfilled() for quick status checks
 * - Improved error messages for better debugging
 * 
 * Part of the Backcoin Ecosystem.
 * Website: Backcoin.org
 * Optimized for Arbitrum Network.
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

    // --- Dynamic Game Fee ---
    uint256 public gameFeeBips;

    struct PrizeTier {
        uint128 range;          // Max number for this tier (e.g., 50 means range 1-50)
        uint64 multiplierBips;  // Reward multiplier (e.g., 20000 = 2x)
        bool isActive;          // Determines if the tier is currently in use
    }

    struct GameRequest {
        address user;
        uint256 purchaseAmount; // Net wager amount used for calculation
        uint256[] guesses;      // User predictions (Dynamic Array)
        bool isCumulative;      // True = All matching tiers pay; False = Highest tier only
    }

    // Mapping of Tier ID => Tier Config
    mapping(uint256 => PrizeTier) public prizeTiers;
    // Mapping of Game ID => Request Data
    mapping(uint256 => GameRequest) public pendingGames;
    // Mapping of Game ID => Result Rolls
    mapping(uint256 => uint256[]) public gameResults;

    uint256 public prizePoolBalance;
    uint256 public activeTierCount; // Tracks how many tiers are currently active (e.g., 3)

    // --- Constants ---
    uint256 public constant TOTAL_BIPS = 10000;
    uint256 public constant MAX_PRIZE_PAYOUT_BIPS = 5000; // Max 50% of pool per win
    
    // Service Key for MiningManager Authorization
    bytes32 public constant SERVICE_KEY = keccak256("TIGER_GAME_SERVICE");

    // --- Events ---

    event TierConfigured(uint256 indexed tierId, uint256 range, uint256 multiplier, bool isActive);
    event PrizePoolToppedUp(uint256 amount);
    event OracleAddressSet(address indexed oracle);
    event OracleFeeSet(uint256 newFeeInWei);
    event GameFeeSet(uint256 newFeeBips);
    event GameRequested(
        uint256 indexed gameId, 
        address indexed user, 
        uint256 purchaseAmount,
        uint256[] guesses,
        bool isCumulative
    );
    event GameFulfilled(
        uint256 indexed gameId,
        address indexed user,
        uint256 prizeWon,
        uint256[] rolls,
        uint256[] guesses
    );

    // --- Custom Errors ---

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidTierID();
    error InvalidTierSequence(); // Ensures tiers are set sequentially (1, 2, 3...)
    error InvalidGuessCount();   // User sent wrong number of guesses
    error InvalidGuessRange();   // Guess exceeds tier range
    error OracleTransferFailed();
    error Unauthorized();
    error GameAlreadyFulfilled();
    error GameNotFound();
    error CoreContractsNotSet();

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Fortune Pool contract.
     * @param _initialOwner The owner of this contract.
     * @param _ecosystemManagerAddress The address of the central hub.
     */
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
        
        // Default game fee: 10% (1000 BIPS)
        gameFeeBips = 1000;
        _transferOwnership(_initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Admin Functions ---

    /**
     * @notice Sets the Oracle address.
     * @param _oracle The EOA address that fulfills the game.
     */
    function setOracleAddress(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert InvalidAddress();
        oracleAddress = _oracle;
        emit OracleAddressSet(_oracle);
    }
    
    /**
     * @notice Sets the native ETH fee required to trigger the oracle.
     */
    function setOracleFee(uint256 _feeInWei) external onlyOwner {
        oracleFeeInWei = _feeInWei;
        emit OracleFeeSet(_feeInWei);
    }

    /**
     * @notice Sets the fee taken from the BKC wager.
     * @param _newFeeBips Fee in Basis Points (Max 3000 = 30%).
     */
    function setGameFee(uint256 _newFeeBips) external onlyOwner {
        if (_newFeeBips > 3000) revert InvalidFee();
        gameFeeBips = _newFeeBips;
        emit GameFeeSet(_newFeeBips);
    }

    /**
     * @notice Configures a prize tier.
     * Must be done sequentially (1, then 2, etc.) to ensure loop integrity.
     * @param _tierId The ID of the tier (must be activeCount + 1 for new tiers).
     * @param _range The max number for this tier (e.g., 50 for 1-50).
     * @param _multiplierBips The reward multiplier.
     */
    function setPrizeTier(
        uint256 _tierId,
        uint128 _range,
        uint64 _multiplierBips
    ) external onlyOwner {
        if (_tierId == 0) revert InvalidTierID();
        if (_range == 0) revert InvalidAmount();

        // Ensure no gaps in tiers (cannot set Tier 3 if Active Count is 1)
        if (_tierId > activeTierCount + 1) revert InvalidTierSequence();

        // Update active count if adding a new tier
        if (_tierId > activeTierCount) {
            activeTierCount = _tierId;
        }
        
        prizeTiers[_tierId] = PrizeTier({
            range: _range,
            multiplierBips: _multiplierBips,
            isActive: true
        });
        emit TierConfigured(_tierId, _range, _multiplierBips, true);
    }

    /**
     * @notice Reduces the active tier count (removes highest tiers).
     * @param _newCount The new number of active tiers.
     */
    function setActiveTierCount(uint256 _newCount) external onlyOwner {
        // Can only reduce count here. To increase, use setPrizeTier.
        if (_newCount >= activeTierCount) revert InvalidTierSequence();
        activeTierCount = _newCount;
    }

    /**
     * @notice Top up the prize pool with BKC.
     */
    function topUpPool(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert InvalidAmount();
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(_amount);
        emit PrizePoolToppedUp(_amount);
    }

    /**
     * @notice Emergency withdraw of pool balance.
     */
    function emergencyWithdraw() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) revert CoreContractsNotSet();
        
        uint256 totalBalance = prizePoolBalance;
        prizePoolBalance = 0;
        if (totalBalance > 0) {
            bkcToken.safeTransfer(treasury, totalBalance);
        }
    }

    // =========================================================================
    // VIEW FUNCTIONS (V2.0 - Oracle & Frontend Support)
    // =========================================================================

    /**
     * @notice Returns the complete result rolls array for a game.
     * @dev This is the proper way to retrieve dynamic arrays from mappings.
     * @param _gameId The ID of the game to query.
     * @return rolls The array of dice rolls. Empty array if game not yet fulfilled.
     */
    function getGameResults(uint256 _gameId) external view returns (uint256[] memory rolls) {
        return gameResults[_gameId];
    }

    /**
     * @notice Checks if a game has been fulfilled.
     * @dev Used by oracles to avoid double-processing.
     * @param _gameId The ID of the game to check.
     * @return True if game has results, false otherwise.
     */
    function isGameFulfilled(uint256 _gameId) external view returns (bool) {
        return gameResults[_gameId].length > 0;
    }

    /**
     * @notice Returns the pending game request data.
     * @dev Useful for oracle to verify game exists before processing.
     * @param _gameId The ID of the game.
     * @return user The player's address (address(0) if not found or already processed).
     * @return purchaseAmount The wager amount.
     * @return guesses The player's guesses array.
     * @return isCumulative The game mode.
     */
    function getPendingGame(uint256 _gameId) external view returns (
        address user,
        uint256 purchaseAmount,
        uint256[] memory guesses,
        bool isCumulative
    ) {
        GameRequest storage req = pendingGames[_gameId];
        return (req.user, req.purchaseAmount, req.guesses, req.isCumulative);
    }

    /**
     * @notice Comprehensive game status for frontends and oracles.
     * @param _gameId The ID of the game.
     * @return exists True if game was ever created.
     * @return fulfilled True if game has been processed by oracle.
     * @return pending True if game is waiting for oracle.
     * @return user The player's address.
     * @return results The result rolls (empty if not fulfilled).
     */
    function getGameStatus(uint256 _gameId) external view returns (
        bool exists,
        bool fulfilled,
        bool pending,
        address user,
        uint256[] memory results
    ) {
        GameRequest storage req = pendingGames[_gameId];
        uint256[] storage res = gameResults[_gameId];
        
        // Game exists if it has results OR has a pending request
        exists = res.length > 0 || req.user != address(0);
        fulfilled = res.length > 0;
        pending = req.user != address(0) && res.length == 0;
        user = req.user != address(0) ? req.user : address(0);
        results = res;
    }

    /**
     * @notice Returns all tier configurations.
     * @dev Useful for frontends to display game rules.
     * @return ranges Array of max numbers for each tier.
     * @return multipliers Array of reward multipliers (in BIPS).
     */
    function getAllTiers() external view returns (
        uint256[] memory ranges,
        uint256[] memory multipliers
    ) {
        uint256 count = activeTierCount;
        ranges = new uint256[](count);
        multipliers = new uint256[](count);
        
        for (uint256 i = 0; i < count;) {
            PrizeTier storage tier = prizeTiers[i + 1];
            ranges[i] = uint256(tier.range);
            multipliers[i] = uint256(tier.multiplierBips);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Calculate potential winnings for a given wager.
     * @param _wagerAmount The amount to wager.
     * @param _isCumulative True for cumulative mode.
     * @return maxPossibleWin Maximum possible prize (all tiers hit).
     * @return netWager Amount after fees that counts toward prize calculation.
     */
    function calculatePotentialWinnings(
        uint256 _wagerAmount,
        bool _isCumulative
    ) external view returns (uint256 maxPossibleWin, uint256 netWager) {
        uint256 totalFee = (_wagerAmount * gameFeeBips) / TOTAL_BIPS;
        netWager = _wagerAmount - totalFee;
        
        uint256 count = activeTierCount;
        
        if (_isCumulative) {
            // Sum all tier multipliers
            for (uint256 i = 0; i < count;) {
                maxPossibleWin += (_wagerAmount * prizeTiers[i + 1].multiplierBips) / TOTAL_BIPS;
                unchecked { ++i; }
            }
        } else {
            // Find highest multiplier
            uint256 highestMultiplier = 0;
            for (uint256 i = 0; i < count;) {
                uint256 mult = uint256(prizeTiers[i + 1].multiplierBips);
                if (mult > highestMultiplier) {
                    highestMultiplier = mult;
                }
                unchecked { ++i; }
            }
            maxPossibleWin = (_wagerAmount * highestMultiplier) / TOTAL_BIPS;
        }
        
        // Cap at max payout
        uint256 maxPayout = (prizePoolBalance * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
        if (maxPossibleWin > maxPayout) {
            maxPossibleWin = maxPayout;
        }
    }

    // =========================================================================
    // GAME LOGIC
    // =========================================================================

    /**
     * @notice User participation function.
     * @dev Fully dynamic validation based on activeTierCount and tier ranges.
     * @param _amount Wager amount.
     * @param _guesses Dynamic array of predictions. Length must match activeTierCount.
     * @param _isCumulative Calculation mode.
     */
    function participate(
        uint256 _amount, 
        uint256[] calldata _guesses, 
        bool _isCumulative
    ) external payable nonReentrant {
        if (_amount == 0) revert InvalidAmount();
        
        // Cache state variable for gas efficiency
        uint256 currentTierCount = activeTierCount;

        // Validate array length matches current configuration
        if (_guesses.length != currentTierCount) revert InvalidGuessCount();

        // Validate guesses against current ranges
        // Using unchecked for loop increment to save gas
        for (uint256 i = 0; i < currentTierCount;) {
            // Tier IDs are 1-based, array is 0-based
            uint256 tierId = i + 1;
            uint256 maxRange = uint256(prizeTiers[tierId].range);
            
            if (_guesses[i] < 1 || _guesses[i] > maxRange) {
                revert InvalidGuessRange();
            }
            
            unchecked { ++i; }
        }

        // Calculate ETH fee
        uint256 requiredFee = _isCumulative ? oracleFeeInWei * 5 : oracleFeeInWei;
        if (msg.value != requiredFee) revert InvalidFee();

        // Forward native fee to Oracle
        (bool sent, ) = oracleAddress.call{value: msg.value}("");
        if (!sent) revert OracleTransferFailed();

        // Process BKC
        uint256 purchaseAmount = _processFeesAndMining(_amount);
        
        unchecked {
            gameCounter++;
        }
        
        pendingGames[gameCounter] = GameRequest({
            user: msg.sender,
            purchaseAmount: purchaseAmount, 
            guesses: _guesses,
            isCumulative: _isCumulative
        });

        emit GameRequested(gameCounter, msg.sender, purchaseAmount, _guesses, _isCumulative);
    }
    
    /**
     * @notice Oracle fulfillment.
     * @dev Dynamically iterates through tiers to check wins.
     * @param _gameId The game ID to fulfill.
     * @param _randomNumber Random seed from oracle.
     */
    function fulfillGame(
        uint256 _gameId,
        uint256 _randomNumber
    ) external nonReentrant {
        if (msg.sender != oracleAddress) revert Unauthorized();
        
        // Check if game is already fulfilled (using length check of results)
        if (gameResults[_gameId].length != 0) revert GameAlreadyFulfilled();

        GameRequest memory request = pendingGames[_gameId];
        
        // V2.0: More specific error for missing games
        if (request.user == address(0)) revert GameNotFound(); 

        uint256 totalPrize = 0;
        uint256 currentPool = prizePoolBalance;
        
        // Use cached count at time of execution (or utilize request length)
        // Ideally we use request.guesses.length as that was the state when user played
        uint256 tiersToProcess = request.guesses.length;
        uint256[] memory rolls = new uint256[](tiersToProcess);

        for (uint256 i = 0; i < tiersToProcess;) {
            uint256 tierId = i + 1;
            PrizeTier memory tier = prizeTiers[tierId];

            // Safety check: if tier config changed mid-flight to be inactive, we proceed if range > 0.
            if (tier.range > 0) {
                // Generate Roll (1 to Range)
                // Using (Random + Index) hash to generate unique outcomes per tier
                uint256 roll = (uint256(keccak256(abi.encodePacked(_randomNumber, tierId))) % tier.range) + 1;
                rolls[i] = roll;

                // Check Win
                if (request.guesses[i] == roll) {
                    uint256 winAmount = (request.purchaseAmount * tier.multiplierBips) / TOTAL_BIPS;
                    if (request.isCumulative) {
                        totalPrize += winAmount;
                    } else {
                        if (winAmount > totalPrize) {
                            totalPrize = winAmount;
                        }
                    }
                }
            }
            
            unchecked { ++i; }
        }

        // Safety Cap (Max 50% of pool)
        uint256 maxPayout = (currentPool * MAX_PRIZE_PAYOUT_BIPS) / TOTAL_BIPS;
        if (totalPrize > maxPayout) {
            totalPrize = maxPayout;
        }

        // Save Result BEFORE cleanup (important for state consistency)
        gameResults[_gameId] = rolls;

        // Payout
        if (totalPrize > 0) {
            prizePoolBalance -= totalPrize;
            bkcToken.safeTransfer(request.user, totalPrize);
        }

        // Clean up (Gas Refund) - AFTER saving results
        delete pendingGames[_gameId];
        
        emit GameFulfilled(_gameId, request.user, totalPrize, rolls, request.guesses);
    }

    // --- Internal Helpers ---

    function _processFeesAndMining(uint256 _amount) internal returns (uint256 purchaseAmount) {
        uint256 totalFee = (_amount * gameFeeBips) / TOTAL_BIPS;
        uint256 prizePoolAmount = _amount - totalFee;
        purchaseAmount = _amount; 

        if (miningManagerAddress == address(0)) revert CoreContractsNotSet();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        _addAmountToPool(prizePoolAmount);

        if (totalFee > 0) {
            bkcToken.safeTransfer(miningManagerAddress, totalFee);
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, totalFee);
        }
        
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
