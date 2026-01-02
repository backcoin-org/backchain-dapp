// modules/js/transactions/fortune-tx.js
// ✅ PRODUCTION V1.1 - FIXED: Uses dynamic addresses from config.js
// 
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
// - Uses fortunePool or fortunePoolV2 from config (V2 takes priority)
// - Updated ABI to match FortunePoolV2 contract
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
 */
const FORTUNE_ABI = [
    // Write functions
    'function play(uint256 wagerAmount, uint8 guess) external payable',
    
    // Read functions
    'function activeTierCount() view returns (uint256)',
    'function prizeTiers(uint256 index) view returns (uint256 minWager, uint256 maxWager, uint8 maxNumber, uint16 multiplierBps, bool active)',
    'function getRequiredServiceFee(uint256 wagerAmount) view returns (uint256)',
    'function totalGamesPlayed() view returns (uint256)',
    'function totalWagered() view returns (uint256)',
    'function totalPaidOut() view returns (uint256)',
    
    // Events
    'event GamePlayed(address indexed player, uint256 indexed visibleGameId, uint256 wagerAmount, uint8 guess, uint8 winningNumber, uint256 payout, bool won)'
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
 * @param {Object} params - Game parameters
 * @param {string|bigint} params.wagerAmount - Wager amount in tokens (wei)
 * @param {number|number[]} params.guess - Guess number (1-100) or array with single guess
 * @param {number[]} [params.guesses] - Alternative: array of guesses (uses first one)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives game result)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result with game outcome
 * 
 * @example
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guess: 42,
 *     button: document.getElementById('playBtn'),
 *     onSuccess: (receipt, gameResult) => {
 *         if (gameResult.won) {
 *             showToast(`You won ${ethers.formatEther(gameResult.payout)} BKC!`);
 *         } else {
 *             showToast(`Winning number was ${gameResult.winningNumber}. Try again!`);
 *         }
 *     }
 * });
 */
