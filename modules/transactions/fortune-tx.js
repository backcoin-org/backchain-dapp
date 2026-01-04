// modules/js/transactions/fortune-tx.js
// ✅ PRODUCTION V1.3 - FIXED: Correct contract ABI and play() signature
// 
// CHANGES V1.3:
// - Fixed play() signature: play(uint256, uint256[], bool) instead of play(uint256, uint8)
// - Fixed prizeTiers structure: (maxRange, multiplierBips, active) - 1-indexed
// - Fixed getRequiredServiceFee(bool) signature
// - Removed validation for minWager/maxWager (contract doesn't have these)
// - Updated event parsing for GamePlayed and GameDetails
//
// CHANGES V1.2:
// - Fixed getRequiredServiceFee signature
//
// CHANGES V1.1:
// - Imports addresses from config.js
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - playGame: Play the fortune guessing game
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 * Addresses are loaded from deployment-addresses.json at app init
 * 
 * @returns {Object} Contract addresses
 * @throws {Error} If addresses are not loaded
 */
function getContracts() {
    // FortunePool - V2 takes priority if available
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
 * Fortune Pool V2 ABI - matches actual deployed contract
 * 
 * V1.3 FIX: Correct play() signature
 * The actual contract function is:
 * play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative)
 */
const FORTUNE_ABI = [
    // Write functions - CORRECT SIGNATURE
    'function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable',
    
    // Read functions
    'function activeTierCount() view returns (uint256)',
    'function prizeTiers(uint256 tierId) view returns (uint128 maxRange, uint64 multiplierBips, bool active)',
    'function serviceFee() view returns (uint256)',
    'function getRequiredServiceFee(bool isCumulative) view returns (uint256)',
    'function gameCounter() view returns (uint256)',
    'function prizePoolBalance() view returns (uint256)',
    'function totalWageredAllTime() view returns (uint256)',
    'function totalPaidOutAllTime() view returns (uint256)',
    'function totalWinsAllTime() view returns (uint256)',
    'function gameResults(uint256 gameId) view returns (address player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount, uint256 timestamp)',
    
    // Events
    'event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)',
    'event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)',
    'event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)'
];

/**
 * BKC Token ABI - for approvals
 */
const BKC_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)'
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

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Plays the fortune guessing game
 * 
 * V1.3 FIX: Updated to match actual contract signature:
 * play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative)
 * 
 * @param {Object} params - Game parameters
 * @param {string|bigint} params.wagerAmount - Wager amount in tokens (wei)
 * @param {number|number[]} params.guess - Single guess for jackpot mode (1x)
 * @param {number[]} [params.guesses] - Array of guesses for cumulative mode (5x)
 * @param {boolean} [params.isCumulative=false] - false = 1x mode (jackpot), true = 5x mode
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives game result)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result with game outcome
 * 
 * @example
 * // Jackpot mode (1x) - single guess
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guess: 42,
 *     isCumulative: false
 * });
 * 
 * // Cumulative mode (5x) - multiple guesses
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guesses: [2, 5, 50],  // One guess per tier
 *     isCumulative: true
 * });
 */
