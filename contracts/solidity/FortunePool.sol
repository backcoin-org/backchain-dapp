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
 * @title IBackcoinOracle
 * @author Backchain Protocol
 * @notice Interface for Backcoin Oracle - Free Randomness for Arbitrum Ecosystem
 * @dev This interface allows Solidity contracts to interact with the Backcoin Oracle,
 *      which is deployed as a Stylus (Rust/WASM) contract on Arbitrum.
 *
 *      ┌─────────────────────────────────────────────────────────────────────────┐
 *      │                         BACKCOIN ORACLE                                 │
 *      │                 "Free Randomness for Everyone"                          │
 *      ├─────────────────────────────────────────────────────────────────────────┤
 *      │                                                                         │
 *      │  This is Backchain Protocol's contribution to the Arbitrum ecosystem.  │
 *      │  Any project can use it - no fees, no tokens, no restrictions.         │
 *      │                                                                         │
 *      │  Security: 100% secure while Arbitrum is secure.                       │
 *      │  Same trust assumption as $18B+ in Arbitrum DeFi.                      │
 *      │                                                                         │
 *      └─────────────────────────────────────────────────────────────────────────┘
 *
 * @custom:security-contact dev@backcoin.org
 * @custom:website https://backcoin.org
 * @custom:docs https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 */
interface IBackcoinOracle {
    /**
     * @notice Generate random numbers (CAN repeat)
     * @dev IMPORTANT: Uses camelCase (Stylus SDK convention)
     * @param count How many random numbers to generate (1-500)
     * @param min Minimum value inclusive
     * @param max Maximum value inclusive
     * @return Array of random numbers
     */
    function getNumbers(
        uint64 count,
        uint64 min,
        uint64 max
    ) external returns (uint256[] memory);

    /**
     * @notice Generate multiple groups of random numbers in ONE transaction
     * @dev More gas-efficient than multiple separate calls
     *      IMPORTANT: Uses camelCase (Stylus SDK convention)
     * @param counts Array of how many numbers per group
     * @param mins Array of minimum values per group
     * @param maxs Array of maximum values per group
     * @return Array of arrays with random numbers per group
     */
    function getBatch(
        uint64[] calldata counts,
        uint64[] calldata mins,
        uint64[] calldata maxs
    ) external returns (uint256[][] memory);
}

