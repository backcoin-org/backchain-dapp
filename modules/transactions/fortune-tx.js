// modules/js/transactions/fortune-tx.js
// ✅ PRODUCTION V2.0 - Updated for FortunePool V6 (Commit-Reveal + Operator)
// 
// CHANGES V2.0:
// - Updated to match FortunePool V6 contract (commit-reveal pattern)
// - Added operator parameter to commitPlay
// - Added helper functions for commitment hash generation
// - Added localStorage management for pending reveals
// - Backward compatible playGame() helper that does commit + stores secret
//
// ============================================================================
// GAME FLOW (2 PHASES):
//
// 1. COMMIT: User submits hash(guesses + secret) + wager + operator
//    → Receives gameId
//    → Must wait 5 blocks
//
// 2. REVEAL: User reveals guesses + secret
//    → Contract verifies hash matches
//    → Uses future blockhash as entropy
//    → Prize paid if won
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - commitPlay: Phase 1 - Submit commitment
// - revealPlay: Phase 2 - Reveal and complete game
// - playGame: Helper that does commitPlay + stores secret for later reveal
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    // FortunePool V6 - check for V2 address first for compatibility
    const fortunePool = addresses?.fortunePoolV2 || 
                        addresses?.fortunePool ||
                        contractAddresses?.fortunePoolV2 ||
                        contractAddresses?.fortunePool ||
                        window.contractAddresses?.fortunePoolV2 ||
                        window.contractAddresses?.fortunePool;
    
    const bkcToken = addresses?.bkcToken || 
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!fortunePool) {
        console.error('❌ FortunePool address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    if (!bkcToken) {
        console.error('❌ BKC Token address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        BKC_TOKEN: bkcToken,
        FORTUNE_POOL: fortunePool
    };
}

/**
 * FortunePool V6 ABI - Commit-Reveal pattern with Operator support
 */
const FORTUNE_ABI = [
    // ─────────────────────────────────────────────────────────────────────────
    // WRITE FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    // Phase 1: Commit
    'function commitPlay(bytes32 _commitmentHash, uint256 _wagerAmount, bool _isCumulative, address _operator) external payable returns (uint256 gameId)',
    
    // Phase 2: Reveal
    'function revealPlay(uint256 _gameId, uint256[] calldata _guesses, bytes32 _userSecret) external returns (uint256 prizeWon)',
    
    // Helper
    'function generateCommitmentHash(uint256[] calldata _guesses, bytes32 _userSecret) external pure returns (bytes32 hash)',
    
    // Claim expired (anyone can call)
    'function claimExpiredGame(uint256 _gameId) external',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    // Tiers
    'function activeTierCount() view returns (uint256)',
    'function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)',
    'function getAllTiers() view returns (uint128[] ranges, uint64[] multipliers)',
    
    // Fees
    'function serviceFee() view returns (uint256)',
    'function getRequiredServiceFee(bool _isCumulative) view returns (uint256)',
    'function gameFeeBips() view returns (uint256)',
    
    // Game state
    'function gameCounter() view returns (uint256)',
    'function prizePoolBalance() view returns (uint256)',
    'function revealDelay() view returns (uint256)',
    'function revealWindow() view returns (uint256)',
    
    // Commitment queries
    'function getCommitment(uint256 _gameId) view returns (address player, uint64 commitBlock, bool isCumulative, uint8 status, uint256 wagerAmount, uint256 ethPaid)',
    'function getCommitmentStatus(uint256 _gameId) view returns (uint8 status, bool canReveal, bool isExpired, uint256 blocksUntilReveal, uint256 blocksUntilExpiry)',
    'function commitmentHashes(uint256 _gameId) view returns (bytes32)',
    'function commitmentOperators(uint256 _gameId) view returns (address)',
    
    // Game results
    'function getGameResult(uint256 _gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, uint256[] guesses, uint256[] rolls, bool isCumulative, uint8 matchCount, uint256 timestamp)',
    
    // Statistics
    'function totalWageredAllTime() view returns (uint256)',
    'function totalPaidOutAllTime() view returns (uint256)',
    'function totalWinsAllTime() view returns (uint256)',
    'function totalETHCollected() view returns (uint256)',
    'function totalBKCFees() view returns (uint256)',
    'function totalExpiredGames() view returns (uint256)',
    'function getPoolStats() view returns (uint256 poolBalance, uint256 gamesPlayed, uint256 wageredAllTime, uint256 paidOutAllTime, uint256 winsAllTime, uint256 ethCollected, uint256 bkcFees, uint256 expiredGames)',
    
    // Calculations
    'function calculatePotentialWinnings(uint256 _wagerAmount, bool _isCumulative) view returns (uint256 maxPrize, uint256 netWager)',
    'function getExpectedGuessCount(bool _isCumulative) view returns (uint256)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────
    
    'event GameCommitted(uint256 indexed gameId, address indexed player, uint256 wagerAmount, bool isCumulative, address operator)',
    'event GameRevealed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, address operator)',
    'event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)',
    'event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)',
    'event GameExpired(uint256 indexed gameId, address indexed player, uint256 forfeitedAmount)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Fortune Pool contract instance
 */
function getFortuneContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.FORTUNE_POOL, FORTUNE_ABI, signer);
}

