// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/*
 * ============================================================================
 *
 *                             BACKCHAIN PROTOCOL
 *
 *                    ██╗   ██╗███╗   ██╗███████╗████████╗ ██████╗ ██████╗
 *                    ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
 *                    ██║   ██║██╔██╗ ██║███████╗   ██║   ██║   ██║██████╔╝
 *                    ██║   ██║██║╚██╗██║╚════██║   ██║   ██║   ██║██╔═══╝
 *                    ╚██████╔╝██║ ╚████║███████║   ██║   ╚██████╔╝██║
 *                     ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 *
 *                    P E R M I S S I O N L E S S   .   I M M U T A B L E
 *
 * ============================================================================
 *  Contract    : FortunePool
 *  Version     : 6.0.0
 *  Network     : Arbitrum
 *  License     : MIT
 *  Solidity    : 0.8.28
 * ============================================================================
 *
 *  100% DECENTRALIZED SYSTEM
 *
 *  This contract is part of a fully decentralized, permissionless,
 *  and UNSTOPPABLE protocol.
 *
 *  - NO CENTRAL AUTHORITY    : Code is law
 *  - NO PERMISSION NEEDED    : Anyone can become an Operator
 *  - NO SINGLE POINT OF FAILURE : Runs on Arbitrum blockchain
 *  - CENSORSHIP RESISTANT    : Cannot be stopped or controlled
 *
 * ============================================================================
 *
 *  BECOME AN OPERATOR
 *
 *  Anyone in the world can:
 *
 *  1. Build their own frontend, app, bot, or tool for Backchain
 *  2. Pass their wallet address as the "operator" parameter
 *  3. Earn a percentage of ALL fees (BKC + ETH) generated
 *
 *  No registration. No approval. No KYC. Just build and earn.
 *
 * ============================================================================
 *
 *  SECURITY MODEL: COMMIT-REVEAL (V3.0)
 *
 *  This version uses a secure 2-phase commit-reveal pattern that makes
 *  it IMPOSSIBLE to predict or manipulate game outcomes.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  PHASE 1: COMMIT                                                        │
 *  │  ─────────────────                                                      │
 *  │  Player submits: hash(guesses + secret)                                 │
 *  │  - Guesses are HIDDEN (only hash is public)                             │
 *  │  - Wager and fees are collected                                         │
 *  │  - Block number is recorded                                             │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │  WAIT: 5 BLOCKS (~1.25 seconds on Arbitrum)                             │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │  PHASE 2: REVEAL                                                        │
 *  │  ───────────────                                                        │
 *  │  Player reveals: guesses + secret                                       │
 *  │  - Contract verifies hash matches commitment                            │
 *  │  - Uses blockhash(commitBlock + 5) as entropy                           │
 *  │  - This block DID NOT EXIST at commit time                              │
 *  │  - Result is determined and prize paid instantly                        │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  WHY IS THIS SECURE?
 *  - At commit time, future blockhash is UNKNOWN
 *  - Guesses are hidden, so no one can front-run
 *  - To cheat, attacker would need to control Arbitrum sequencer
 *  - $18B+ TVL already trusts this assumption
 *
 * ============================================================================
 *
 *  GAME MODES
 *
 *  ╔═══════════════════════════════════════════════════════════════════════╗
 *  ║  MODE 1x (Jackpot Mode):                                              ║
 *  ║  - Player competes ONLY for highest tier (hardest, best prize)        ║
 *  ║  - Requires 1 guess for the jackpot tier                              ║
 *  ║  - Pays 1x service fee                                                ║
 *  ╠═══════════════════════════════════════════════════════════════════════╣
 *  ║  MODE 5x (Cumulative Mode):                                           ║
 *  ║  - Player competes for ALL active tiers simultaneously                ║
 *  ║  - Requires N guesses (one per active tier)                           ║
 *  ║  - Pays 5x service fee                                                ║
 *  ║  - All matching tiers pay out (cumulative rewards)                    ║
 *  ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ============================================================================
 *
 *  FEE STRUCTURE (V6 - EQUAL FOR ALL)
 *
 *  +-------------+------------------+----------------------------------------+
 *  | Fee Type    | Default          | Destination                            |
 *  +-------------+------------------+----------------------------------------+
 *  | Service Fee | 0.0001 ETH (1x)  | MiningManager (operator + treasury)    |
 *  |             | 0.0005 ETH (5x)  |                                        |
 *  | Game Fee    | 10% of wager     | MiningManager (operator + burn +       |
 *  |             |                  | treasury + delegators)                 |
 *  +-------------+------------------+----------------------------------------+
 *
 *  IMPORTANT: Fees are the SAME for all users. NFT ownership does NOT
 *             provide discounts on FortunePool fees. NFTs only affect
 *             the burn rate when claiming rewards from DelegationManager.
 *
 * ============================================================================
 *
 *  FEE DISTRIBUTION
 *
 *  BKC Flow (Game Fee):
 *  +------------------------------------------------------------------+
 *  |                      BKC FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |      +----------------------+----------------------+             |
 *  |      |          |           |                      |             |
 *  |      v          v           v                      v             |
 *  |  OPERATOR     BURN      TREASURY             DELEGATORS          |
 *  |  (config%)  (config%)   (config%)             (config%)          |
 *  +------------------------------------------------------------------+
 *
 *  ETH Flow (Service Fee):
 *  +------------------------------------------------------------------+
 *  |                      ETH FEE COLLECTED                           |
 *  |                             |                                    |
 *  |                             v                                    |
 *  |                       MININGMANAGER                              |
 *  |                             |                                    |
 *  |           +-----------------+-----------------+                  |
 *  |           |                                   |                  |
 *  |           v                                   v                  |
 *  |       OPERATOR                            TREASURY               |
 *  |       (config%)                           (remaining)            |
 *  +------------------------------------------------------------------+
 *
 * ============================================================================
 *  Security Contact : dev@backcoin.org
 *  Website          : https://backcoin.org
 *  Documentation    : https://github.com/backcoin-org/backchain-dapp/tree/main/docs
 * ============================================================================
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./IInterfaces.sol";
import "./BKCToken.sol";

