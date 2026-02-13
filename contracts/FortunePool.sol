// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// FORTUNE POOL V2 — IMMUTABLE (Tier 2: ETH + BKC)
// ============================================================================
//
// Provably fair commit-reveal game with 3 prize tiers + Activity Pool.
//
// How it works:
//   1. COMMIT: Player picks tiers (1, 2, or 3), submits hash + BKC wager + ETH
//   2. WAIT:   5 blocks for unpredictable blockhash
//   3. REVEAL: Player reveals guesses + secret, contract rolls & pays
//
// Tiers (hardcoded, immutable):
//   Tier 0 — range 1-4,   pays  3x   (25% chance)
//   Tier 1 — range 1-20,  pays  15x  (5% chance)
//   Tier 2 — range 1-100, pays  75x  (1% chance)
//
// V2: Activity Pool
//   - Excess BKC above POOL_CAP → Activity Pool (instead of burn)
//   - When Activity Pool reaches ACTIVITY_THRESHOLD (10K BKC):
//     → Distributes equally to top 10 players by game count in current cycle
//     → If < 10 players: unclaimed portions are burned
//     → Cycle resets after distribution
//   - Incentivizes more games → more ETH fees → more ecosystem revenue
//
// Economics:
//   - 20% BKC fee on wager → ecosystem (burn/stakers/treasury/operator)
//   - ETH fee per tier played → ecosystem (operator/treasury/buyback)
//   - 80% of wager enters the prize pool
//   - Max payout per game: 10% of prize pool
//   - Pool capped at 1M BKC — excess → Activity Pool
//   - Expired games forfeit wager to pool
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