export async function playGame({
    wagerAmount,
    guess,
    guesses, // Alternative parameter for backward compatibility
    isCumulative = false, // Kept for backward compatibility but not used in V2
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Support both 'guess' and 'guesses' parameters
    let playerGuess;
    if (guess !== undefined) {
        playerGuess = Array.isArray(guess) ? guess[0] : guess;
    } else if (guesses !== undefined && guesses.length > 0) {
        playerGuess = guesses[0];
    } else {
        throw new Error('Guess is required');
    }
    
    // Validate guess range
    if (playerGuess < 1 || playerGuess > 100) {
        throw new Error('Guess must be between 1 and 100');
    }

    const wager = BigInt(wagerAmount);
    let serviceFee = 0n;

    return await txEngine.execute({
        name: 'PlayGame',
        button,
        
        getContract: async (signer) => getFortuneContract(signer),
        method: 'play',
        args: [wager, playerGuess],
        
        // ETH value for service fee (set in validate)
        get value() { return serviceFee; },
        
        // Token approval config - using dynamic addresses
        approval: {
            token: contracts.BKC_TOKEN,
            spender: contracts.FORTUNE_POOL,
            amount: wager
        },
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getFortuneContract(signer);
            
            // Get service fee for this wager
            serviceFee = await contract.getRequiredServiceFee(wager);
            
            // Check user has enough ETH for service fee
            const provider = signer.provider;
            const ethBalance = await provider.getBalance(userAddress);
            
            if (ethBalance < serviceFee) {
                throw new Error(`Insufficient ETH for service fee (${ethers.formatEther(serviceFee)} ETH required)`);
            }
            
            // Validate wager is within tier limits
            const tierCount = await contract.activeTierCount();
            let validTier = false;
            
            for (let i = 0; i < tierCount; i++) {
                try {
                    const tier = await contract.prizeTiers(i);
                    if (tier.active && wager >= tier.minWager && wager <= tier.maxWager) {
                        validTier = true;
                        
                        // Validate guess against tier's maxNumber
                        if (playerGuess > tier.maxNumber) {
                            throw new Error(`Guess must be between 1 and ${tier.maxNumber} for this tier`);
                        }
                        break;
                    }
                } catch (e) {
                    if (e.message.includes('Guess must be')) throw e;
                }
            }
            
            if (!validTier) {
                throw new Error('Wager amount does not match any active tier');
            }
        },
        
        onSuccess: async (receipt) => {
            // Try to extract game result from event
            let gameResult = null;
            try {
                const iface = new ethers.Interface(FORTUNE_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'GamePlayed') {
                            gameResult = {
                                gameId: Number(parsed.args.visibleGameId),
                                wager: parsed.args.wagerAmount,
                                guess: Number(parsed.args.guess),
                                winningNumber: Number(parsed.args.winningNumber),
                                payout: parsed.args.payout,
                                won: parsed.args.won
                            };
                            break;
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
 * @returns {Promise<Array>} Array of tier objects
 */
export async function getActiveTiers() {
    const contract = await getFortuneContractReadOnly();
    
    const tierCount = await contract.activeTierCount();
    const tiers = [];
    
    for (let i = 0; i < tierCount; i++) {
        try {
            const tier = await contract.prizeTiers(i);
            if (tier.active) {
                tiers.push({
                    index: i,
                    minWager: tier.minWager,
                    maxWager: tier.maxWager,
                    maxNumber: Number(tier.maxNumber),
                    multiplierBps: Number(tier.multiplierBps),
                    multiplier: Number(tier.multiplierBps) / 100, // Convert bps to multiplier
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
 * Gets tier info for a specific wager amount
 * @param {string|bigint} wagerAmount - Wager amount in wei
 * @returns {Promise<Object|null>} Tier info or null if invalid
 */
export async function getTierForWager(wagerAmount) {
    const wager = BigInt(wagerAmount);
    const tiers = await getActiveTiers();
    
    for (const tier of tiers) {
        if (wager >= tier.minWager && wager <= tier.maxWager) {
            return tier;
        }
    }
    
    return null;
}

/**
 * Gets required service fee for a wager amount
 * @param {string|bigint} wagerAmount - Wager amount in wei
 * @returns {Promise<bigint>} Fee in wei
 */
export async function getServiceFee(wagerAmount = 0n) {
    const contract = await getFortuneContractReadOnly();
    return await contract.getRequiredServiceFee(wagerAmount);
}

/**
 * Gets pool statistics
 * @returns {Promise<Object>} Pool stats
 */
export async function getPoolStats() {
    const ethers = window.ethers;
    const contract = await getFortuneContractReadOnly();
    
    const [totalGames, totalWagered, totalPaidOut] = await Promise.all([
        contract.totalGamesPlayed(),
        contract.totalWagered(),
        contract.totalPaidOut()
    ]);
    
    return {
        totalGamesPlayed: Number(totalGames),
        totalWagered,
        totalPaidOut,
        totalWageredFormatted: ethers.formatEther(totalWagered),
        totalPaidOutFormatted: ethers.formatEther(totalPaidOut)
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
 * Calculates potential win amount
 * @param {string|bigint} wagerAmount - Wager amount
 * @returns {Promise<Object>} Potential win info
 */
export async function calculatePotentialWin(wagerAmount) {
    const ethers = window.ethers;
    const tier = await getTierForWager(wagerAmount);
    
    if (!tier) {
        return { potentialWin: 0n, multiplier: 0 };
    }
    
    const wager = BigInt(wagerAmount);
    const potentialWin = (wager * BigInt(tier.multiplierBps)) / 100n;
    
    return {
        potentialWin,
        potentialWinFormatted: ethers.formatEther(potentialWin),
        multiplier: tier.multiplier,
        tier
    };
}

// ============================================================================
// 5. EXPORT
// ============================================================================

export const FortuneTx = {
    playGame,
    // Read helpers
    getActiveTiers,
    getTierForWager,
    getServiceFee,
    getPoolStats,
    getActiveTierCount,
    calculatePotentialWin
};

export default FortuneTx;