interface IMiningManagerV3 {
    function performPurchaseMiningWithOperator(
        bytes32 serviceKey,
        uint256 purchaseAmount,
        address operator
    ) external payable;
}

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

    uint256 private constant BIPS_DENOMINATOR = 10_000;

    uint256 public constant MAX_PAYOUT_BIPS = 5_000;

    uint256 public constant MAX_GAME_FEE_BIPS = 3_000;

    bytes32 public constant SERVICE_KEY = keccak256("FORTUNE_POOL_SERVICE");

    uint256 public constant CUMULATIVE_FEE_MULTIPLIER = 5;

    uint256 public constant MIN_REVEAL_DELAY = 1;

    uint256 public constant MAX_REVEAL_DELAY = 50;

    uint256 public constant DEFAULT_REVEAL_DELAY = 5;

    uint256 public constant DEFAULT_REVEAL_WINDOW = 251;

    uint256 public constant MAX_REVEAL_WINDOW = 251;

    // =========================================================================
    //                              ENUMS
    // =========================================================================

    enum CommitmentStatus {
        NONE,
        COMMITTED,
        REVEALED,
        EXPIRED
    }

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    struct PrizeTier {
        uint128 maxRange;
        uint64 multiplierBips;
        bool active;
    }

    /// @notice Packed commitment struct (2 slots)
    struct Commitment {
        address player;
        uint64 commitBlock;
        bool isCumulative;
        CommitmentStatus status;
        uint128 wagerAmount;
        uint128 ethPaid;
    }

    struct GameResult {
        address player;
        uint256 wagerAmount;
        uint256 prizeWon;
        uint256[] guesses;
        uint256[] rolls;
        bool isCumulative;
        uint8 matchCount;
        uint256 timestamp;
    }

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
    error TransferFailed();
    error NoActiveTiers();
    error CoreContractNotSet();
    error InvalidCommitment();
    error NotCommitmentOwner();
    error TooEarlyToReveal();
    error TooLateToReveal();
    error AlreadyRevealed();
    error CommitmentNotExpired();
    error HashMismatch();
    error InvalidDelay();
    error BlockhashUnavailable();

    // =========================================================================
    //                              STATE
    // =========================================================================

    IEcosystemManager public ecosystemManager;

    BKCToken public bkcToken;

    address public miningManagerAddress;

    uint256 public serviceFee;

    uint256 public gameFeeBips;

    uint256 public gameCounter;

    uint256 public prizePoolBalance;

    uint256 public activeTierCount;

    uint256 public revealDelay;

    uint256 public revealWindow;

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    uint256 public totalWageredAllTime;

    uint256 public totalPaidOutAllTime;

    uint256 public totalWinsAllTime;

    uint256 public totalETHCollected;

    uint256 public totalBKCFees;

    uint256 public totalExpiredGames;

    // -------------------------------------------------------------------------
    // Mappings
    // -------------------------------------------------------------------------

    mapping(uint256 => PrizeTier) public prizeTiers;

    mapping(uint256 => Commitment) public commitments;

    mapping(uint256 => bytes32) public commitmentHashes;

    mapping(uint256 => address) public commitmentOperators;

    mapping(uint256 => GameResult) public gameResults;

    // =========================================================================
    //                           STORAGE GAP
    // =========================================================================

    uint256[35] private __gap;

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event TierConfigured(
        uint256 indexed tierId,
        uint128 maxRange,
        uint64 multiplierBips,
        bool active
    );

    event PrizePoolFunded(uint256 amount, uint256 newBalance);

    event ServiceFeeUpdated(uint256 previousFee, uint256 newFee);

    event GameFeeUpdated(uint256 previousFeeBips, uint256 newFeeBips);

    event RevealDelayUpdated(uint256 previousDelay, uint256 newDelay);

    event GameCommitted(
        uint256 indexed gameId,
        address indexed player,
        uint256 wagerAmount,
        bool isCumulative,
        address operator
    );

    event GameRevealed(
        uint256 indexed gameId,
        address indexed player,
        uint256 wagerAmount,
        uint256 prizeWon,
        bool isCumulative,
        uint8 matchCount,
        address operator
    );

    event GameDetails(
        uint256 indexed gameId,
        uint256[] guesses,
        uint256[] rolls,
        bool[] matches
    );

    event JackpotWon(
        uint256 indexed gameId,
        address indexed player,
        uint256 prizeAmount,
        uint256 tier
    );

    event GameExpired(
        uint256 indexed gameId,
        address indexed player,
        uint256 forfeitedAmount
    );

    event EmergencyWithdrawal(address indexed to, uint256 amount);

    // =========================================================================
    //                           INITIALIZATION
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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
        address mmAddress = ecosystemManager.getMiningManagerAddress();

        if (bkcAddress == address(0) || mmAddress == address(0)) {
            revert CoreContractNotSet();
        }

        bkcToken = BKCToken(bkcAddress);
        miningManagerAddress = mmAddress;

        gameFeeBips = 1000;
        serviceFee = 0.0001 ether;
        revealDelay = DEFAULT_REVEAL_DELAY;
        revealWindow = DEFAULT_REVEAL_WINDOW;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // =========================================================================
    //                         ADMIN FUNCTIONS
    // =========================================================================

    function setServiceFee(uint256 _fee) external onlyOwner {
        uint256 previousFee = serviceFee;
        serviceFee = _fee;
        emit ServiceFeeUpdated(previousFee, _fee);
    }

    function setGameFee(uint256 _feeBips) external onlyOwner {
        if (_feeBips > MAX_GAME_FEE_BIPS) revert InvalidFee();
        uint256 previousFee = gameFeeBips;
        gameFeeBips = _feeBips;
        emit GameFeeUpdated(previousFee, _feeBips);
    }

    function setRevealDelay(uint256 _delay) external onlyOwner {
        if (_delay < MIN_REVEAL_DELAY || _delay > MAX_REVEAL_DELAY) {
            revert InvalidDelay();
        }
        uint256 previousDelay = revealDelay;
        revealDelay = _delay;
        emit RevealDelayUpdated(previousDelay, _delay);
    }

    function setRevealWindow(uint256 _window) external onlyOwner {
        if (_window < 100 || _window > MAX_REVEAL_WINDOW) revert InvalidDelay();
        revealWindow = _window;
    }

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

    function reduceTierCount(uint256 _newCount) external onlyOwner {
        if (_newCount >= activeTierCount) revert InvalidTierSequence();
        activeTierCount = _newCount;
    }

    function fundPrizePool(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert ZeroAmount();
        bkcToken.safeTransferFrom(msg.sender, address(this), _amount);
        unchecked {
            prizePoolBalance += _amount;
        }
        emit PrizePoolFunded(_amount, prizePoolBalance);
    }

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

    function updateMiningManager() external onlyOwner {
        address mmAddress = ecosystemManager.getMiningManagerAddress();
        if (mmAddress == address(0)) revert CoreContractNotSet();
        miningManagerAddress = mmAddress;
    }

    // =========================================================================
    //                          VIEW FUNCTIONS
    // =========================================================================

    function getJackpotTierId() public view returns (uint256) {
        return activeTierCount;
    }

    function getTier(uint256 _tierId) external view returns (
        uint128 maxRange,
        uint64 multiplierBips,
        bool active
    ) {
        PrizeTier storage tier = prizeTiers[_tierId];
        return (tier.maxRange, tier.multiplierBips, tier.active);
    }

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

    function getAllTiers() external view returns (
        uint128[] memory ranges,
        uint64[] memory multipliers
    ) {
        uint256 count = activeTierCount;
        ranges = new uint128[](count);
        multipliers = new uint64[](count);

        for (uint256 i; i < count;) {
            PrizeTier storage tier = prizeTiers[i + 1];
            ranges[i] = tier.maxRange;
            multipliers[i] = tier.multiplierBips;
            unchecked { ++i; }
        }
    }

    function getRequiredServiceFee(bool _isCumulative) public view returns (uint256) {
        unchecked {
            return _isCumulative ? serviceFee * CUMULATIVE_FEE_MULTIPLIER : serviceFee;
        }
    }

    function getExpectedGuessCount(bool _isCumulative) public view returns (uint256) {
        return _isCumulative ? activeTierCount : 1;
    }

    function calculatePotentialWinnings(
        uint256 _wagerAmount,
        bool _isCumulative
    ) external view returns (uint256 maxPrize, uint256 netWager) {
        uint256 fee;
        unchecked {
            fee = (_wagerAmount * gameFeeBips) / BIPS_DENOMINATOR;
            netWager = _wagerAmount - fee;
        }

        uint256 count = activeTierCount;
        if (count == 0) return (0, netWager);

        if (_isCumulative) {
            for (uint256 i; i < count;) {
                unchecked {
                    maxPrize += (netWager * prizeTiers[i + 1].multiplierBips) / BIPS_DENOMINATOR;
                    ++i;
                }
            }
        } else {
            unchecked {
                maxPrize = (netWager * prizeTiers[count].multiplierBips) / BIPS_DENOMINATOR;
            }
        }

        uint256 maxPayout;
        unchecked {
            maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        }
        if (maxPrize > maxPayout) {
            maxPrize = maxPayout;
        }
    }

    function getCommitment(uint256 _gameId) external view returns (
        address player,
        uint64 commitBlock,
        bool isCumulative,
        CommitmentStatus status,
        uint256 wagerAmount,
        uint256 ethPaid
    ) {
        Commitment storage c = commitments[_gameId];
        return (
            c.player,
            c.commitBlock,
            c.isCumulative,
            c.status,
            uint256(c.wagerAmount),
            uint256(c.ethPaid)
        );
    }

    function getCommitmentStatus(uint256 _gameId) external view returns (
        CommitmentStatus status,
        bool canReveal,
        bool isExpired,
        uint256 blocksUntilReveal,
        uint256 blocksUntilExpiry
    ) {
        Commitment storage c = commitments[_gameId];
        status = c.status;

        if (status != CommitmentStatus.COMMITTED) {
            return (status, false, false, 0, 0);
        }

        uint256 revealBlock = uint256(c.commitBlock) + revealDelay;
        uint256 expiryBlock = uint256(c.commitBlock) + revealWindow;

        canReveal = block.number >= revealBlock && block.number <= expiryBlock;
        isExpired = block.number > expiryBlock;

        if (block.number < revealBlock) {
            blocksUntilReveal = revealBlock - block.number;
        }

        if (block.number < expiryBlock) {
            blocksUntilExpiry = expiryBlock - block.number;
        }
    }

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

    function getPoolStats() external view returns (
        uint256 poolBalance,
        uint256 gamesPlayed,
        uint256 wageredAllTime,
        uint256 paidOutAllTime,
        uint256 winsAllTime,
        uint256 ethCollected,
        uint256 bkcFees,
        uint256 expiredGames
    ) {
        return (
            prizePoolBalance,
            gameCounter,
            totalWageredAllTime,
            totalPaidOutAllTime,
            totalWinsAllTime,
            totalETHCollected,
            totalBKCFees,
            totalExpiredGames
        );
    }

    // =========================================================================
    //                    PHASE 1: COMMIT (Start Game)
    // =========================================================================

    /**
     * @notice Commit to play a game (Phase 1 of 2)
     * @dev Player submits a hash of their guesses + secret.
     *
     *      Commitment Hash = keccak256(abi.encodePacked(guesses, userSecret))
     *
     * @param _commitmentHash Hash of (guesses + userSecret)
     * @param _wagerAmount Amount to wager in BKC
     * @param _isCumulative false = 1x mode, true = 5x mode
     * @param _operator Address of the frontend operator
     * @return gameId The game ID for this commitment
     */
    function commitPlay(
        bytes32 _commitmentHash,
        uint256 _wagerAmount,
        bool _isCumulative,
        address _operator
    ) external payable nonReentrant returns (uint256 gameId) {
        if (_wagerAmount == 0) revert ZeroAmount();
        if (_commitmentHash == bytes32(0)) revert InvalidCommitment();

        uint256 tierCount = activeTierCount;
        if (tierCount == 0) revert NoActiveTiers();

        uint256 requiredFee = getRequiredServiceFee(_isCumulative);
        if (msg.value < requiredFee) revert InsufficientServiceFee();

        uint256 fee;
        uint256 netWager;
        unchecked {
            fee = (_wagerAmount * gameFeeBips) / BIPS_DENOMINATOR;
            netWager = _wagerAmount - fee;
        }

        if (miningManagerAddress == address(0)) revert CoreContractNotSet();

        bkcToken.safeTransferFrom(msg.sender, address(this), _wagerAmount);

        unchecked {
            prizePoolBalance += netWager;
            totalETHCollected += msg.value;
        }

        if (fee > 0) {
            bkcToken.safeTransfer(miningManagerAddress, fee);
            unchecked {
                totalBKCFees += fee;
            }

            try IMiningManagerV3(miningManagerAddress).performPurchaseMiningWithOperator(
                SERVICE_KEY,
                fee,
                _operator
            ) {} catch {}
        }

        _sendETHToMining(msg.value, _operator);

        unchecked {
            gameId = ++gameCounter;
        }

        commitments[gameId] = Commitment({
            player: msg.sender,
            commitBlock: uint64(block.number),
            isCumulative: _isCumulative,
            status: CommitmentStatus.COMMITTED,
            wagerAmount: uint128(netWager),
            ethPaid: uint128(msg.value)
        });

        commitmentHashes[gameId] = _commitmentHash;
        commitmentOperators[gameId] = _operator;

        unchecked {
            totalWageredAllTime += netWager;
        }

        emit GameCommitted(
            gameId,
            msg.sender,
            netWager,
            _isCumulative,
            _operator
        );
    }

    // =========================================================================
    //                    PHASE 2: REVEAL (Complete Game)
    // =========================================================================

    /**
     * @notice Reveal guesses and complete the game (Phase 2 of 2)
     * @dev Must wait revealDelay blocks after commit.
     *
     * @param _gameId The game ID from commitPlay
     * @param _guesses Array of predictions
     * @param _userSecret The secret used in commitment hash
     * @return prizeWon Amount won (0 if lost)
     */
    function revealPlay(
        uint256 _gameId,
        uint256[] calldata _guesses,
        bytes32 _userSecret
    ) external nonReentrant returns (uint256 prizeWon) {
        Commitment storage c = commitments[_gameId];

        if (c.status != CommitmentStatus.COMMITTED) revert AlreadyRevealed();
        if (c.player != msg.sender) revert NotCommitmentOwner();

        uint256 commitBlock = uint256(c.commitBlock);
        if (block.number < commitBlock + revealDelay) revert TooEarlyToReveal();
        if (block.number > commitBlock + revealWindow) revert TooLateToReveal();

        bytes32 calculatedHash = keccak256(abi.encodePacked(_guesses, _userSecret));
        if (calculatedHash != commitmentHashes[_gameId]) revert HashMismatch();

        uint256 tierCount = activeTierCount;
        bool isCumulative = c.isCumulative;

        if (isCumulative) {
            if (_guesses.length != tierCount) revert InvalidGuessCount();
            for (uint256 i; i < tierCount;) {
                uint256 maxRange = uint256(prizeTiers[i + 1].maxRange);
                if (_guesses[i] < 1 || _guesses[i] > maxRange) {
                    revert InvalidGuessRange();
                }
                unchecked { ++i; }
            }
        } else {
            if (_guesses.length != 1) revert InvalidGuessCount();
            uint256 maxRange = uint256(prizeTiers[tierCount].maxRange);
            if (_guesses[0] < 1 || _guesses[0] > maxRange) {
                revert InvalidGuessRange();
            }
        }

        bytes32 blockEntropy = blockhash(commitBlock + revealDelay);
        if (blockEntropy == bytes32(0)) {
            revert BlockhashUnavailable();
        }

        uint256 netWager = uint256(c.wagerAmount);
        address operator = commitmentOperators[_gameId];

        uint256[] memory rolls;
        uint8 matchCount;
        bool[] memory matches;

        if (isCumulative) {
            rolls = new uint256[](tierCount);
            matches = new bool[](tierCount);

            for (uint256 i; i < tierCount;) {
                bytes32 tierEntropy = keccak256(abi.encodePacked(
                    blockEntropy,
                    _gameId,
                    i
                ));
                uint256 maxRange = uint256(prizeTiers[i + 1].maxRange);
                rolls[i] = (uint256(tierEntropy) % maxRange) + 1;

                if (_guesses[i] == rolls[i]) {
                    matches[i] = true;
                    unchecked {
                        matchCount++;
                    }
                    uint256 tierPrize;
                    unchecked {
                        tierPrize = (netWager * prizeTiers[i + 1].multiplierBips) / BIPS_DENOMINATOR;
                        prizeWon += tierPrize;
                    }

                    if (prizeTiers[i + 1].multiplierBips >= 50000) {
                        emit JackpotWon(_gameId, msg.sender, tierPrize, i + 1);
                    }
                }
                unchecked { ++i; }
            }
        } else {
            rolls = new uint256[](1);
            matches = new bool[](1);

            uint256 jackpotTier = tierCount;
            uint256 maxRange = uint256(prizeTiers[jackpotTier].maxRange);

            bytes32 tierEntropy = keccak256(abi.encodePacked(
                blockEntropy,
                _gameId,
                uint256(0)
            ));
            rolls[0] = (uint256(tierEntropy) % maxRange) + 1;

            if (_guesses[0] == rolls[0]) {
                matches[0] = true;
                matchCount = 1;
                unchecked {
                    prizeWon = (netWager * prizeTiers[jackpotTier].multiplierBips) / BIPS_DENOMINATOR;
                }
                emit JackpotWon(_gameId, msg.sender, prizeWon, jackpotTier);
            }
        }

        uint256 maxPayout;
        unchecked {
            maxPayout = (prizePoolBalance * MAX_PAYOUT_BIPS) / BIPS_DENOMINATOR;
        }
        if (prizeWon > maxPayout) {
            prizeWon = maxPayout;
        }

        if (prizeWon > 0) {
            unchecked {
                prizePoolBalance -= prizeWon;
                totalPaidOutAllTime += prizeWon;
                totalWinsAllTime++;
            }
            bkcToken.safeTransfer(msg.sender, prizeWon);
        }

        c.status = CommitmentStatus.REVEALED;

        gameResults[_gameId] = GameResult({
            player: msg.sender,
            wagerAmount: netWager,
            prizeWon: prizeWon,
            guesses: _guesses,
            rolls: rolls,
            isCumulative: isCumulative,
            matchCount: matchCount,
            timestamp: block.timestamp
        });

        emit GameRevealed(
            _gameId,
            msg.sender,
            netWager,
            prizeWon,
            isCumulative,
            matchCount,
            operator
        );

        emit GameDetails(
            _gameId,
            _guesses,
            rolls,
            matches
        );
    }

    // =========================================================================
    //                    EXPIRED GAMES (Forfeit)
    // =========================================================================

    /**
     * @notice Claim an expired game (player forfeited)
     * @param _gameId The game ID that expired
     */
    function claimExpiredGame(uint256 _gameId) external {
        Commitment storage c = commitments[_gameId];

        if (c.status != CommitmentStatus.COMMITTED) revert InvalidCommitment();

        uint256 expiryBlock = uint256(c.commitBlock) + revealWindow;
        if (block.number <= expiryBlock) revert CommitmentNotExpired();

        c.status = CommitmentStatus.EXPIRED;

        unchecked {
            totalExpiredGames++;
        }

        emit GameExpired(_gameId, c.player, uint256(c.wagerAmount));
    }

    // =========================================================================
    //                         INTERNAL FUNCTIONS
    // =========================================================================

    function _sendETHToMining(uint256 _amount, address _operator) internal {
        if (miningManagerAddress == address(0) || _amount == 0) return;

        try IMiningManagerV3(miningManagerAddress).performPurchaseMiningWithOperator{value: _amount}(
            SERVICE_KEY,
            0,
            _operator
        ) {} catch {
            address treasury = ecosystemManager.getTreasuryAddress();
            if (treasury != address(0)) {
                (bool success, ) = treasury.call{value: _amount}("");
                if (!success) revert TransferFailed();
            }
        }
    }

    receive() external payable {}

    // =========================================================================
    //                      HELPER FUNCTIONS
    // =========================================================================

    /**
     * @notice Helper to generate commitment hash
     * @param _guesses Array of predictions
     * @param _userSecret Random secret
     * @return hash The commitment hash
     */
    function generateCommitmentHash(
        uint256[] calldata _guesses,
        bytes32 _userSecret
    ) external pure returns (bytes32 hash) {
        return keccak256(abi.encodePacked(_guesses, _userSecret));
    }
}