/**
 * Creates Fortune Pool contract instance with provider (read-only)
 */
async function getFortuneContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.FORTUNE_POOL, FORTUNE_ABI, provider);
}

/**
 * Storage key for pending games
 */
const PENDING_GAMES_KEY = 'fortune_pending_games';

/**
 * Get pending games from localStorage
 */
function getPendingGames() {
    try {
        return JSON.parse(localStorage.getItem(PENDING_GAMES_KEY) || '{}');
    } catch {
        return {};
    }
}

/**
 * Save pending game to localStorage
 */
function savePendingGame(gameId, data) {
    const games = getPendingGames();
    games[gameId] = {
        ...data,
        savedAt: Date.now()
    };
    localStorage.setItem(PENDING_GAMES_KEY, JSON.stringify(games));
}

/**
 * Remove pending game from localStorage
 */
function removePendingGame(gameId) {
    const games = getPendingGames();
    delete games[gameId];
    localStorage.setItem(PENDING_GAMES_KEY, JSON.stringify(games));
}

/**
 * Generate commitment hash (client-side)
 * @param {number[]} guesses - Array of guesses
 * @param {string} userSecret - bytes32 secret
 * @returns {string} Commitment hash
 */
function generateCommitmentHashLocal(guesses, userSecret) {
    const ethers = window.ethers;
    const encoded = ethers.solidityPacked(
        ['uint256[]', 'bytes32'],
        [guesses.map(g => BigInt(g)), userSecret]
    );
    return ethers.keccak256(encoded);
}

/**
 * Generate random secret
 * @returns {string} Random bytes32
 */
function generateSecret() {
    const ethers = window.ethers;
    return ethers.hexlify(ethers.randomBytes(32));
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Phase 1: Commit to play a game
 * 
 * @param {Object} params - Commit parameters
 * @param {string} params.commitmentHash - keccak256(abi.encodePacked(guesses, userSecret))
 * @param {string|bigint} params.wagerAmount - Wager amount in BKC (wei)
 * @param {boolean} [params.isCumulative=false] - false = 1x mode, true = 5x mode
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives { gameId, txHash })
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result with gameId
 */
