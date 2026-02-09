// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IBackchain.sol";

// ============================================================================
// FORTUNE POOL — IMMUTABLE (Tier 2: ETH + BKC)
// ============================================================================
//
// Provably fair commit-reveal game with 3 prize tiers.
//
// How it works:
//   1. COMMIT: Player picks tiers (1, 2, or 3), submits hash + BKC wager + ETH
//   2. WAIT:   5 blocks for unpredictable blockhash
//   3. REVEAL: Player reveals guesses + secret, contract rolls & pays
//
// Tiers (hardcoded, immutable):
//   Tier 0 — range 1-5,   pays  2x   (20% chance)
//   Tier 1 — range 1-15,  pays  10x  (6.67% chance)
//   Tier 2 — range 1-150, pays  100x (0.67% chance)
//
// The player chooses which tiers to play (any combination).
// Each winning tier pays: grossWager × multiplier.
// Multiple wins in a single game stack.
//
// Economics:
//   - 20% BKC fee on wager → ecosystem (burn/stakers/treasury/operator)
//   - ETH fee per tier played → ecosystem (operator/treasury/buyback)
//   - 80% of wager enters the prize pool
//   - Max payout per game: 10% of prize pool
//   - Pool capped at 1M BKC — excess burned automatically
//   - Expired games forfeit wager to pool
//
// Burn flywheel:
//   Sub-fair multipliers cause the pool to grow ~13% per game.
//   Growth above 1M BKC is burned permanently.
//   The more people play, the more BKC gets burned.
//
// Security:
//   - Commit-reveal: guesses hidden until blockhash exists
//   - Per-tier entropy: keccak256(blockhash, gameId, tierIndex)
//   - 10% payout cap prevents pool drainage
//   - CEI pattern on all payouts
//
// No admin. No pause. Fully immutable and permissionless.
//
// ============================================================================

