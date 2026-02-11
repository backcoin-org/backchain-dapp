// modules/js/transactions/fortune-tx.js
// ✅ V9.0 - Updated for FortunePool V9 (Tier 2: ETH + BKC)
//
// CHANGES V9.0:
// - Removed fortunePoolV2 fallback — only fortunePool
// - commitPlay: bool isCumulative → uint8 tierMask (bitmask: bit0=tier0, bit1=tier1, bit2=tier2)
// - 3 hardcoded tiers (0-indexed): range 5/15/150, mult 2x/10x/100x
// - activeTierCount/prizeTiers → getAllTiers() returns fixed [3] arrays
// - getRequiredServiceFee(bool) → getRequiredFee(uint8 tierMask)
// - getCommitmentStatus → getGameStatus (different return tuple)
// - calculatePotentialWinnings(amount, bool) → calculatePotentialWinnings(amount, tierMask) returns 4-tuple
// - getGameResult returns different struct
// - generateCommitmentHash → generateCommitHash (uses abi.encode, not abi.encodePacked)
// - prizePoolBalance → prizePool
// - getPoolStats returns 7-tuple (no ethCollected/bkcFees/expiredGames)
// - Events updated for tierMask
//
// ============================================================================
// GAME FLOW (2 PHASES):
// 1. COMMIT: hash(guesses + secret) + wager + tierMask + operator → gameId
// 2. REVEAL: guesses + secret → contract verifies, rolls, pays
// ============================================================================

import { txEngine, ValidationLayer, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const fortunePool = addresses?.fortunePool ||
                        contractAddresses?.fortunePool ||
                        window.contractAddresses?.fortunePool;

    const bkcToken = addresses?.bkcToken ||
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;

    if (!fortunePool) {
        console.error('❌ FortunePool address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    return { BKC_TOKEN: bkcToken, FORTUNE_POOL: fortunePool };
}

/**
 * FortunePool V9 ABI
 */
const FORTUNE_ABI = [
    // Write
    'function commitPlay(bytes32 commitHash, uint256 wagerAmount, uint8 tierMask, address operator) external payable returns (uint256 gameId)',
    'function revealPlay(uint256 gameId, uint256[] calldata guesses, bytes32 userSecret) external returns (uint256 prizeWon)',
    'function claimExpired(uint256 gameId) external',
    'function fundPrizePool(uint256 amount) external',

    // Read - Tiers
    'function getTierInfo(uint8 tier) view returns (uint256 range, uint256 multiplier, uint256 winChanceBps)',
    'function getAllTiers() view returns (uint256[3] ranges, uint256[3] multipliers, uint256[3] winChances)',
    'function TIER_COUNT() view returns (uint8)',

    // Read - Games
    'function getGame(uint256 gameId) view returns (address player, uint48 commitBlock, uint8 tierMask, uint8 status, address operator, uint96 wagerAmount)',
    'function getGameResult(uint256 gameId) view returns (address player, uint128 grossWager, uint128 prizeWon, uint8 tierMask, uint8 matchCount, uint48 revealBlock)',
    'function getGameStatus(uint256 gameId) view returns (uint8 status, bool canReveal, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)',

    // Read - Calculations
    'function calculatePotentialWinnings(uint256 wagerAmount, uint8 tierMask) view returns (uint256 netToPool, uint256 bkcFee, uint256 maxPrize, uint256 maxPrizeAfterCap)',
    'function getRequiredFee(uint8 tierMask) view returns (uint256 fee)',
    'function generateCommitHash(uint256[] calldata guesses, bytes32 userSecret) pure returns (bytes32)',

    // Read - Pool
    'function gameCounter() view returns (uint256)',
    'function prizePool() view returns (uint256)',
    'function getPoolStats() view returns (uint256 prizePool, uint256 totalGamesPlayed, uint256 totalBkcWagered, uint256 totalBkcWon, uint256 totalBkcForfeited, uint256 totalBkcBurned, uint256 maxPayoutNow)',

    // Constants
    'function REVEAL_DELAY() view returns (uint256)',
    'function REVEAL_WINDOW() view returns (uint256)',
    'function BKC_FEE_BPS() view returns (uint256)',
    'function MAX_PAYOUT_BPS() view returns (uint256)',

    // Events
    'event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint8 tierMask, address operator)',
    'event GameRevealed(uint256 indexed gameId, address indexed player, uint256 grossWager, uint256 prizeWon, uint8 tierMask, uint8 matchCount, address operator)',
    'event GameDetails(uint256 indexed gameId, uint8 tierMask, uint256[] guesses, uint256[] rolls, bool[] matches)',
    'event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)'
];

// Tier data (hardcoded in contract, cached here for validation)
const TIERS = [
    { range: 5,   multiplierBps: 20000 },  // Tier 0: 1-5, 2x
    { range: 15,  multiplierBps: 100000 }, // Tier 1: 1-15, 10x
    { range: 150, multiplierBps: 1000000 } // Tier 2: 1-150, 100x
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getFortuneContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.FORTUNE_POOL, FORTUNE_ABI, signer);
}

async function getFortuneContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.FORTUNE_POOL, FORTUNE_ABI, provider);
}