export async function playGame({
    wagerAmount,
    guess,
    guesses,
    isCumulative = false,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Build guesses array based on mode
    let guessesArray = [];
    
    if (isCumulative) {
        // Cumulative mode (5x): needs array of guesses
        if (guesses && Array.isArray(guesses) && guesses.length > 0) {
            guessesArray = guesses.map(g => BigInt(g));
        } else if (guess !== undefined) {
            // Fallback: if single guess provided, use it (but might fail if tier count > 1)
            guessesArray = [BigInt(Array.isArray(guess) ? guess[0] : guess)];
        } else {
            throw new Error('Guesses array is required for cumulative mode');
        }
    } else {
        // Jackpot mode (1x): needs exactly 1 guess
        let singleGuess;
        if (guess !== undefined) {
            singleGuess = Array.isArray(guess) ? guess[0] : guess;
        } else if (guesses && guesses.length > 0) {
            singleGuess = guesses[guesses.length - 1]; // Use last guess (highest tier)
        } else {
            throw new Error('Guess is required');
        }
        guessesArray = [BigInt(singleGuess)];
    }

    const wager = BigInt(wagerAmount);
    let serviceFee = 0n;

    return await txEngine.execute({
        name: 'PlayGame',
        button,
        
        getContract: async (signer) => getFortuneContract(signer),
        method: 'play',
        // V1.3: Correct args - [wagerAmount, guesses[], isCumulative]
        args: [wager, guessesArray, isCumulative],
        
        // ETH value for service fee (set in validate)
        get value() { return serviceFee; },
        
        // Token approval config
        approval: {
            token: contracts.BKC_TOKEN,
            spender: contracts.FORTUNE_POOL,
            amount: wager
        },
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getFortuneContract(signer);
            
            // Get service fee
            try {
                serviceFee = await contract.getRequiredServiceFee(isCumulative);
            } catch (e) {
                try {
                    serviceFee = await contract.serviceFee();
                    if (isCumulative) {
                        serviceFee = serviceFee * 5n; // 5x multiplier for cumulative
                    }
                } catch (e2) {
                    console.warn('[FortuneTx] Could not fetch service fee, using 0');
                    serviceFee = 0n;
                }
            }
            
            // Check user has enough ETH for service fee
            const provider = signer.provider;
            const ethBalance = await provider.getBalance(userAddress);
            
            if (serviceFee > 0n && ethBalance < serviceFee) {
                throw new Error(`Insufficient ETH for service fee (${ethers.formatEther(serviceFee)} ETH required)`);
            }
            
            // V1.3: Validate guesses based on mode and tier configuration
            const tierCount = Number(await contract.activeTierCount());
            
            if (tierCount === 0) {
                throw new Error('No active tiers available');
            }
            
            if (isCumulative) {
                // Cumulative mode: need one guess per tier
                if (guessesArray.length !== tierCount) {
                    throw new Error(`Cumulative mode requires ${tierCount} guesses (one per tier), got ${guessesArray.length}`);
                }
                
                // Validate each guess against its tier's range
                for (let i = 0; i < tierCount; i++) {
                    const tier = await contract.prizeTiers(i + 1); // Tiers are 1-indexed
                    const maxRange = Number(tier.maxRange);
                    const guessNum = Number(guessesArray[i]);
                    
                    if (guessNum < 1 || guessNum > maxRange) {
                        throw new Error(`Tier ${i + 1} guess must be between 1 and ${maxRange}`);
                    }
                }
            } else {
                // Jackpot mode: need exactly 1 guess for the highest tier
                if (guessesArray.length !== 1) {
                    throw new Error('Jackpot mode requires exactly 1 guess');
                }
                
                // Validate against jackpot tier (highest tier = tierCount)
                const jackpotTier = await contract.prizeTiers(tierCount);
                const maxRange = Number(jackpotTier.maxRange);
                const guessNum = Number(guessesArray[0]);
                
                if (guessNum < 1 || guessNum > maxRange) {
                    throw new Error(`Jackpot guess must be between 1 and ${maxRange}`);
                }
            }
            
            // Validate wager amount > 0
            if (wager <= 0n) {
                throw new Error('Wager amount must be greater than 0');
            }
        },
        
        onSuccess: async (receipt) => {
            // Extract game result from events
            let gameResult = null;
            try {
                const iface = new ethers.Interface(FORTUNE_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'GamePlayed') {
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
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, gameResult);
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
 * V1.3 FIX: Updated to use correct prizeTiers structure (1-indexed)
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
                    multiplier: Number(tier.multiplierBips) / 10000, // Convert bips to multiplier
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

/**
 * Gets active tier count
 * @returns {Promise<number>} Number of active tiers
 */
export async function getActiveTierCount() {
    const contract = await getFortuneContractReadOnly();
    return Number(await contract.activeTierCount());
}

/**
 * Calculates potential win amount for a specific tier
 * @param {string|bigint} wagerAmount - Wager amount
 * @param {number} tierId - Tier ID (1-indexed)
 * @returns {Promise<Object>} Potential win info
 */
export async function calculatePotentialWin(wagerAmount, tierId = null) {
    const ethers = window.ethers;
    
    // If no tierId specified, use jackpot tier (highest)
    if (tierId === null) {
        tierId = await getActiveTierCount();
    }
    
    const tier = await getTierById(tierId);
    
    if (!tier) {
        return { potentialWin: 0n, multiplier: 0 };
    }
    
    const wager = BigInt(wagerAmount);
    const potentialWin = (wager * BigInt(tier.multiplierBips)) / 10000n;
    
    return {
        potentialWin,
        potentialWinFormatted: ethers.formatEther(potentialWin),
        multiplier: tier.multiplier,
        maxRange: tier.maxRange,
        tier
    };
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
        const result = await contract.gameResults(gameId);
        return {
            player: result.player,
            wagerAmount: result.wagerAmount,
            prizeWon: result.prizeWon,
            isCumulative: result.isCumulative,
            matchCount: Number(result.matchCount),
            timestamp: Number(result.timestamp),
            won: result.prizeWon > 0n
        };
    } catch {
        return null;
    }
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const FortuneTx = {
    playGame,
    // Read helpers
    getActiveTiers,
    getTierById,
    getServiceFee,
    getPoolStats,
    getActiveTierCount,
    calculatePotentialWin,
    getGameResult
};

export default FortuneTx;