/**
 * @title Fortune Pool
 * @author Backchain Protocol
 * @notice Strategic prediction game powered by Backcoin ($BKC)
 * @dev Uses Backcoin Oracle (Stylus) for INSTANT on-chain resolution
 *
 *      ╔═══════════════════════════════════════════════════════════════════╗
 *      ║                    GAME MODES                                      ║
 *      ╠═══════════════════════════════════════════════════════════════════╣
 *      ║  MODE 1x (Jackpot Mode):                                          ║
 *      ║  - Player competes ONLY for the highest tier (hardest, best prize)║
 *      ║  - Requires 1 guess for the jackpot tier                          ║
 *      ║  - Pays 1x service fee                                            ║
 *      ║  - Winner takes the highest multiplier                            ║
 *      ╠═══════════════════════════════════════════════════════════════════╣
 *      ║  MODE 5x (Cumulative Mode):                                       ║
 *      ║  - Player competes for ALL active tiers simultaneously            ║
 *      ║  - Requires N guesses (one per active tier)                       ║
 *      ║  - Pays 5x service fee (one per tier)                             ║
 *      ║  - All matching tiers pay out (cumulative rewards)                ║
 *      ╚═══════════════════════════════════════════════════════════════════╝
 *
 *      Tier Structure (default):
 *      - Tier 1: Easy   (1-3 range,   2x multiplier,  ~33% chance)
 *      - Tier 2: Medium (1-10 range,  5x multiplier,  ~10% chance)
 *      - Tier 3: Hard   (1-100 range, 50x multiplier, ~1% chance)
 *
 *      Oracle: Backcoin Oracle (Stylus/Rust) - FREE, instant, secure
 *
 * @custom:security-contact dev@backcoin.org
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

    /// @notice Service fee multiplier for cumulative mode
    uint256 public constant CUMULATIVE_FEE_MULTIPLIER = 5;

    // =========================================================================
    //                              STATE
    // =========================================================================

    /// @notice Reference to the ecosystem hub
    IEcosystemManager public ecosystemManager;

    /// @notice BKC token contract
    BKCToken public bkcToken;

    /// @notice Reference to delegation manager for staking integration
    IDelegationManager public delegationManager;

    /// @notice Backcoin Oracle (Stylus contract)
    IBackcoinOracle public backcoinOracle;

    /// @notice Address of the mining manager for fee distribution
    address public miningManagerAddress;

    /// @notice Native fee (ETH) required per game (for project funding)
    /// @dev This is NOT an oracle fee - the oracle is free. This funds the project.
    uint256 public serviceFee;

    /// @notice Game fee in basis points (deducted from wager, goes to mining)
    uint256 public gameFeeBips;

    /// @notice Total games played
    uint256 public gameCounter;

    /// @notice Current prize pool balance (in BKC)
    uint256 public prizePoolBalance;

    /// @notice Number of active prize tiers
    uint256 public activeTierCount;

    /// @notice Total wagered all time
    uint256 public totalWageredAllTime;

    /// @notice Total paid out all time
    uint256 public totalPaidOutAllTime;

    /// @notice Total wins all time
    uint256 public totalWinsAllTime;

    /// @notice Prize tier configuration
    struct PrizeTier {
        uint128 maxRange;       // Maximum number in range (e.g., 100 = 1-100)
        uint64 multiplierBips;  // Reward multiplier in bips (e.g., 500000 = 50x)
        bool active;            // Whether tier is currently playable
    }

    /// @notice Game result data (stored for history)
    struct GameResult {
        address player;         // Player's address
        uint256 wagerAmount;    // Net wager after fees
        uint256 prizeWon;       // Prize won (0 if lost)
        uint256[] guesses;      // Player's predictions
        uint256[] rolls;        // Oracle results
        bool isCumulative;      // true = 5x mode, false = 1x mode
        uint8 matchCount;       // Number of matching tiers
        uint256 timestamp;      // Block timestamp
    }

    /// @notice Tier ID => Configuration (1-indexed)
    mapping(uint256 => PrizeTier) public prizeTiers;

    /// @notice Game ID => Result data
    mapping(uint256 => GameResult) public gameResults;

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

    /// @notice Emitted when service fee changes
    event ServiceFeeUpdated(uint256 previousFee, uint256 newFee);

    /// @notice Emitted when game fee changes
    event GameFeeUpdated(uint256 previousFeeBips, uint256 newFeeBips);

    /// @notice Emitted when a game is played and resolved (V2: instant)
    event GamePlayed(
        uint256 indexed gameId,
        address indexed player,
        uint256 wagerAmount,
        uint256 prizeWon,
        bool isCumulative,
        uint8 matchCount
    );

    /// @notice Emitted with detailed game data (for indexers)
    event GameDetails(
        uint256 indexed gameId,
        uint256[] guesses,
        uint256[] rolls,
        bool[] matches
    );

    /// @notice Emitted on jackpot win (high multiplier tier match)
    event JackpotWon(
        uint256 indexed gameId,
        address indexed player,
        uint256 prizeAmount,
        uint256 tier
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
    error InsufficientServiceFee();
    error ServiceFeeTransferFailed();
    error NoActiveTiers();
    error CoreContractNotSet();
    error OracleNotSet();

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
     * @param _backcoinOracle Address of Backcoin Oracle (Stylus)
     */
    function initialize(
        address _owner,
        address _ecosystemManager,
        address _backcoinOracle
    ) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        if (_ecosystemManager == address(0)) revert ZeroAddress();
        if (_backcoinOracle == address(0)) revert ZeroAddress();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _transferOwnership(_owner);

        ecosystemManager = IEcosystemManager(_ecosystemManager);
        backcoinOracle = IBackcoinOracle(_backcoinOracle);

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
     * @notice Sets the Backcoin Oracle address
     * @param _oracle New oracle address (Backcoin Oracle Stylus contract)
     */
    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();

        address previousOracle = address(backcoinOracle);
        backcoinOracle = IBackcoinOracle(_oracle);

        emit OracleUpdated(previousOracle, _oracle);
    }

    /**
     * @notice Sets the service fee (ETH) for project funding
     * @dev This is NOT an oracle fee - the oracle is free. This funds the project.
     * @param _fee Fee amount in wei
     */
    function setServiceFee(uint256 _fee) external onlyOwner {
        uint256 previousFee = serviceFee;
        serviceFee = _fee;

        emit ServiceFeeUpdated(previousFee, _fee);
    }

    /**
     * @notice Sets the game fee percentage (deducted from wager)
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
     * @param _multiplierBips Reward multiplier in bips (10000 = 1x, 500000 = 50x)
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

    /**
     * @notice Withdraw accumulated service fees to treasury
     */
    function withdrawServiceFees() external onlyOwner {
        address treasury = ecosystemManager.getTreasuryAddress();
        if (treasury == address(0)) revert CoreContractNotSet();

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent,) = treasury.call{value: balance}("");
            if (!sent) revert ServiceFeeTransferFailed();
        }
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns the jackpot tier ID (highest active tier)
     */
    function getJackpotTierId() public view returns (uint256) {
        return activeTierCount;
    }

    /**
     * @notice Returns a specific tier configuration
     * @param _tierId Tier identifier (1-based)
     */
    function getTier(uint256 _tierId) external view returns (
        uint128 maxRange,
        uint64 multiplierBips,
        bool active
    ) {
        PrizeTier storage tier = prizeTiers[_tierId];
        return (tier.maxRange, tier.multiplierBips, tier.active);
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
     * @notice Calculates required service fee for a game mode
     * @param _isCumulative true = 5x mode (pays 5x fee), false = 1x mode (pays 1x fee)
     * @return Required fee in wei
     */
    function getRequiredServiceFee(bool _isCumulative) public view returns (uint256) {
        return _isCumulative ? serviceFee * CUMULATIVE_FEE_MULTIPLIER : serviceFee;
    }

    /**
     * @notice Returns expected guess count for a game mode
     * @param _isCumulative true = 5x mode (N guesses), false = 1x mode (1 guess)
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
            // 5x mode: sum of all tier multipliers
            for (uint256 i = 0; i < count;) {
                maxPrize += (netWager * prizeTiers[i + 1].multiplierBips) / BIPS_DENOMINATOR;
                unchecked { ++i; }
            }
        } else {
            // 1x mode: only jackpot tier multiplier
            maxPrize = (netWager * prizeTiers[count].multiplierBips) / BIPS_DENOMINATOR;
        }

        // Apply safety cap (50% of pool)
        uint256 maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        if (maxPrize > maxPayout) {
            maxPrize = maxPayout;
        }
    }

    /**
     * @notice Returns game result
     * @param _gameId Game identifier
     */
    function getGameResult(uint256 _gameId) external view returns (
        address player,
        uint256 wagerAmount,
        uint256 prizeWon,
        uint256[] memory guesses,
        uint256[] memory rolls,
        bool isCumulative,
        uint8 matchCount,
        uint256 timestamp
    ) {
        GameResult storage result = gameResults[_gameId];
        return (
            result.player,
            result.wagerAmount,
            result.prizeWon,
            result.guesses,
            result.rolls,
            result.isCumulative,
            result.matchCount,
            result.timestamp
        );
    }

    /**
     * @notice Returns pool statistics
     */
    function getPoolStats() external view returns (
        uint256 poolBalance,
        uint256 gamesPlayed,
        uint256 wageredAllTime,
        uint256 paidOutAllTime,
        uint256 winsAllTime,
        uint256 currentFee
    ) {
        return (
            prizePoolBalance,
            gameCounter,
            totalWageredAllTime,
            totalPaidOutAllTime,
            totalWinsAllTime,
            gameFeeBips
        );
    }

    /**
     * @notice Returns the oracle address
     */
    function getOracleAddress() external view returns (address) {
        return address(backcoinOracle);
    }

    // =========================================================================
    //                          GAME LOGIC (INSTANT)
    // =========================================================================

    /**
     * @notice Play a Fortune Pool game (INSTANT RESOLUTION)
     * @dev Results are determined and paid in the same transaction!
     *      Uses Backcoin Oracle (Stylus) for randomness - FREE!
     *
     *      Mode 1x (isCumulative = false):
     *      - Send 1 guess for the JACKPOT tier only
     *      - Pay 1x service fee
     *      - Compete for the highest multiplier (e.g., 50x)
     *
     *      Mode 5x (isCumulative = true):
     *      - Send N guesses (one per active tier)
     *      - Pay 5x service fee
     *      - All matching tiers pay out cumulatively
     *
     * @param _wagerAmount Amount to wager in BKC
     * @param _guesses Array of predictions (1 for 1x mode, N for 5x mode)
     * @param _isCumulative false = 1x mode (jackpot), true = 5x mode (all tiers)
     */
    function play(
        uint256 _wagerAmount,
        uint256[] calldata _guesses,
        bool _isCumulative
    ) external payable nonReentrant {
        if (_wagerAmount == 0) revert ZeroAmount();
        if (address(backcoinOracle) == address(0)) revert OracleNotSet();

        uint256 tierCount = activeTierCount;
        if (tierCount == 0) revert NoActiveTiers();

        // ═══════════════════════════════════════════════════════════════════
        // VALIDATE GUESSES
        // ═══════════════════════════════════════════════════════════════════
        
        if (_isCumulative) {
            // MODE 5x: Must provide one guess per tier
            if (_guesses.length != tierCount) revert InvalidGuessCount();

            for (uint256 i = 0; i < tierCount;) {
                uint256 maxRange = uint256(prizeTiers[i + 1].maxRange);
                if (_guesses[i] < 1 || _guesses[i] > maxRange) {
                    revert InvalidGuessRange();
                }
                unchecked { ++i; }
            }
        } else {
            // MODE 1x: Must provide exactly 1 guess for jackpot tier
            if (_guesses.length != 1) revert InvalidGuessCount();

            uint256 maxRange = uint256(prizeTiers[tierCount].maxRange);
            if (_guesses[0] < 1 || _guesses[0] > maxRange) {
                revert InvalidGuessRange();
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // VALIDATE AND COLLECT SERVICE FEE
        // ═══════════════════════════════════════════════════════════════════
        
        uint256 requiredFee = getRequiredServiceFee(_isCumulative);
        if (msg.value != requiredFee) revert InsufficientServiceFee();

        // Service fees stay in contract, withdrawn by admin to treasury

        // ═══════════════════════════════════════════════════════════════════
        // PROCESS BKC PAYMENT
        // ═══════════════════════════════════════════════════════════════════
        
        uint256 netWager = _processPayment(_wagerAmount);

        // Increment game counter
        unchecked { ++gameCounter; }
        uint256 gameId = gameCounter;

        // Update stats
        totalWageredAllTime += netWager;

        // ═══════════════════════════════════════════════════════════════════
        // GET RANDOM NUMBERS FROM BACKCOIN ORACLE (INSTANT - FREE!)
        // ═══════════════════════════════════════════════════════════════════
        
        uint256[] memory rolls;
        uint256 totalPrize;
        uint8 matchCount;
        bool[] memory matches;

        if (_isCumulative) {
            // ═══════════════════════════════════════════════════════════════
            // MODE 5x: Get N random numbers (one per tier) using getBatch
            // ═══════════════════════════════════════════════════════════════
            uint64[] memory counts = new uint64[](tierCount);
            uint64[] memory mins = new uint64[](tierCount);
            uint64[] memory maxs = new uint64[](tierCount);
            
            for (uint256 i = 0; i < tierCount;) {
                counts[i] = 1;  // 1 number per tier
                mins[i] = 1;
                maxs[i] = uint64(prizeTiers[i + 1].maxRange);
                unchecked { ++i; }
            }
            
            // Get all random numbers in one call using getBatch (camelCase!)
            uint256[][] memory batchResults = backcoinOracle.getBatch(counts, mins, maxs);
            
            // Flatten batch results to rolls array
            rolls = new uint256[](tierCount);
            matches = new bool[](tierCount);
            
            for (uint256 i = 0; i < tierCount;) {
                rolls[i] = batchResults[i][0];  // Each batch has 1 number
                
                if (_guesses[i] == rolls[i]) {
                    matches[i] = true;
                    matchCount++;
                    uint256 tierPrize = (netWager * prizeTiers[i + 1].multiplierBips) / BIPS_DENOMINATOR;
                    totalPrize += tierPrize;
                    
                    // Emit jackpot event for high-multiplier wins (5x or higher)
                    if (prizeTiers[i + 1].multiplierBips >= 50000) {
                        emit JackpotWon(gameId, msg.sender, tierPrize, i + 1);
                    }
                }
                unchecked { ++i; }
            }
            
        } else {
            // ═══════════════════════════════════════════════════════════════
            // MODE 1x: Get 1 random number for jackpot tier using getNumbers
            // ═══════════════════════════════════════════════════════════════
            uint256 jackpotTier = tierCount;
            uint64 maxRange = uint64(prizeTiers[jackpotTier].maxRange);
            
            matches = new bool[](1);
            
            // Get single random number (camelCase!)
            rolls = backcoinOracle.getNumbers(1, 1, maxRange);
            
            if (_guesses[0] == rolls[0]) {
                matches[0] = true;
                matchCount = 1;
                totalPrize = (netWager * prizeTiers[jackpotTier].multiplierBips) / BIPS_DENOMINATOR;
                
                emit JackpotWon(gameId, msg.sender, totalPrize, jackpotTier);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // APPLY SAFETY CAP AND PAY WINNER
        // ═══════════════════════════════════════════════════════════════════
        
        uint256 maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        if (totalPrize > maxPayout) {
            totalPrize = maxPayout;
        }

        if (totalPrize > 0) {
            prizePoolBalance -= totalPrize;
            totalPaidOutAllTime += totalPrize;
            totalWinsAllTime++;
            bkcToken.safeTransfer(msg.sender, totalPrize);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORE RESULT AND EMIT EVENTS
        // ═══════════════════════════════════════════════════════════════════
        
        gameResults[gameId] = GameResult({
            player: msg.sender,
            wagerAmount: netWager,
            prizeWon: totalPrize,
            guesses: _guesses,
            rolls: rolls,
            isCumulative: _isCumulative,
            matchCount: matchCount,
            timestamp: block.timestamp
        });

        emit GamePlayed(
            gameId,
            msg.sender,
            netWager,
            totalPrize,
            _isCumulative,
            matchCount
        );

        emit GameDetails(
            gameId,
            _guesses,
            rolls,
            matches
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

        // Send fee to mining manager for distribution
        if (fee > 0) {
            bkcToken.safeTransfer(miningManagerAddress, fee);
            IMiningManager(miningManagerAddress).performPurchaseMining(SERVICE_KEY, fee);
        }
    }

    /**
     * @dev Allows contract to receive ETH (service fees)
     */
    receive() external payable {}

    // =========================================================================
    //                      BACKWARDS COMPATIBILITY
    // =========================================================================

    /**
     * @notice Alias for serviceFee (backwards compatibility)
     */
    function oracleFee() external view returns (uint256) {
        return serviceFee;
    }

    /**
     * @notice Alias for getRequiredServiceFee (backwards compatibility)
     */
    function getRequiredOracleFee(bool _isCumulative) external view returns (uint256) {
        return getRequiredServiceFee(_isCumulative);
    }

    /**
     * @notice Alias for backcoinOracle (backwards compatibility)
     * @dev Returns the oracle address for legacy integrations
     */
    function randomnessOracle() external view returns (address) {
        return address(backcoinOracle);
    }
}