contract FortunePool {

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    bytes32 public constant MODULE_ID = keccak256("FORTUNE");

    /// @notice Per-tier ETH fee action IDs (configurable in ecosystem)
    bytes32 public constant ACTION_TIER0 = keccak256("FORTUNE_TIER0");
    bytes32 public constant ACTION_TIER1 = keccak256("FORTUNE_TIER1");
    bytes32 public constant ACTION_TIER2 = keccak256("FORTUNE_TIER2");

    uint8   public constant TIER_COUNT     = 3;
    uint256 public constant BKC_FEE_BPS    = 2000;       // 20% BKC fee
    uint256 public constant MAX_PAYOUT_BPS = 1000;        // 10% of pool max
    uint256 public constant REVEAL_DELAY   = 5;           // blocks to wait
    uint256 public constant REVEAL_WINDOW  = 200;         // blocks to reveal
    uint256 public constant POOL_CAP       = 1_000_000e18; // 1M BKC auto-burn

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
    // STATE
    // ════════════════════════════════════════════════════════════════════════

    uint256 public gameCounter;
    uint256 public prizePool;

    /// @dev 3 storage slots per game
    ///      Slot 1: hash (32 bytes)
    ///      Slot 2: player(20) + commitBlock(6) + tierMask(1) + status(1) = 28
    ///      Slot 3: operator(20) + wagerAmount(12) = 32
    struct Commitment {
        bytes32 hash;
        address player;
        uint48  commitBlock;
        uint8   tierMask;       // bitmask: bit0=tier0, bit1=tier1, bit2=tier2
        uint8   status;
        address operator;
        uint96  wagerAmount;    // gross wager (before 20% fee)
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
    event PoolExcessBurned(uint256 amount, uint256 newTotalBurned);

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
    ///
    ///         tierMask is a bitmask:
    ///           1 (0b001) = tier 0 only
    ///           2 (0b010) = tier 1 only
    ///           4 (0b100) = tier 2 only
    ///           3 (0b011) = tier 0 + tier 1
    ///           5 (0b101) = tier 0 + tier 2
    ///           6 (0b110) = tier 1 + tier 2
    ///           7 (0b111) = all three tiers
    ///
    ///         commitHash = keccak256(abi.encode(guesses[], userSecret))
    ///         guesses array has one entry per selected tier, in ascending order.
    ///
    /// @param commitHash  Hash of guesses + secret
    /// @param wagerAmount BKC to wager (gross, before 20% fee)
    /// @param tierMask    Which tiers to play (1-7)
    /// @param operator    Frontend operator address
    /// @return gameId     Assigned game ID
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

        // Store commitment (bounds check for uint96 packing)
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

        // Burn excess if pool > 1M (pass cached value to avoid re-read)
        _checkBurn(newPool);

        emit GameCommitted(gameId, msg.sender, wagerAmount, tierMask, operator);
    }

    // ════════════════════════════════════════════════════════════════════════
    // REVEAL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Reveal guesses and resolve the game.
    ///
    ///         guesses[] has one entry per selected tier, in ascending tier order.
    ///         Example: tierMask=5 (tier 0 + tier 2) → guesses = [guess_t0, guess_t2]
    ///
    /// @param gameId    Game ID from commitPlay
    /// @param guesses   Guesses for each selected tier (ascending order)
    /// @param userSecret Secret used in commit hash
    /// @return prizeWon Total prize won (0 if no match)
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

        // Validate guess count matches selected tiers
        uint8 tierMask = g.tierMask;
        uint8 tierCount = _popcount(tierMask);
        if (guesses.length != tierCount) revert InvalidGuessCount();

        // Entropy from future blockhash
        bytes32 entropy = blockhash(revealBlock);
        if (entropy == bytes32(0)) revert BlockhashUnavailable();

        // ── EVALUATE ──
        uint256 grossWager = uint256(g.wagerAmount);
        uint8 matchCount;
        uint256[] memory rolls = new uint256[](tierCount);
        bool[] memory matches = new bool[](tierCount);
        uint8 guessIdx;

        for (uint8 tier; tier < TIER_COUNT;) {
            if (tierMask & (1 << tier) != 0) {
                (uint256 range, uint256 mult) = _tierData(tier);

                if (guesses[guessIdx] < 1 || guesses[guessIdx] > range)
                    revert InvalidGuessRange();

                uint256 roll = _roll(entropy, gameId, tier, range);
                rolls[guessIdx] = roll;

                if (guesses[guessIdx] == roll) {
                    matches[guessIdx] = true;
                    matchCount++;
                    prizeWon += (grossWager * mult) / BPS;
                }

                unchecked { ++guessIdx; }
            }
            unchecked { ++tier; }
        }

        // Cap at 10% of pool
        uint256 maxPayout = prizePool * MAX_PAYOUT_BPS / BPS;
        if (prizeWon > maxPayout) prizeWon = maxPayout;

        // ── EFFECTS (CEI) ──
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

        // ── INTERACTIONS ──
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
    // FUND PRIZE POOL
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Add BKC to the prize pool. Permissionless.
    function fundPrizePool(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        bkcToken.transferFrom(msg.sender, address(this), amount);
        uint256 newPool = prizePool + amount;
        prizePool = newPool;
        _checkBurn(newPool);
        emit PrizePoolFunded(msg.sender, amount);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS: TIERS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Get tier info
    function getTierInfo(uint8 tier) external pure returns (
        uint256 range, uint256 multiplier, uint256 winChanceBps
    ) {
        (range, multiplier) = _tierData(tier);
        winChanceBps = BPS / range;
    }

    /// @notice Get all 3 tiers
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

    /// @notice Calculate potential winnings for a wager and tier selection
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

    /// @notice Get total ETH fee for selected tiers
    function getRequiredFee(uint8 tierMask) external view returns (uint256 fee) {
        fee = _calculateEthFee(tierMask);
    }

    /// @notice Pool and game statistics
    function getPoolStats() external view returns (
        uint256 _prizePool,
        uint256 _totalGamesPlayed,
        uint256 _totalBkcWagered,
        uint256 _totalBkcWon,
        uint256 _totalBkcForfeited,
        uint256 _totalBkcBurned,
        uint256 _maxPayoutNow
    ) {
        return (
            prizePool, totalGamesPlayed, totalBkcWagered,
            totalBkcWon, totalBkcForfeited, totalBkcBurned,
            prizePool * MAX_PAYOUT_BPS / BPS
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Generate commit hash for frontend
    function generateCommitHash(
        uint256[] calldata guesses,
        bytes32 userSecret
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(guesses, userSecret));
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ════════════════════════════════════════════════════════════════════════

    /// @dev Tier data — hardcoded, immutable, compiled into bytecode.
    ///      Tier 0: range 5,   2x   (20% chance)    — pool growth ~40%
    ///      Tier 1: range 15,  10x  (6.67% chance)   — pool growth ~13%
    ///      Tier 2: range 150, 100x (0.67% chance)   — pool growth ~13%
    function _tierData(uint8 tier) internal pure returns (uint256 range, uint256 multiplierBps) {
        if (tier == 0) return (5,   20_000);       // 2x
        if (tier == 1) return (15,  100_000);      // 10x
        if (tier == 2) return (150, 1_000_000);    // 100x
        revert InvalidTier();
    }

    /// @dev Deterministic roll: [1, maxRange] inclusive
    function _roll(
        bytes32 entropy, uint256 gameId, uint8 tierIndex, uint256 maxRange
    ) internal pure returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(entropy, gameId, tierIndex))) % maxRange) + 1;
    }

    /// @dev Sum ETH fees for selected tiers
    function _calculateEthFee(uint8 tierMask) internal view returns (uint256 fee) {
        if (tierMask & 1 != 0) fee += ecosystem.calculateFee(ACTION_TIER0, 0);
        if (tierMask & 2 != 0) fee += ecosystem.calculateFee(ACTION_TIER1, 0);
        if (tierMask & 4 != 0) fee += ecosystem.calculateFee(ACTION_TIER2, 0);
    }

    /// @dev Count set bits in tier mask (max 3 bits)
    function _popcount(uint8 mask) internal pure returns (uint8 count) {
        if (mask & 1 != 0) count++;
        if (mask & 2 != 0) count++;
        if (mask & 4 != 0) count++;
    }

    /// @dev Expire a game, forfeit wager to pool
    function _expireGame(uint256 gameId, Commitment storage g) internal {
        g.status = S_EXPIRED;
        delete activeGame[g.player];

        // Net wager already in pool from commit — just track the stat
        uint256 netWager = uint256(g.wagerAmount) * (BPS - BKC_FEE_BPS) / BPS;
        totalBkcForfeited += netWager;

        emit GameExpired(gameId, g.player, netWager);
    }

    /// @dev Burn excess BKC when pool exceeds 1M cap
    /// @param currentPool Cached prizePool value (avoids extra SLOAD)
    function _checkBurn(uint256 currentPool) internal {
        if (currentPool > POOL_CAP) {
            uint256 excess = currentPool - POOL_CAP;
            prizePool = POOL_CAP;
            bkcToken.burn(excess);
            totalBkcBurned += excess;
            emit PoolExcessBurned(excess, totalBkcBurned);
        }
    }
}