const PENDING_GAMES_KEY = 'fortune_pending_games';

function getPendingGames() {
    try { return JSON.parse(localStorage.getItem(PENDING_GAMES_KEY) || '{}'); }
    catch { return {}; }
}

function savePendingGame(gameId, data) {
    const games = getPendingGames();
    games[gameId] = { ...data, savedAt: Date.now() };
    localStorage.setItem(PENDING_GAMES_KEY, JSON.stringify(games));
}

function removePendingGame(gameId) {
    const games = getPendingGames();
    delete games[gameId];
    localStorage.setItem(PENDING_GAMES_KEY, JSON.stringify(games));
}

/**
 * V9: Uses abi.encode (NOT abi.encodePacked)
 */
function generateCommitmentHashLocal(guesses, userSecret) {
    const ethers = window.ethers;
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(
        ['uint256[]', 'bytes32'],
        [guesses.map(g => BigInt(g)), userSecret]
    );
    return ethers.keccak256(encoded);
}

function generateSecret() {
    const ethers = window.ethers;
    return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Count bits in tierMask
 */
function popcount(mask) {
    let count = 0;
    while (mask) { count += mask & 1; mask >>= 1; }
    return count;
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Phase 1: Commit to play a game
 * V9: tierMask (uint8) replaces isCumulative (bool)
 */
export async function commitPlay({
    commitmentHash,
    wagerAmount,
    tierMask,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const wager = BigInt(wagerAmount);
    const mask = Number(tierMask);

    if (mask < 1 || mask > 7) throw new Error('tierMask must be 1-7');

    let storedOperator = operator;
    let ethFee = 0n;

    // Calculate ETH fee client-side (sum fees for each selected tier)
    try {
        for (let i = 0; i < 3; i++) {
            if (mask & (1 << i)) {
                ethFee += await calculateFeeClientSide(ethers.id(`FORTUNE_TIER${i}`));
            }
        }
        console.log('[FortuneTx] ETH fee:', ethers.formatEther(ethFee));
    } catch (e) {
        console.error('[FortuneTx] Could not calculate ETH fee:', e.message);
        throw new Error('Could not calculate ETH fee');
    }

    return await txEngine.execute({
        name: 'CommitPlay',
        button,

        getContract: async (signer) => getFortuneContract(signer),
        method: 'commitPlay',
        args: () => [commitmentHash, wager, mask, resolveOperator(storedOperator)],

        value: ethFee,

        approval: {
            token: contracts.BKC_TOKEN,
            spender: contracts.FORTUNE_POOL,
            amount: wager
        },

        validate: async (signer, userAddress) => {
            if (wager <= 0n) throw new Error('Wager amount must be greater than 0');

            const { NetworkManager } = await import('../core/index.js');
            const ethBalance = await NetworkManager.getProvider().getBalance(userAddress);
            if (ethFee > 0n && ethBalance < ethFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient ETH for fee (${ethers.formatEther(ethFee)} ETH required)`);
            }
        },

        onSuccess: async (receipt) => {
            let gameId = null;
            try {
                const iface = new ethers.Interface(FORTUNE_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'GameCommitted') {
                            gameId = Number(parsed.args.gameId);
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess({ gameId, txHash: receipt.hash, commitBlock: receipt.blockNumber, player: receipt.from });
        },
        onError
    });
}

/**
 * Phase 2: Reveal guesses and complete the game
 */
export async function revealPlay({
    gameId,
    guesses,
    userSecret,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const guessesArray = guesses.map(g => BigInt(g));

    return await txEngine.execute({
        name: 'RevealPlay',
        button,
        skipSimulation: true, fixedGasLimit: 500000n,

        getContract: async (signer) => getFortuneContract(signer),
        method: 'revealPlay',
        args: [gameId, guessesArray, userSecret],

        validate: async (signer, userAddress) => {
            const readContract = await getFortuneContractReadOnly();
            const status = await readContract.getGameStatus(gameId);

            // Only block on fatal conditions — timing is handled by on-chain revert + auto-retry
            if (Number(status.status) === 3) throw new Error('Game has expired.');

            const game = await readContract.getGame(gameId);
            if (game.player.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You are not the owner of this game');
            }
        },

        onSuccess: async (receipt) => {
            let gameResult = null;
            let details = null;
            try {
                const iface = new ethers.Interface(FORTUNE_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'GameRevealed') {
                            gameResult = {
                                gameId: Number(parsed.args.gameId),
                                grossWager: parsed.args.grossWager,
                                prizeWon: parsed.args.prizeWon,
                                tierMask: Number(parsed.args.tierMask),
                                matchCount: Number(parsed.args.matchCount),
                                won: parsed.args.prizeWon > 0n
                            };
                        } else if (parsed.name === 'GameDetails') {
                            details = {
                                guesses: parsed.args.guesses.map(g => Number(g)),
                                rolls: parsed.args.rolls.map(r => Number(r)),
                                matches: [...parsed.args.matches]
                            };
                        }
                    } catch {}
                }
            } catch {}

            // Merge GameDetails into gameResult
            if (gameResult && details) {
                gameResult.rolls = details.rolls;
                gameResult.guesses = details.guesses;
                gameResult.matches = details.matches;
            }

            removePendingGame(gameId);
            if (onSuccess) onSuccess(receipt, gameResult);
        },
        onError
    });
}

/**
 * Helper: Play game with automatic secret generation
 * V9: Uses tierMask instead of isCumulative
 */
export async function playGame({
    wagerAmount,
    guess,
    guesses,
    tierMask = 1, // Default: tier 0 only
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const mask = Number(tierMask);
    if (mask < 1 || mask > 7) throw new Error('tierMask must be 1-7');

    const tierCount = popcount(mask);

    // Build guesses array
    let guessesArray = [];
    if (guesses && Array.isArray(guesses) && guesses.length > 0) {
        guessesArray = guesses.map(g => Number(g));
    } else if (guess !== undefined) {
        guessesArray = [Number(Array.isArray(guess) ? guess[0] : guess)];
    } else {
        throw new Error('Guess(es) required');
    }

    if (guessesArray.length !== tierCount) {
        throw new Error(`tierMask selects ${tierCount} tier(s) but ${guessesArray.length} guess(es) provided`);
    }

    // Validate guesses against tier ranges
    let guessIdx = 0;
    for (let i = 0; i < 3; i++) {
        if (mask & (1 << i)) {
            const maxRange = TIERS[i].range;
            if (guessesArray[guessIdx] < 1 || guessesArray[guessIdx] > maxRange) {
                throw new Error(`Tier ${i} guess must be between 1 and ${maxRange}`);
            }
            guessIdx++;
        }
    }

    const userSecret = generateSecret();
    const commitmentHash = generateCommitmentHashLocal(guessesArray, userSecret);

    return await commitPlay({
        commitmentHash,
        wagerAmount,
        tierMask: mask,
        operator,
        button,
        onSuccess: (result) => {
            savePendingGame(result.gameId, {
                guesses: guessesArray,
                userSecret,
                tierMask: mask,
                wagerAmount: wagerAmount.toString(),
                commitmentHash,
                player: result.player,
                commitTimestamp: Date.now()
            });
            if (onSuccess) onSuccess({ ...result, guesses: guessesArray, userSecret, tierMask: mask });
        },
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * Gets all 3 tiers
 * V9: Returns fixed [3] arrays (ranges, multipliers, winChances)
 */
export async function getActiveTiers() {
    const contract = await getFortuneContractReadOnly();

    try {
        const result = await contract.getAllTiers();
        const tiers = [];
        for (let i = 0; i < 3; i++) {
            tiers.push({
                tierId: i,
                maxRange: Number(result.ranges[i]),
                multiplierBps: Number(result.multipliers[i]),
                multiplier: Number(result.multipliers[i]) / 10000,
                winChanceBps: Number(result.winChances[i]),
                active: true
            });
        }
        return tiers;
    } catch {
        // Fallback to hardcoded
        return TIERS.map((t, i) => ({
            tierId: i,
            maxRange: t.range,
            multiplierBps: t.multiplierBps,
            multiplier: t.multiplierBps / 10000,
            active: true
        }));
    }
}

export async function getTierById(tierId) {
    const contract = await getFortuneContractReadOnly();
    try {
        const result = await contract.getTierInfo(tierId);
        return {
            tierId,
            maxRange: Number(result.range),
            multiplierBps: Number(result.multiplier),
            multiplier: Number(result.multiplier) / 10000,
            winChanceBps: Number(result.winChanceBps)
        };
    } catch { return null; }
}

/**
 * V9: getRequiredFee(tierMask) replaces getRequiredServiceFee(bool)
 */
export async function getServiceFee(tierMask = 1) {
    const ethers = window.ethers;
    const mask = Number(tierMask);
    try {
        let totalFee = 0n;
        for (let i = 0; i < 3; i++) {
            if (mask & (1 << i)) {
                totalFee += await calculateFeeClientSide(ethers.id(`FORTUNE_TIER${i}`));
            }
        }
        return totalFee;
    } catch {
        return 0n;
    }
}

export async function getPoolStats() {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();

    try {
        const stats = await contract.getPoolStats();
        return {
            prizePoolBalance: stats[0],
            prizePoolFormatted: ethers.formatEther(stats[0]),
            gameCounter: Number(stats[1]),
            totalWageredAllTime: stats[2],
            totalWageredFormatted: ethers.formatEther(stats[2]),
            totalPaidOutAllTime: stats[3],
            totalPaidOutFormatted: ethers.formatEther(stats[3]),
            totalForfeited: stats[4],
            totalBurned: stats[5],
            maxPayoutNow: stats[6],
            maxPayoutFormatted: ethers.formatEther(stats[6])
        };
    } catch {
        const [gameCounter, prizePool] = await Promise.all([
            contract.gameCounter().catch(() => 0n),
            contract.prizePool().catch(() => 0n)
        ]);
        return {
            gameCounter: Number(gameCounter),
            prizePoolBalance: prizePool,
            prizePoolFormatted: ethers.formatEther(prizePool)
        };
    }
}

export async function getActiveTierCount() {
    return 3; // V9: always 3 tiers
}

/**
 * V9: calculatePotentialWinnings(wager, tierMask) returns 4-tuple
 */
export async function calculatePotentialWin(wagerAmount, tierMask = 1) {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();

    try {
        const result = await contract.calculatePotentialWinnings(wagerAmount, Number(tierMask));
        return {
            netToPool: result.netToPool || result[0],
            bkcFee: result.bkcFee || result[1],
            maxPrize: result.maxPrize || result[2],
            maxPrizeFormatted: ethers.formatEther(result.maxPrize || result[2]),
            maxPrizeAfterCap: result.maxPrizeAfterCap || result[3],
            maxPrizeAfterCapFormatted: ethers.formatEther(result.maxPrizeAfterCap || result[3])
        };
    } catch {
        return { netToPool: 0n, bkcFee: 0n, maxPrize: 0n, maxPrizeAfterCap: 0n };
    }
}

export async function getGameResult(gameId) {
    const contract = await getFortuneContractReadOnly();
    try {
        const r = await contract.getGameResult(gameId);
        return {
            player: r.player,
            grossWager: r.grossWager,
            prizeWon: r.prizeWon,
            tierMask: Number(r.tierMask),
            matchCount: Number(r.matchCount),
            revealBlock: Number(r.revealBlock),
            won: r.prizeWon > 0n
        };
    } catch { return null; }
}

/**
 * V9: getGameStatus replaces getCommitmentStatus
 */
export async function getCommitmentStatus(gameId) {
    const contract = await getFortuneContractReadOnly();
    try {
        const s = await contract.getGameStatus(gameId);
        return {
            status: Number(s.status),
            statusName: ['NONE', 'COMMITTED', 'REVEALED', 'EXPIRED'][Number(s.status)] || 'UNKNOWN',
            canReveal: s.canReveal,
            isExpired: Number(s.status) === 3,
            blocksUntilReveal: Number(s.blocksUntilReveal),
            blocksUntilExpiry: Number(s.blocksUntilExpiry)
        };
    } catch { return null; }
}

export function getPendingGamesForReveal() { return getPendingGames(); }
export function getPendingGame(gameId) { return getPendingGames()[gameId] || null; }

export async function revealPendingGame(gameId, options = {}) {
    const pendingGame = getPendingGame(gameId);
    if (!pendingGame) throw new Error(`No pending game found with ID ${gameId}`);
    return await revealPlay({ gameId, guesses: pendingGame.guesses, userSecret: pendingGame.userSecret, ...options });
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const FortuneTx = {
    commitPlay, revealPlay, playGame,
    revealPendingGame, getPendingGamesForReveal, getPendingGame,
    generateCommitmentHashLocal, generateSecret,
    getActiveTiers, getTierById, getServiceFee,
    getPoolStats, getActiveTierCount,
    calculatePotentialWin, getGameResult, getCommitmentStatus,
    TIERS
};

export default FortuneTx;
