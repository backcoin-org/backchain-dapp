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
 * @title Fortune Pool
 * @author Backchain Protocol
 * @notice Strategic prediction game powered by Backcoin ($BKC)
 * @dev Implements two game modes with oracle-based randomness:
 *
 *      MODE 1x (Jackpot Mode):
 *      - Player competes ONLY for the highest tier (hardest, biggest prize)
 *      - Requires 1 guess for the jackpot tier
 *      - Lower oracle fee (1x)
 *      - Winner takes the highest multiplier
 *
 *      MODE 5x (Cumulative Mode):
 *      - Player competes for ALL active tiers
 *      - Requires N guesses (one per tier)
 *      - Higher oracle fee (5x)
 *      - All matching tiers pay out (cumulative rewards)
 *
 *      Tier Structure (recommended):
 *      - Tier 1: Easy (e.g., 1-3 range, 2x multiplier)
 *      - Tier 2: Medium (e.g., 1-10 range, 5x multiplier)
 *      - Tier 3: Hard/Jackpot (e.g., 1-100 range, 100x multiplier)
 *
 * @custom:security-contact security@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:network Arbitrum
 */
contract FortunePool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for BKCToken;

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BIPS_DENOMINATOR = 10_000;

    /// @notice Maximum prize payout as percentage of pool (50%)
    uint256 public constant MAX_PAYOUT_BIPS = 5_000;

    /// @notice Maximum game fee allowed (30%)
    uint256 public constant MAX_GAME_FEE_BIPS = 3_000;

    /// @notice Service key for MiningManager authorization
    bytes32 public constant SERVICE_KEY = keccak256("FORTUNE_POOL_SERVICE");

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to the ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Reference to delegation manager for staking integration
    IDelegationManager public delegationManager;

    /// @notice Address authorized to fulfill games
    address public oracleAddress;

    /// @notice Address of the mining manager for fee distribution
    address public miningManagerAddress;

    /// @notice Native fee (ETH/MATIC) required per oracle call
    uint256 public oracleFee;

    /// @notice Game fee in basis points (deducted from wager)
    uint256 public gameFeeBips;

    /// @notice Total games created
    uint256 public gameCounter;

    /// @notice Current prize pool balance
    uint256 public prizePoolBalance;

    /// @notice Number of active prize tiers
    uint256 public activeTierCount;

    /// @notice Prize tier configuration
    struct PrizeTier {
        uint128 maxRange;       // Maximum number in range (e.g., 100 = 1-100)
        uint64 multiplierBips;  // Reward multiplier (e.g., 50000 = 5x)
        bool active;            // Whether tier is currently playable
    }

    /// @notice Game request data
    struct GameRequest {
        address player;         // Player's address
        uint256 wagerAmount;    // Net wager after fees
        uint256[] guesses;      // Player's predictions
        bool isCumulative;      // true = 5x mode, false = 1x mode
        uint256 targetTier;     // For 1x mode: jackpot tier ID (0 = all tiers)
    }

    /// @notice Tier ID => Configuration
    mapping(uint256 => PrizeTier) public prizeTiers;

    /// @notice Game ID => Request data
    mapping(uint256 => GameRequest) public pendingGames;

    /// @notice Game ID => Result rolls
    mapping(uint256 => uint256[]) public gameResults;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    /// @notice Emitted when a tier is configured
    event TierConfigured(
        uint256 indexed tierId,
        uint128 maxRange,
        uint64 multiplierBips,
        bool active
    );

    /// @notice Emitted when prize pool receives funds
    event PrizePoolFunded(uint256 amount, uint256 newBalance);

    /// @notice Emitted when oracle address changes
    event OracleUpdated(address indexed previousOracle, address indexed newOracle);

    /// @notice Emitted when oracle fee changes
    event OracleFeeUpdated(uint256 previousFee, uint256 newFee);

    /// @notice Emitted when game fee changes
    event GameFeeUpdated(uint256 previousFeeBips, uint256 newFeeBips);

    /// @notice Emitted when a player requests a game
    event GameRequested(
        uint256 indexed gameId,
        address indexed player,
        uint256 wagerAmount,
        uint256[] guesses,
        bool isCumulative,
        uint256 targetTier
    );

    /// @notice Emitted when oracle fulfills a game
    event GameFulfilled(
        uint256 indexed gameId,
        address indexed player,
        uint256 prizeWon,
        uint256[] rolls,
        uint256[] guesses,
        bool isCumulative
    );

    /// @notice Emitted on emergency withdrawal
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error ZeroAddress();
    error ZeroAmount();
    error InvalidFee();
    error InvalidTierId();
    error InvalidTierSequence();
    error InvalidGuessCount();
    error InvalidGuessRange();
    error InsufficientOracleFee();
    error OraclePaymentFailed();
    error UnauthorizedOracle();
    error GameAlreadyFulfilled();
    error GameNotFound();
    error NoActiveTiers();
    error CoreContractNotSet();

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Fortune Pool contract
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
        address dmAddress = ecosystemManager.getDelegationManagerAddress();
        address mmAddress = ecosystemManager.getMiningManagerAddress();

        if (bkcAddress == address(0) || dmAddress == address(0) || mmAddress == address(0)) {
            revert CoreContractNotSet();
        }

        bkcToken = BKCToken(bkcAddress);
        delegationManager = IDelegationManager(dmAddress);
        miningManagerAddress = mmAddress;

        gameFeeBips = 1000; // Default: 10%
    }

    /**
     * @dev Authorizes contract upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Sets the oracle address authorized to fulfill games
     * @param _oracle New oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();

        address previousOracle = oracleAddress;
        oracleAddress = _oracle;

        emit OracleUpdated(previousOracle, _oracle);
    }

    /**
     * @notice Sets the native fee required for oracle calls
     * @param _fee Fee amount in wei
     */
    function setOracleFee(uint256 _fee) external onlyOwner {
        uint256 previousFee = oracleFee;
        oracleFee = _fee;

        emit OracleFeeUpdated(previousFee, _fee);
    }

    /**
     * @notice Sets the game fee percentage
     * @param _feeBips Fee in basis points (max 3000 = 30%)
     */
    function setGameFee(uint256 _feeBips) external onlyOwner {
        if (_feeBips > MAX_GAME_FEE_BIPS) revert InvalidFee();

        uint256 previousFee = gameFeeBips;
        gameFeeBips = _feeBips;

        emit GameFeeUpdated(previousFee, _feeBips);
    }

    /**
     * @notice Configures a prize tier
     * @dev Tiers must be set sequentially (1, 2, 3...)
     *      Lower tiers should be easier (smaller range, lower multiplier)
     *      Highest tier is the jackpot (largest range, highest multiplier)
     * @param _tierId Tier identifier (1-based)
     * @param _maxRange Maximum number in guess range (e.g., 100 for 1-100)
     * @param _multiplierBips Reward multiplier in bips (10000 = 1x)
     */
    function configureTier(
        uint256 _tierId,
        uint128 _maxRange,
        uint64 _multiplierBips
    ) external onlyOwner {
        if (_tierId == 0) revert InvalidTierId();
        if (_maxRange == 0) revert ZeroAmount();
        if (_tierId > activeTierCount + 1) revert InvalidTierSequence();

        if (_tierId > activeTierCount) {
            activeTierCount = _tierId;
        }

        prizeTiers[_tierId] = PrizeTier({
            maxRange: _maxRange,
            multiplierBips: _multiplierBips,
            active: true
        });

        emit TierConfigured(_tierId, _maxRange, _multiplierBips, true);
    }

    /**
     * @notice Reduces the number of active tiers
     * @param _newCount New tier count (must be less than current)
     */
    function reduceTierCount(uint256 _newCount) external onlyOwner {
        if (_newCount >= activeTierCount) revert InvalidTierSequence();
        activeTierCount = _newCount;
    }

    /**
     * @notice Adds BKC to the prize pool
     * @param _amount Amount to add
     */
    function fundPrizePool(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert ZeroAmount();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        prizePoolBalance += _amount;

        emit PrizePoolFunded(_amount, prizePoolBalance);
    }

    /**
     * @notice Emergency withdrawal of prize pool to treasury
     */
    function emergencyWithdraw() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) revert CoreContractNotSet();

        uint256 amount = prizePoolBalance;
        prizePoolBalance = 0;

        if (amount > 0) {
            bkcToken.safeTransfer(treasury, amount);
        }

        emit EmergencyWithdrawal(treasury, amount);
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns the jackpot tier ID (highest tier)
     */
    function getJackpotTierId() public view returns (uint256) {
        return activeTierCount;
    }

    /**
     * @notice Returns jackpot tier configuration
     */
    function getJackpotTier() external view returns (
        uint256 tierId,
        uint128 maxRange,
        uint64 multiplierBips,
        bool active
    ) {
        tierId = activeTierCount;
        if (tierId > 0) {
            PrizeTier storage tier = prizeTiers[tierId];
            return (tierId, tier.maxRange, tier.multiplierBips, tier.active);
        }
        return (0, 0, 0, false);
    }

    /**
     * @notice Returns all tier configurations
     */
    function getAllTiers() external view returns (
        uint128[] memory ranges,
        uint64[] memory multipliers
    ) {
        uint256 count = activeTierCount;
        ranges = new uint128[](count);
        multipliers = new uint64[](count);

        for (uint256 i = 0; i < count;) {
            PrizeTier storage tier = prizeTiers[i + 1];
            ranges[i] = tier.maxRange;
            multipliers[i] = tier.multiplierBips;
            unchecked { ++i; }
        }
    }

    /**
     * @notice Calculates required oracle fee for a game mode
     * @param _isCumulative true = 5x mode, false = 1x mode
     */
    function getRequiredOracleFee(bool _isCumulative) public view returns (uint256) {
        return _isCumulative ? oracleFee * 5 : oracleFee;
    }

    /**
     * @notice Returns expected guess count for a game mode
     * @param _isCumulative true = 5x mode (all tiers), false = 1x mode (1 guess)
     */
    function getExpectedGuessCount(bool _isCumulative) public view returns (uint256) {
        return _isCumulative ? activeTierCount : 1;
    }

    /**
     * @notice Calculates potential winnings
     * @param _wagerAmount Wager amount in BKC
     * @param _isCumulative Game mode
     * @return maxPrize Maximum possible prize
     * @return netWager Wager after fees
     */
    function calculatePotentialWinnings(
        uint256 _wagerAmount,
        bool _isCumulative
    ) external view returns (uint256 maxPrize, uint256 netWager) {
        uint256 fee = (_wagerAmount * gameFeeBips) / BIPS_DENOMINATOR;
        netWager = _wagerAmount - fee;

        uint256 count = activeTierCount;
        if (count == 0) return (0, netWager);

        if (_isCumulative) {
            for (uint256 i = 0; i < count;) {
                maxPrize += (_wagerAmount * prizeTiers[i + 1].multiplierBips) / BIPS_DENOMINATOR;
                unchecked { ++i; }
            }
        } else {
            maxPrize = (_wagerAmount * prizeTiers[count].multiplierBips) / BIPS_DENOMINATOR;
        }

        uint256 maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        if (maxPrize > maxPayout) {
            maxPrize = maxPayout;
        }
    }

    /**
     * @notice Returns game results
     * @param _gameId Game identifier
     */
    function getGameResults(uint256 _gameId) external view returns (uint256[] memory) {
        return gameResults[_gameId];
    }

    /**
     * @notice Checks if a game has been fulfilled
     * @param _gameId Game identifier
     */
    function isGameFulfilled(uint256 _gameId) external view returns (bool) {
        return gameResults[_gameId].length > 0;
    }

    /**
     * @notice Returns pending game data
     * @param _gameId Game identifier
     */
    function getPendingGame(uint256 _gameId) external view returns (
        address player,
        uint256 wagerAmount,
        uint256[] memory guesses,
        bool isCumulative,
        uint256 targetTier
    ) {
        GameRequest storage req = pendingGames[_gameId];
        return (req.player, req.wagerAmount, req.guesses, req.isCumulative, req.targetTier);
    }

    /**
     * @notice Returns comprehensive game status
     * @param _gameId Game identifier
     */
    function getGameStatus(uint256 _gameId) external view returns (
        bool exists,
        bool fulfilled,
        bool pending,
        address player,
        uint256[] memory results
    ) {
        GameRequest storage req = pendingGames[_gameId];
        uint256[] storage res = gameResults[_gameId];

        exists = res.length > 0 || req.player != address(0);
        fulfilled = res.length > 0;
        pending = req.player != address(0) && res.length == 0;
        player = req.player;
        results = res;
    }

    // =========================================================================
    //                          GAME LOGIC
    // =========================================================================

    /**
     * @notice Participates in a Fortune Pool game
     * @dev
     *      Mode 1x (isCumulative = false):
     *      - Send 1 guess for the JACKPOT tier only
     *      - Pay 1x oracle fee
     *      - Compete for the highest multiplier
     *
     *      Mode 5x (isCumulative = true):
     *      - Send N guesses (one per active tier)
     *      - Pay 5x oracle fee
     *      - All matching tiers pay out cumulatively
     *
     * @param _wagerAmount Amount to wager in BKC
     * @param _guesses Array of predictions (1 for 1x mode, N for 5x mode)
     * @param _isCumulative false = 1x mode (jackpot), true = 5x mode (all tiers)
     */
    function participate(
        uint256 _wagerAmount,
        uint256[] calldata _guesses,
        bool _isCumulative
    ) external payable nonReentrant {
        if (_wagerAmount == 0) revert ZeroAmount();

        uint256 tierCount = activeTierCount;
        if (tierCount == 0) revert NoActiveTiers();

        uint256 targetTier;

        if (_isCumulative) {
            // ═══════════════════════════════════════════════════════════════
            // MODE 5x: COMPETE FOR ALL TIERS
            // ═══════════════════════════════════════════════════════════════
            if (_guesses.length != tierCount) revert InvalidGuessCount();

            for (uint256 i = 0; i < tierCount;) {
                uint256 maxRange = uint256(prizeTiers[i + 1].maxRange);
                if (_guesses[i] < 1 || _guesses[i] > maxRange) {
                    revert InvalidGuessRange();
                }
                unchecked { ++i; }
            }

            targetTier = 0; // 0 = all tiers

        } else {
            // ═══════════════════════════════════════════════════════════════
            // MODE 1x: COMPETE FOR JACKPOT ONLY
            // ═══════════════════════════════════════════════════════════════
            if (_guesses.length != 1) revert InvalidGuessCount();

            targetTier = tierCount; // Jackpot tier
            uint256 maxRange = uint256(prizeTiers[targetTier].maxRange);

            if (_guesses[0] < 1 || _guesses[0] > maxRange) {
                revert InvalidGuessRange();
            }
        }

        // Validate oracle fee
        uint256 requiredFee = getRequiredOracleFee(_isCumulative);
        if (msg.value != requiredFee) revert InsufficientOracleFee();

        // Forward oracle fee
        if (msg.value > 0) {
            (bool sent,) = oracleAddress.call{value: msg.value}("");
            if (!sent) revert OraclePaymentFailed();
        }

        // Process BKC payment
        uint256 netWager = _processPayment(_wagerAmount);

        // Create game request
        unchecked { ++gameCounter; }

        pendingGames[gameCounter] = GameRequest({
            player: msg.sender,
            wagerAmount: netWager,
            guesses: _guesses,
            isCumulative: _isCumulative,
            targetTier: targetTier
        });

        emit GameRequested(
            gameCounter,
            msg.sender,
            netWager,
            _guesses,
            _isCumulative,
            targetTier
        );
    }

    /**
     * @notice Fulfills a game with random number from oracle
     * @dev Only callable by authorized oracle address
     * @param _gameId Game identifier to fulfill
     * @param _randomSeed Random seed from oracle
     */
    function fulfillGame(
        uint256 _gameId,
        uint256 _randomSeed
    ) external nonReentrant {
        if (msg.sender != oracleAddress) revert UnauthorizedOracle();
        if (gameResults[_gameId].length != 0) revert GameAlreadyFulfilled();

        GameRequest memory request = pendingGames[_gameId];
        if (request.player == address(0)) revert GameNotFound();

        uint256 totalPrize;
        uint256[] memory rolls;

        if (request.isCumulative) {
            // ═══════════════════════════════════════════════════════════════
            // MODE 5x: PROCESS ALL TIERS
            // ═══════════════════════════════════════════════════════════════
            uint256 tierCount = request.guesses.length;
            rolls = new uint256[](tierCount);

            for (uint256 i = 0; i < tierCount;) {
                uint256 tierId = i + 1;
                PrizeTier memory tier = prizeTiers[tierId];

                if (tier.maxRange > 0) {
                    uint256 roll = _generateRoll(_randomSeed, tierId, tier.maxRange);
                    rolls[i] = roll;

                    if (request.guesses[i] == roll) {
                        totalPrize += (request.wagerAmount * tier.multiplierBips) / BIPS_DENOMINATOR;
                    }
                }

                unchecked { ++i; }
            }

        } else {
            // ═══════════════════════════════════════════════════════════════
            // MODE 1x: PROCESS JACKPOT ONLY
            // ═══════════════════════════════════════════════════════════════
            rolls = new uint256[](1);

            uint256 tierId = request.targetTier;
            PrizeTier memory tier = prizeTiers[tierId];

            if (tier.maxRange > 0) {
                uint256 roll = _generateRoll(_randomSeed, tierId, tier.maxRange);
                rolls[0] = roll;

                if (request.guesses[0] == roll) {
                    totalPrize = (request.wagerAmount * tier.multiplierBips) / BIPS_DENOMINATOR;
                }
            }
        }

        // Apply safety cap
        uint256 maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        if (totalPrize > maxPayout) {
            totalPrize = maxPayout;
        }

        // Save results
        gameResults[_gameId] = rolls;

        // Pay winner
        if (totalPrize > 0) {
            prizePoolBalance -= totalPrize;
            bkcToken.safeTransfer(request.player, totalPrize);
        }

        // Cleanup
        delete pendingGames[_gameId];

        emit GameFulfilled(
            _gameId,
            request.player,
            totalPrize,
            rolls,
            request.guesses,
            request.isCumulative
        );
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @dev Processes BKC payment: collects wager, deducts fee, adds to pool
     */
    function _processPayment(uint256 _amount) internal returns (uint256 netWager) {
        uint256 fee = (_amount * gameFeeBips) / BIPS_DENOMINATOR;
        netWager = _amount - fee;

        if (miningManagerAddress == address(0)) revert CoreContractNotSet();

        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Add net wager to prize pool
        prizePoolBalance += netWager;

        // Send fee to mining manager
        if (fee > 0) {
            bkcToken.safeTransfer(miningManagerAddress, fee);
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, fee);
        }
    }

    /**
     * @dev Generates a deterministic roll from random seed
     */
    function _generateRoll(
        uint256 _seed,
        uint256 _tierId,
        uint256 _maxRange
    ) internal pure returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(_seed, _tierId))) % _maxRange) + 1;
    }
}