contract FortunePool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID = keccak256("FORTUNE");

    bytes32 public constant ACTION_TIER0 = keccak256("FORTUNE_TIER0");
    bytes32 public constant ACTION_TIER1 = keccak256("FORTUNE_TIER1");
    bytes32 public constant ACTION_TIER2 = keccak256("FORTUNE_TIER2");

    uint8   public constant TIER_COUNT          = 3;
    uint256 public constant BKC_FEE_BPS         = 2000;          // 20% BKC fee
    uint256 public constant MAX_PAYOUT_BPS      = 1000;          // 10% of pool max
    uint256 public constant REVEAL_DELAY        = 5;             // blocks to wait
    uint256 public constant REVEAL_WINDOW       = 200;           // blocks to reveal
    uint256 public constant POOL_CAP            = 1_000_000e18;  // 1M BKC
    uint256 public constant ACTIVITY_THRESHOLD  = 10_000e18;     // 10K BKC
    uint256 public constant TOP_PLAYERS         = 10;            // top 10 per cycle

    uint256 private constant BPS = 10_000;

    uint8 private constant S_NONE      = 0;
    uint8 private constant S_COMMITTED = 1;
    uint8 private constant S_REVEALED  = 2;
    uint8 private constant S_EXPIRED   = 3;

    // ════════════════════════════════════════════════════════════════════════
    // IMMUTABLE
    // ════════════════════════════════════════════════════════════════════════

    IBackchainEcosystem public immutable ecosystem;
    IBKCToken public immutable bkcToken;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — GAME
    // ════════════════════════════════════════════════════════════════════════

    uint256 public gameCounter;
    uint256 public prizePool;

    struct Commitment {
        bytes32 hash;
        address player;
        uint48  commitBlock;
        uint8   tierMask;
        uint8   status;
        address operator;
        uint96  wagerAmount;
    }

    struct GameResult {
        address player;
        uint128 grossWager;
        uint128 prizeWon;
        uint8   tierMask;
        uint8   matchCount;
        uint48  revealBlock;
    }

    mapping(uint256 => Commitment)  public games;
    mapping(uint256 => GameResult)  public gameResults;
    mapping(address => uint256)     public activeGame;

    // Lifetime stats
    uint256 public totalGamesPlayed;
    uint256 public totalBkcWagered;
    uint256 public totalBkcWon;
    uint256 public totalBkcForfeited;
    uint256 public totalBkcBurned;

    // ════════════════════════════════════════════════════════════════════════
    // STATE — ACTIVITY POOL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice BKC accumulated in the activity pool (from excess above cap)
    uint256 public activityPool;

    /// @notice Current cycle number (incremented after each distribution)
    uint256 public currentCycle;

    /// @notice Game count per player in current cycle
    mapping(address => uint256) public cycleGameCount;

    /// @notice All players who played in current cycle (for enumeration)
    address[] internal _cyclePlayers;
    mapping(address => bool) internal _cyclePlayerExists;

    /// @notice Total distributions completed
    uint256 public totalDistributions;

    /// @notice Total BKC distributed via activity pool
    uint256 public totalActivityDistributed;

    /// @notice Total BKC burned from activity pool (unclaimed portions)
    uint256 public totalActivityBurned;

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    event GameCommitted(
        uint256 indexed gameId, address indexed player,
        uint256 wagerAmount, uint8 tierMask, address operator
    );
    event GameRevealed(
        uint256 indexed gameId, address indexed player,
        uint256 grossWager, uint256 prizeWon,
        uint8 tierMask, uint8 matchCount, address operator
    );
    event GameDetails(
        uint256 indexed gameId,
        uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches
    );
    event GameExpired(
        uint256 indexed gameId, address indexed player, uint256 forfeitedAmount
    );
    event PrizePoolFunded(address indexed funder, uint256 amount);
    event PoolExcessToActivity(uint256 amount, uint256 newActivityPool);
    event ActivityDistributed(
        uint256 indexed cycle,
        uint256 totalAmount,
        uint256 burnedAmount,
        uint256 playerCount,
        address[10] topPlayers,
        uint256[10] gameCounts
    );

    // ════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ════════════════════════════════════════════════════════════════════════

    error ZeroAmount();
    error InvalidCommitment();
    error InvalidTierMask();
    error AlreadyCommitted();
    error NotCommitted();
    error TooEarlyToReveal();
    error TooLateToReveal();
    error AlreadyFinalized();
    error CommitmentNotExpired();
    error HashMismatch();
    error InvalidGuessCount();
    error InvalidGuessRange();
    error InsufficientFee();
    error BlockhashUnavailable();
    error InvalidTier();
    error WagerTooLarge();
    error ActivityThresholdNotReached();

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════

    constructor(address _ecosystem, address _bkcToken) {
        ecosystem = IBackchainEcosystem(_ecosystem);
        bkcToken = IBKCToken(_bkcToken);
    }

    // ════════════════════════════════════════════════════════════════════════
    // COMMIT
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Commit a bet. Player chooses which tiers to play.
    function commitPlay(
        bytes32 commitHash,
        uint256 wagerAmount,
        uint8 tierMask,
        address operator
    ) external payable returns (uint256 gameId) {
        if (wagerAmount == 0) revert ZeroAmount();
        if (commitHash == bytes32(0)) revert InvalidCommitment();
        if (tierMask == 0 || tierMask > 7) revert InvalidTierMask();

        // Auto-expire previous game if window passed
        uint256 prevId = activeGame[msg.sender];
        if (prevId != 0) {
            Commitment storage prev = games[prevId];
            if (prev.status == S_COMMITTED) {
                uint256 expiryBlock = uint256(prev.commitBlock) + REVEAL_DELAY + REVEAL_WINDOW;
                if (block.number > expiryBlock) {
                    _expireGame(prevId, prev);
                } else {
                    revert AlreadyCommitted();
                }
            }
        }

        // ETH fee = sum of fees for each selected tier
        uint256 ethFee = _calculateEthFee(tierMask);
        if (msg.value < ethFee) revert InsufficientFee();

        // Pull BKC from player
        bkcToken.transferFrom(msg.sender, address(this), wagerAmount);

        // 20% BKC fee → ecosystem
        uint256 bkcFee = wagerAmount * BKC_FEE_BPS / BPS;
        uint256 netWager = wagerAmount - bkcFee;

        if (bkcFee > 0) {
            bkcToken.approve(address(ecosystem), bkcFee);
        }
        ecosystem.collectFee{value: msg.value}(
            msg.sender, operator, address(0), MODULE_ID, bkcFee
        );

        // 80% → prize pool
        uint256 newPool = prizePool + netWager;
        prizePool = newPool;

        // Store commitment
        if (wagerAmount > type(uint96).max) revert WagerTooLarge();
        gameId = ++gameCounter;
        games[gameId] = Commitment({
            hash: commitHash,
            player: msg.sender,
            commitBlock: uint48(block.number),
            tierMask: tierMask,
            status: S_COMMITTED,
            operator: operator,
            wagerAmount: uint96(wagerAmount)
        });
        activeGame[msg.sender] = gameId;

        totalGamesPlayed++;
        totalBkcWagered += wagerAmount;

        // Track player in current cycle
        _trackCyclePlayer(msg.sender);

        // Redirect excess to activity pool
        _checkExcess(newPool);

        emit GameCommitted(gameId, msg.sender, wagerAmount, tierMask, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REVEAL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Reveal guesses and resolve the game.
    function revealPlay(
        uint256 gameId,
        uint256[] calldata guesses,
        bytes32 userSecret
    ) external returns (uint256 prizeWon) {
        Commitment storage g = games[gameId];
        if (g.player != msg.sender) revert NotCommitted();
        if (g.status != S_COMMITTED) revert AlreadyFinalized();

        // Timing
        uint256 revealBlock = uint256(g.commitBlock) + REVEAL_DELAY;
        if (block.number < revealBlock) revert TooEarlyToReveal();
        if (block.number > revealBlock + REVEAL_WINDOW) revert TooLateToReveal();

        // Verify hash
        bytes32 expected = keccak256(abi.encode(guesses, userSecret));
        if (expected != g.hash) revert HashMismatch();

        // Validate guess count
        uint8 tierMask = g.tierMask;
        uint8 tierCount = _popcount(tierMask);
        if (guesses.length != tierCount) revert InvalidGuessCount();

        // Entropy from future blockhash
        bytes32 entropy = blockhash(revealBlock);
        if (entropy == bytes32(0)) revert BlockhashUnavailable();

        // Evaluate
        uint256 grossWager = uint256(g.wagerAmount);
        uint8 matchCount;
        uint256[] memory rolls = new uint256[](tierCount);
        bool[] memory matches = new bool[](tierCount);
        uint8 guessIdx;

        for (uint8 tier_; tier_ < TIER_COUNT;) {
            if (tierMask & (1 << tier_) != 0) {
                (uint256 range, uint256 mult) = _tierData(tier_);

                if (guesses[guessIdx] < 1 || guesses[guessIdx] > range)
                    revert InvalidGuessRange();

                uint256 roll = _roll(entropy, gameId, tier_, range);
                rolls[guessIdx] = roll;

                if (guesses[guessIdx] == roll) {
                    matches[guessIdx] = true;
                    matchCount++;
                    prizeWon += (grossWager * mult) / BPS;
                }

                unchecked { ++guessIdx; }
            }
            unchecked { ++tier_; }
        }

        // Cap at 10% of pool
        uint256 maxPayout = prizePool * MAX_PAYOUT_BPS / BPS;
        if (prizeWon > maxPayout) prizeWon = maxPayout;

        // Effects (CEI)
        g.status = S_REVEALED;
        delete activeGame[msg.sender];

        if (prizeWon > 0) {
            prizePool -= prizeWon;
            totalBkcWon += prizeWon;
        }

        gameResults[gameId] = GameResult({
            player: msg.sender,
            grossWager: uint128(grossWager),
            prizeWon: uint128(prizeWon),
            tierMask: tierMask,
            matchCount: matchCount,
            revealBlock: uint48(block.number)
        });

        // Interactions
        if (prizeWon > 0) {
            bkcToken.transfer(msg.sender, prizeWon);
        }

        emit GameRevealed(
            gameId, msg.sender, grossWager, prizeWon,
            tierMask, matchCount, g.operator
        );
        emit GameDetails(gameId, tierMask, guesses, rolls, matches);
    }

    // ════════════════════════════════════════════════════════════════════════
    // EXPIRE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Mark an expired game as forfeited. Permissionless.
    function claimExpired(uint256 gameId) external {
        Commitment storage g = games[gameId];
        if (g.status != S_COMMITTED) revert NotCommitted();

        uint256 expiryBlock = uint256(g.commitBlock) + REVEAL_DELAY + REVEAL_WINDOW;
        if (block.number <= expiryBlock) revert CommitmentNotExpired();

        _expireGame(gameId, g);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTIVITY POOL — DISTRIBUTE
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Distribute activity pool to top 10 players. Permissionless.
    ///         Called when activity pool reaches threshold (10K BKC).
    ///         Top 10 by game count in current cycle split the pool equally.
    ///         If fewer than 10 players, unclaimed portions are burned.
    function distributeActivityPool() external {
        if (activityPool < ACTIVITY_THRESHOLD) revert ActivityThresholdNotReached();

        uint256 amount = activityPool;
        activityPool = 0;

        // Find top 10 players by game count
        (address[10] memory topAddrs, uint256[10] memory topCounts, uint256 validCount) = _getTopPlayers();

        uint256 sharePerPlayer = amount / TOP_PLAYERS;
        uint256 distributed;

        for (uint256 i; i < validCount;) {
            bkcToken.transfer(topAddrs[i], sharePerPlayer);
            distributed += sharePerPlayer;
            unchecked { ++i; }
        }

        // Burn unclaimed portions (if < 10 players)
        uint256 toBurn = amount - distributed;
        if (toBurn > 0) {
            bkcToken.burn(toBurn);
            totalBkcBurned += toBurn;
            totalActivityBurned += toBurn;
        }

        totalDistributions++;
        totalActivityDistributed += distributed;

        emit ActivityDistributed(
            currentCycle, amount, toBurn, validCount,
            topAddrs, topCounts
        );

        // Reset cycle
        _resetCycle();
    }

    // ════════════════════════════════════════════════════════════════════════
    // FUND PRIZE POOL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Add BKC to the prize pool. Permissionless.
    function fundPrizePool(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        bkcToken.transferFrom(msg.sender, address(this), amount);
        uint256 newPool = prizePool + amount;
        prizePool = newPool;
        _checkExcess(newPool);
        emit PrizePoolFunded(msg.sender, amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: TIERS
    // ════════════════════════════════════════════════════════════════════════

    function getTierInfo(uint8 tier_) external pure returns (
        uint256 range, uint256 multiplier, uint256 winChanceBps
    ) {
        (range, multiplier) = _tierData(tier_);
        winChanceBps = BPS / range;
    }

    function getAllTiers() external pure returns (
        uint256[3] memory ranges,
        uint256[3] memory multipliers,
        uint256[3] memory winChances
    ) {
        for (uint8 i; i < TIER_COUNT;) {
            (ranges[i], multipliers[i]) = _tierData(i);
            winChances[i] = BPS / ranges[i];
            unchecked { ++i; }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: GAMES
    // ════════════════════════════════════════════════════════════════════════

    function getGame(uint256 gameId) external view returns (
        address player, uint48 commitBlock, uint8 tierMask,
        uint8 status, address operator, uint96 wagerAmount
    ) {
        Commitment storage g = games[gameId];
        return (g.player, g.commitBlock, g.tierMask, g.status, g.operator, g.wagerAmount);
    }

    function getGameResult(uint256 gameId) external view returns (
        address player, uint128 grossWager, uint128 prizeWon,
        uint8 tierMask, uint8 matchCount, uint48 revealBlock
    ) {
        GameResult storage r = gameResults[gameId];
        return (r.player, r.grossWager, r.prizeWon, r.tierMask, r.matchCount, r.revealBlock);
    }

    function getGameStatus(uint256 gameId) external view returns (
        uint8 status, bool canReveal,
        uint256 blocksUntilReveal, uint256 blocksUntilExpiry
    ) {
        Commitment storage g = games[gameId];
        status = g.status;

        if (status == S_COMMITTED) {
            uint256 rb = uint256(g.commitBlock) + REVEAL_DELAY;
            uint256 eb = rb + REVEAL_WINDOW;

            canReveal = block.number >= rb && block.number <= eb;
            blocksUntilReveal = block.number < rb ? rb - block.number : 0;
            blocksUntilExpiry = block.number <= eb ? eb - block.number : 0;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: CALCULATIONS
    // ════════════════════════════════════════════════════════════════════════

    function calculatePotentialWinnings(
        uint256 wagerAmount,
        uint8 tierMask
    ) external view returns (
        uint256 netToPool,
        uint256 bkcFee,
        uint256 maxPrize,
        uint256 maxPrizeAfterCap
    ) {
        bkcFee = wagerAmount * BKC_FEE_BPS / BPS;
        netToPool = wagerAmount - bkcFee;

        for (uint8 i; i < TIER_COUNT;) {
            if (tierMask & (1 << i) != 0) {
                (, uint256 mult) = _tierData(i);
                maxPrize += (wagerAmount * mult) / BPS;
            }
            unchecked { ++i; }
        }

        uint256 poolCap = prizePool * MAX_PAYOUT_BPS / BPS;
        maxPrizeAfterCap = maxPrize > poolCap ? poolCap : maxPrize;
    }

    function getRequiredFee(uint8 tierMask) external view returns (uint256 fee) {
        fee = _calculateEthFee(tierMask);
    }

    function getPoolStats() external view returns (
        uint256 _prizePool,
        uint256 _activityPool,
        uint256 _totalGamesPlayed,
        uint256 _totalBkcWagered,
        uint256 _totalBkcWon,
        uint256 _totalBkcForfeited,
        uint256 _totalBkcBurned,
        uint256 _maxPayoutNow
    ) {
        return (
            prizePool, activityPool, totalGamesPlayed, totalBkcWagered,
            totalBkcWon, totalBkcForfeited, totalBkcBurned,
            prizePool * MAX_PAYOUT_BPS / BPS
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: ACTIVITY POOL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get activity pool state
    function getActivityPoolInfo() external view returns (
        uint256 poolBalance,
        uint256 threshold,
        uint256 cycle,
        uint256 playerCount,
        bool canDistribute
    ) {
        return (
            activityPool,
            ACTIVITY_THRESHOLD,
            currentCycle,
            _cyclePlayers.length,
            activityPool >= ACTIVITY_THRESHOLD
        );
    }

    /// @notice Get top 10 players in current cycle (view only)
    function getTopPlayersView() external view returns (
        address[10] memory topAddrs,
        uint256[10] memory topCounts,
        uint256 validCount
    ) {
        return _getTopPlayers();
    }

    /// @notice Get a player's game count in current cycle
    function getPlayerCycleGames(address player) external view returns (uint256) {
        return cycleGameCount[player];
    }

    /// @notice Get activity pool stats
    function getActivityStats() external view returns (
        uint256 _totalDistributions,
        uint256 _totalActivityDistributed,
        uint256 _totalActivityBurned,
        uint256 _currentCycle
    ) {
        return (
            totalDistributions,
            totalActivityDistributed,
            totalActivityBurned,
            currentCycle
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    function generateCommitHash(
        uint256[] calldata guesses,
        bytes32 userSecret
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(guesses, userSecret));
    }

    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    function _tierData(uint8 tier_) internal pure returns (uint256 range, uint256 multiplierBps) {
        if (tier_ == 0) return (4,   30_000);    // 3x
        if (tier_ == 1) return (20,  150_000);   // 15x
        if (tier_ == 2) return (100, 750_000);   // 75x
        revert InvalidTier();
    }

    function _roll(
        bytes32 entropy, uint256 gameId, uint8 tierIndex, uint256 maxRange
    ) internal pure returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(entropy, gameId, tierIndex))) % maxRange) + 1;
    }

    function _calculateEthFee(uint8 tierMask) internal view returns (uint256 fee) {
        if (tierMask & 1 != 0) fee += ecosystem.calculateFee(ACTION_TIER0, 0);
        if (tierMask & 2 != 0) fee += ecosystem.calculateFee(ACTION_TIER1, 0);
        if (tierMask & 4 != 0) fee += ecosystem.calculateFee(ACTION_TIER2, 0);
    }

    function _popcount(uint8 mask) internal pure returns (uint8 count) {
        if (mask & 1 != 0) count++;
        if (mask & 2 != 0) count++;
        if (mask & 4 != 0) count++;
    }

    function _expireGame(uint256 gameId, Commitment storage g) internal {
        g.status = S_EXPIRED;
        delete activeGame[g.player];

        uint256 netWager = uint256(g.wagerAmount) * (BPS - BKC_FEE_BPS) / BPS;
        totalBkcForfeited += netWager;

        emit GameExpired(gameId, g.player, netWager);
    }

    /// @dev Redirect excess BKC above cap to activity pool (instead of burning)
    function _checkExcess(uint256 currentPool) internal {
        if (currentPool > POOL_CAP) {
            uint256 excess = currentPool - POOL_CAP;
            prizePool = POOL_CAP;
            activityPool += excess;
            emit PoolExcessToActivity(excess, activityPool);
        }
    }

    /// @dev Track a player's game count in the current cycle
    function _trackCyclePlayer(address player) internal {
        cycleGameCount[player]++;
        if (!_cyclePlayerExists[player]) {
            _cyclePlayerExists[player] = true;
            _cyclePlayers.push(player);
        }
    }

    /// @dev Find top 10 players by game count (insertion sort on small array)
    function _getTopPlayers() internal view returns (
        address[10] memory topAddrs,
        uint256[10] memory topCounts,
        uint256 validCount
    ) {
        uint256 playerLen = _cyclePlayers.length;

        for (uint256 i; i < playerLen;) {
            address player = _cyclePlayers[i];
            uint256 count = cycleGameCount[player];

            // Check if this player qualifies for top 10
            if (validCount < TOP_PLAYERS || count > topCounts[TOP_PLAYERS - 1]) {
                // Find insertion position (descending)
                uint256 pos = validCount < TOP_PLAYERS ? validCount : TOP_PLAYERS - 1;
                for (uint256 j; j < validCount && j < TOP_PLAYERS;) {
                    if (count > topCounts[j]) {
                        pos = j;
                        break;
                    }
                    unchecked { ++j; }
                }

                // Shift down
                if (pos < TOP_PLAYERS - 1) {
                    uint256 end = validCount < TOP_PLAYERS - 1 ? validCount : TOP_PLAYERS - 1;
                    for (uint256 j = end; j > pos;) {
                        topAddrs[j] = topAddrs[j - 1];
                        topCounts[j] = topCounts[j - 1];
                        unchecked { --j; }
                    }
                }

                topAddrs[pos] = player;
                topCounts[pos] = count;
                if (validCount < TOP_PLAYERS) validCount++;
            }

            unchecked { ++i; }
        }
    }

    /// @dev Reset cycle data for next round
    function _resetCycle() internal {
        uint256 len = _cyclePlayers.length;
        for (uint256 i; i < len;) {
            address player = _cyclePlayers[i];
            delete cycleGameCount[player];
            delete _cyclePlayerExists[player];
            unchecked { ++i; }
        }
        delete _cyclePlayers;
        currentCycle++;
    }
}