export async function commitPlay({
    commitmentHash,
    wagerAmount,
    isCumulative = false,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    const wager = BigInt(wagerAmount);
    
    // Store for closure
    let storedHash = commitmentHash;
    let storedCumulative = isCumulative;
    let storedOperator = operator;
    
    // Pre-fetch service fee
    let serviceFee = 0n;
    try {
        const readContract = await getFortuneContractReadOnly();
        serviceFee = await readContract.getRequiredServiceFee(isCumulative);
        console.log('[FortuneTx] Service fee:', ethers.formatEther(serviceFee), 'ETH');
    } catch (e) {
        console.error('[FortuneTx] Could not fetch service fee:', e.message);
        throw new Error('Could not fetch service fee from contract');
    }

    return await txEngine.execute({
        name: 'CommitPlay',
        button,
        
        getContract: async (signer) => getFortuneContract(signer),
        method: 'commitPlay',
        args: () => [storedHash, wager, storedCumulative, resolveOperator(storedOperator)],
        
        // ETH for service fee
        value: serviceFee,
        
        // BKC approval for wager
        approval: {
            token: contracts.BKC_TOKEN,
            spender: contracts.FORTUNE_POOL,
            amount: wager
        },
        
        // Validation
        validate: async (signer, userAddress) => {
            const { NetworkManager } = await import('../core/index.js');
            const readProvider = NetworkManager.getProvider();
            const readContract = await getFortuneContractReadOnly();
            
            // Check ETH balance for service fee
            const ethBalance = await readProvider.getBalance(userAddress);
            if (serviceFee > 0n && ethBalance < serviceFee) {
                throw new Error(`Insufficient ETH for service fee (${ethers.formatEther(serviceFee)} ETH required)`);
            }
            
            // Check active tiers
            const tierCount = Number(await readContract.activeTierCount());
            if (tierCount === 0) {
                throw new Error('No active tiers available');
            }
            
            // Check wager > 0
            if (wager <= 0n) {
                throw new Error('Wager amount must be greater than 0');
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

            if (onSuccess) {
                onSuccess({ gameId, txHash: receipt.hash });
            }
        },
        onError
    });
}

/**
 * Phase 2: Reveal guesses and complete the game
 * 
 * @param {Object} params - Reveal parameters
 * @param {number} params.gameId - Game ID from commitPlay
 * @param {number[]} params.guesses - Array of guesses (must match commitment)
 * @param {string} params.userSecret - Secret used in commitment (bytes32)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives game result)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result with game outcome
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
    
    // Convert guesses to bigint array
    const guessesArray = guesses.map(g => BigInt(g));

    return await txEngine.execute({
        name: 'RevealPlay',
        button,
        
        getContract: async (signer) => getFortuneContract(signer),
        method: 'revealPlay',
        args: [gameId, guessesArray, userSecret],
        
        // Validation
        validate: async (signer, userAddress) => {
            const readContract = await getFortuneContractReadOnly();

            // Check commitment status (may fail if RPC is lagging)
            let status;
            try {
                status = await readContract.getCommitmentStatus(gameId);
            } catch (e) {
                throw new Error('Game not ready yet — please wait a few more seconds and try again.');
            }

            if (status.isExpired) {
                throw new Error('Game has expired. You can no longer reveal.');
            }

            if (!status.canReveal) {
                if (status.blocksUntilReveal > 0) {
                    throw new Error(`Must wait ${status.blocksUntilReveal} more blocks before reveal`);
                }
                throw new Error('Cannot reveal this game');
            }
            
            // Verify hash matches
            const commitment = await readContract.getCommitment(gameId);
            if (commitment.player.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('You are not the owner of this game');
            }
            
            // Verify hash
            const expectedHash = await readContract.commitmentHashes(gameId);
            const calculatedHash = generateCommitmentHashLocal(guesses, userSecret);
            
            if (expectedHash.toLowerCase() !== calculatedHash.toLowerCase()) {
                throw new Error('Hash mismatch - guesses or secret do not match commitment');
            }
        },
        
        onSuccess: async (receipt) => {
            let gameResult = null;
            try {
                const iface = new ethers.Interface(FORTUNE_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'GameRevealed') {
                            gameResult = {
                                gameId: Number(parsed.args.gameId),
                                wagerAmount: parsed.args.wagerAmount,
                                prizeWon: parsed.args.prizeWon,
                                isCumulative: parsed.args.isCumulative,
                                matchCount: Number(parsed.args.matchCount),
                                won: parsed.args.prizeWon > 0n
                            };
                        }
                        if (parsed.name === 'GameDetails' && gameResult) {
                            gameResult.guesses = parsed.args.guesses.map(g => Number(g));
                            gameResult.rolls = parsed.args.rolls.map(r => Number(r));
                            gameResult.matches = parsed.args.matches;
                        }
                        if (parsed.name === 'JackpotWon') {
                            if (gameResult) {
                                gameResult.jackpot = true;
                                gameResult.jackpotTier = Number(parsed.args.tier);
                            }
                        }
                    } catch {}
                }
            } catch {}

            // Remove from pending games
            removePendingGame(gameId);

            if (onSuccess) {
                onSuccess(receipt, gameResult);
            }
        },
        onError
    });
}

/**
 * Helper: Play game with automatic secret generation
 * 
 * This is a convenience function that:
 * 1. Generates a random secret
 * 2. Creates the commitment hash
 * 3. Calls commitPlay
 * 4. Stores the guesses + secret in localStorage for later reveal
 * 
 * @param {Object} params - Game parameters
 * @param {string|bigint} params.wagerAmount - Wager amount in BKC (wei)
 * @param {number|number[]} params.guess - Single guess for jackpot mode (1x)
 * @param {number[]} [params.guesses] - Array of guesses for cumulative mode (5x)
 * @param {boolean} [params.isCumulative=false] - false = 1x mode, true = 5x mode
 * @param {string} [params.operator] - Operator address (optional)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives { gameId, guesses, userSecret })
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 * 
 * @example
 * // Jackpot mode (1x) - single guess
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guess: 42,
 *     isCumulative: false
 * });
 * // Later: call revealPlay with result.gameId, result.guesses, result.userSecret
 * 
 * // Cumulative mode (5x) - multiple guesses
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guesses: [2, 5, 23, 50, 100],  // One guess per tier
 *     isCumulative: true
 * });
 */
export async function playGame({
    wagerAmount,
    guess,
    guesses,
    isCumulative = false,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Build guesses array based on mode
    let guessesArray = [];
    
    if (isCumulative) {
        // Cumulative mode (5x): needs array of guesses
        if (guesses && Array.isArray(guesses) && guesses.length > 0) {
            guessesArray = guesses.map(g => Number(g));
        } else if (guess !== undefined) {
            // Fallback
            guessesArray = [Number(Array.isArray(guess) ? guess[0] : guess)];
        } else {
            throw new Error('Guesses array is required for cumulative mode');
        }
    } else {
        // Jackpot mode (1x): needs exactly 1 guess
        let singleGuess;
        if (guess !== undefined) {
            singleGuess = Array.isArray(guess) ? guess[0] : guess;
        } else if (guesses && guesses.length > 0) {
            singleGuess = guesses[guesses.length - 1];
        } else {
            throw new Error('Guess is required');
        }
        guessesArray = [Number(singleGuess)];
    }
    
    // Validate guesses BEFORE commit
    const readContract = await getFortuneContractReadOnly();
    const tierCount = Number(await readContract.activeTierCount());
    
    if (tierCount === 0) {
        throw new Error('No active tiers available');
    }
    
    if (isCumulative) {
        if (guessesArray.length !== tierCount) {
            throw new Error(`Cumulative mode requires ${tierCount} guesses (one per tier), got ${guessesArray.length}`);
        }
        
        for (let i = 0; i < tierCount; i++) {
            const tier = await readContract.prizeTiers(i + 1);
            const maxRange = Number(tier.maxRange);
            
            if (guessesArray[i] < 1 || guessesArray[i] > maxRange) {
                throw new Error(`Tier ${i + 1} guess must be between 1 and ${maxRange}`);
            }
        }
    } else {
        if (guessesArray.length !== 1) {
            throw new Error('Jackpot mode requires exactly 1 guess');
        }
        
        const jackpotTier = await readContract.prizeTiers(tierCount);
        const maxRange = Number(jackpotTier.maxRange);
        
        if (guessesArray[0] < 1 || guessesArray[0] > maxRange) {
            throw new Error(`Jackpot guess must be between 1 and ${maxRange}`);
        }
    }
    
    // Generate secret and commitment hash
    const userSecret = generateSecret();
    const commitmentHash = generateCommitmentHashLocal(guessesArray, userSecret);
    
    console.log('[FortuneTx] Generated commitment:', {
        guesses: guessesArray,
        userSecret: userSecret.slice(0, 10) + '...',
        commitmentHash: commitmentHash.slice(0, 10) + '...'
    });
    
    // Call commitPlay
    return await commitPlay({
        commitmentHash,
        wagerAmount,
        isCumulative,
        operator,
        button,
        onSuccess: (result) => {
            // Store for later reveal
            savePendingGame(result.gameId, {
                guesses: guessesArray,
                userSecret,
                isCumulative,
                wagerAmount: wagerAmount.toString(),
                commitmentHash
            });
            
            console.log('[FortuneTx] Game committed, stored for reveal:', result.gameId);
            
            if (onSuccess) {
                onSuccess({
                    ...result,
                    guesses: guessesArray,
                    userSecret,
                    isCumulative
                });
            }
        },
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets all active tiers
 * @returns {Promise<Array>} Array of tier objects
 */
export async function getActiveTiers() {
    const contract = await getFortuneContractReadOnly();
    
    const tierCount = Number(await contract.activeTierCount());
    const tiers = [];
    
    // Tiers are 1-indexed in the contract
    for (let i = 1; i <= tierCount; i++) {
        try {
            const tier = await contract.prizeTiers(i);
            if (tier.active) {
                tiers.push({
                    tierId: i,
                    maxRange: Number(tier.maxRange),
                    multiplierBips: Number(tier.multiplierBips),
                    multiplier: Number(tier.multiplierBips) / 10000,
                    active: tier.active
                });
            }
        } catch {
            break;
        }
    }
    
    return tiers;
}

/**
 * Gets tier by ID
 * @param {number} tierId - Tier ID (1-indexed)
 * @returns {Promise<Object|null>} Tier info or null
 */
export async function getTierById(tierId) {
    const contract = await getFortuneContractReadOnly();
    
    try {
        const tier = await contract.prizeTiers(tierId);
        if (tier.active) {
            return {
                tierId,
                maxRange: Number(tier.maxRange),
                multiplierBips: Number(tier.multiplierBips),
                multiplier: Number(tier.multiplierBips) / 10000,
                active: tier.active
            };
        }
    } catch {}
    
    return null;
}

/**
 * Gets required service fee
 * @param {boolean} isCumulative - Whether it's a cumulative (combo) game
 * @returns {Promise<bigint>} Fee in wei
 */
export async function getServiceFee(isCumulative = false) {
    const contract = await getFortuneContractReadOnly();
    
    try {
        return await contract.getRequiredServiceFee(isCumulative);
    } catch (e) {
        try {
            const baseFee = await contract.serviceFee();
            return isCumulative ? baseFee * 5n : baseFee;
        } catch (e2) {
            console.warn('[FortuneTx] Could not fetch service fee');
            return 0n;
        }
    }
}

/**
 * Gets pool statistics
 * @returns {Promise<Object>} Pool stats
 */
export async function getPoolStats() {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();
    
    try {
        const stats = await contract.getPoolStats();
        return {
            prizePoolBalance: stats.poolBalance,
            prizePoolFormatted: ethers.formatEther(stats.poolBalance),
            gameCounter: Number(stats.gamesPlayed),
            totalWageredAllTime: stats.wageredAllTime,
            totalWageredFormatted: ethers.formatEther(stats.wageredAllTime),
            totalPaidOutAllTime: stats.paidOutAllTime,
            totalPaidOutFormatted: ethers.formatEther(stats.paidOutAllTime),
            totalWinsAllTime: Number(stats.winsAllTime),
            totalETHCollected: stats.ethCollected,
            totalBKCFees: stats.bkcFees,
            totalExpiredGames: Number(stats.expiredGames)
        };
    } catch {
        // Fallback to individual calls
        const [gameCounter, prizePool, totalWagered, totalPaidOut, totalWins] = await Promise.all([
            contract.gameCounter().catch(() => 0n),
            contract.prizePoolBalance().catch(() => 0n),
            contract.totalWageredAllTime().catch(() => 0n),
            contract.totalPaidOutAllTime().catch(() => 0n),
            contract.totalWinsAllTime().catch(() => 0n)
        ]);
        
        return {
            gameCounter: Number(gameCounter),
            prizePoolBalance: prizePool,
            prizePoolFormatted: ethers.formatEther(prizePool),
            totalWageredAllTime: totalWagered,
            totalWageredFormatted: ethers.formatEther(totalWagered),
            totalPaidOutAllTime: totalPaidOut,
            totalPaidOutFormatted: ethers.formatEther(totalPaidOut),
            totalWinsAllTime: Number(totalWins)
        };
    }
}

/**
 * Gets active tier count
 * @returns {Promise<number>} Number of active tiers
 */
export async function getActiveTierCount() {
    const contract = await getFortuneContractReadOnly();
    return Number(await contract.activeTierCount());
}

/**
 * Calculates potential win amount
 * @param {string|bigint} wagerAmount - Wager amount
 * @param {boolean} isCumulative - Whether cumulative mode
 * @returns {Promise<Object>} Potential win info
 */
export async function calculatePotentialWin(wagerAmount, isCumulative = false) {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();
    
    try {
        const result = await contract.calculatePotentialWinnings(wagerAmount, isCumulative);
        return {
            maxPrize: result.maxPrize,
            maxPrizeFormatted: ethers.formatEther(result.maxPrize),
            netWager: result.netWager,
            netWagerFormatted: ethers.formatEther(result.netWager)
        };
    } catch {
        return { maxPrize: 0n, netWager: 0n };
    }
}

/**
 * Gets game result by ID
 * @param {number} gameId - Game ID
 * @returns {Promise<Object|null>} Game result or null
 */
export async function getGameResult(gameId) {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();
    
    try {
        const result = await contract.getGameResult(gameId);
        return {
            player: result.player,
            wagerAmount: result.wagerAmount,
            prizeWon: result.prizeWon,
            guesses: result.guesses.map(g => Number(g)),
            rolls: result.rolls.map(r => Number(r)),
            isCumulative: result.isCumulative,
            matchCount: Number(result.matchCount),
            timestamp: Number(result.timestamp),
            won: result.prizeWon > 0n
        };
    } catch {
        return null;
    }
}

/**
 * Gets commitment status
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Commitment status
 */
export async function getCommitmentStatus(gameId) {
    const contract = await getFortuneContractReadOnly();
    
    try {
        const status = await contract.getCommitmentStatus(gameId);
        return {
            status: Number(status.status),
            statusName: ['NONE', 'COMMITTED', 'REVEALED', 'EXPIRED'][Number(status.status)] || 'UNKNOWN',
            canReveal: status.canReveal,
            isExpired: status.isExpired,
            blocksUntilReveal: Number(status.blocksUntilReveal),
            blocksUntilExpiry: Number(status.blocksUntilExpiry)
        };
    } catch {
        return null;
    }
}

/**
 * Gets pending games from localStorage
 * @returns {Object} Pending games keyed by gameId
 */
export function getPendingGamesForReveal() {
    return getPendingGames();
}

/**
 * Gets a specific pending game
 * @param {number} gameId - Game ID
 * @returns {Object|null} Pending game data or null
 */
export function getPendingGame(gameId) {
    const games = getPendingGames();
    return games[gameId] || null;
}

/**
 * Reveal a pending game from localStorage
 * @param {number} gameId - Game ID
 * @param {Object} options - Additional options (button, onSuccess, onError)
 */
export async function revealPendingGame(gameId, options = {}) {
    const pendingGame = getPendingGame(gameId);
    
    if (!pendingGame) {
        throw new Error(`No pending game found with ID ${gameId}`);
    }
    
    return await revealPlay({
        gameId,
        guesses: pendingGame.guesses,
        userSecret: pendingGame.userSecret,
        ...options
    });
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const FortuneTx = {
    // Phase 1: Commit
    commitPlay,
    
    // Phase 2: Reveal
    revealPlay,
    
    // Convenience (commit + store)
    playGame,
    
    // Reveal from localStorage
    revealPendingGame,
    getPendingGamesForReveal,
    getPendingGame,
    
    // Helpers
    generateCommitmentHashLocal,
    generateSecret,
    
    // Read helpers
    getActiveTiers,
    getTierById,
    getServiceFee,
    getPoolStats,
    getActiveTierCount,
    calculatePotentialWin,
    getGameResult,
    getCommitmentStatus
};

export default FortuneTx;