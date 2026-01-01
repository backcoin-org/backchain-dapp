// modules/js/transactions/fortune-tx.js
// ✅ PRODUCTION V1.0 - Fortune Pool Transaction Handlers
// 
// This module provides transaction functions for the FortunePool contract.
// Supports playing the guessing game with different tiers.
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - playGame: Play the fortune guessing game
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Contract addresses
 */
const CONTRACTS = {
    BKC_TOKEN: window.ENV?.BKC_TOKEN_ADDRESS || '0x5c6d3a63F8A41F4dB91EBA04eA9B39AC2a6d8d79',
    FORTUNE_POOL: window.ENV?.FORTUNE_POOL_ADDRESS || '0xYourFortunePoolAddress'
};

/**
 * Fortune Pool ABI
 */
const FORTUNE_ABI = [
    // Write functions
    'function playGame(uint256 wagerAmount, uint256[] guesses, bool isCumulative) external payable',
    
    // Read functions
    'function getActiveTiers() view returns (tuple(uint256 minWager, uint256 maxWager, uint256 maxNumber, uint256 guessCount, uint256 multiplier, bool active)[])',
    'function getTierForWager(uint256 wagerAmount) view returns (uint256 tierIndex, uint256 minWager, uint256 maxWager, uint256 maxNumber, uint256 guessCount, uint256 multiplier)',
    'function serviceFee() view returns (uint256)',
    'function calculatePotentialWin(uint256 wagerAmount, bool isCumulative) view returns (uint256)',
    'function getUserGameHistory(address user) view returns (tuple(uint256 wager, uint256[] guesses, uint256 winningNumber, uint256 payout, uint256 timestamp, bool won)[])',
    'function lastWinningNumber() view returns (uint256)',
    
    // Events
    'event GamePlayed(address indexed player, uint256 wager, uint256[] guesses, uint256 winningNumber, uint256 payout, bool won)'
];

/**
 * BKC Token ABI
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
    return new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, signer);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Plays the fortune guessing game
 * 
 * @param {Object} params - Game parameters
 * @param {string|bigint} params.wagerAmount - Wager amount in tokens (wei)
 * @param {number[]} params.guesses - Array of guess numbers
 * @param {boolean} [params.isCumulative=false] - If true, payout multiplies per correct guess
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives game result)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result with game outcome
 * 
 * @example
 * const result = await FortuneTx.playGame({
 *     wagerAmount: ethers.parseEther('10'),
 *     guesses: [7, 13, 21],
 *     isCumulative: false,
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
    guesses,
    isCumulative = false,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validate inputs
    ValidationLayer.fortune.validatePlay({ wagerAmount, guesses, isCumulative });

    const wager = BigInt(wagerAmount);
    let serviceFee = 0n;

    return await txEngine.execute({
        name: 'PlayGame',
        button,
        
        getContract: async (signer) => getFortuneContract(signer),
        method: 'playGame',
        args: [wager, guesses, isCumulative],
        
        // ETH value for service fee (set in validate)
        get value() { return serviceFee; },
        
        // Token approval config
        approval: {
            token: CONTRACTS.BKC_TOKEN,
            spender: CONTRACTS.FORTUNE_POOL,
            amount: wager
        },
        
        // Custom validation
        validate: async (signer, userAddress) => {
            const contract = getFortuneContract(signer);
            
            // Get active tiers
            const tiers = await contract.getActiveTiers();
            const activeTiers = tiers.filter(t => t.active);
            
            if (activeTiers.length === 0) {
                throw new Error('No active prize tiers available');
            }
            
            // Find tier for wager
            let tierFound = null;
            for (const tier of activeTiers) {
                if (wager >= tier.minWager && wager <= tier.maxWager) {
                    tierFound = tier;
                    break;
                }
            }
            
            if (!tierFound) {
                const minWager = ethers.formatEther(activeTiers[0].minWager);
                const maxWager = ethers.formatEther(activeTiers[activeTiers.length - 1].maxWager);
                throw new Error(`Wager must be between ${minWager} and ${maxWager} BKC`);
            }
            
            // Validate guess count
            if (guesses.length !== Number(tierFound.guessCount)) {
                throw new Error(`This tier requires exactly ${tierFound.guessCount} guesses`);
            }
            
            // Validate guess range
            const maxNumber = Number(tierFound.maxNumber);
            for (let i = 0; i < guesses.length; i++) {
                if (guesses[i] < 1 || guesses[i] > maxNumber) {
                    throw new Error(`Guess #${i + 1} must be between 1 and ${maxNumber}`);
                }
            }
            
            // Check for duplicate guesses
            const uniqueGuesses = new Set(guesses);
            if (uniqueGuesses.size !== guesses.length) {
                throw new Error('Duplicate guesses are not allowed');
            }
            
            // Get service fee
            serviceFee = await contract.serviceFee();
            
            // Check user has enough ETH for service fee
            const provider = signer.provider;
            const ethBalance = await provider.getBalance(userAddress);
            
            if (ethBalance < serviceFee) {
                throw new Error(`Insufficient ETH for service fee (${ethers.formatEther(serviceFee)} ETH required)`);
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
                                wager: parsed.args.wager,
                                guesses: parsed.args.guesses.map(g => Number(g)),
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
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    const tiers = await contract.getActiveTiers();
    
    return tiers
        .map((tier, index) => ({
            index,
            minWager: tier.minWager,
            maxWager: tier.maxWager,
            maxNumber: Number(tier.maxNumber),
            guessCount: Number(tier.guessCount),
            multiplier: Number(tier.multiplier),
            active: tier.active
        }))
        .filter(t => t.active);
}

/**
 * Gets tier info for a specific wager amount
 * @param {string|bigint} wagerAmount - Wager amount in wei
 * @returns {Promise<Object|null>} Tier info or null if invalid
 */
export async function getTierForWager(wagerAmount) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    try {
        const tier = await contract.getTierForWager(wagerAmount);
        return {
            tierIndex: Number(tier.tierIndex),
            minWager: tier.minWager,
            maxWager: tier.maxWager,
            maxNumber: Number(tier.maxNumber),
            guessCount: Number(tier.guessCount),
            multiplier: Number(tier.multiplier)
        };
    } catch {
        return null;
    }
}

/**
 * Gets current service fee
 * @returns {Promise<bigint>} Fee in wei
 */
export async function getServiceFee() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    return await contract.serviceFee();
}

/**
 * Calculates potential win amount
 * @param {string|bigint} wagerAmount - Wager amount
 * @param {boolean} isCumulative - Cumulative mode
 * @returns {Promise<bigint>} Potential win in wei
 */
export async function calculatePotentialWin(wagerAmount, isCumulative = false) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    return await contract.calculatePotentialWin(wagerAmount, isCumulative);
}

/**
 * Gets user's game history
 * @param {string} userAddress - User address
 * @returns {Promise<Array>} Array of game results
 */
export async function getUserGameHistory(userAddress) {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    const history = await contract.getUserGameHistory(userAddress);
    
    return history.map(game => ({
        wager: game.wager,
        guesses: game.guesses.map(g => Number(g)),
        winningNumber: Number(game.winningNumber),
        payout: game.payout,
        timestamp: Number(game.timestamp),
        won: game.won,
        // Computed
        date: new Date(Number(game.timestamp) * 1000)
    }));
}

/**
 * Gets last winning number
 * @returns {Promise<number>} Last winning number
 */
export async function getLastWinningNumber() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contract = new ethers.Contract(CONTRACTS.FORTUNE_POOL, FORTUNE_ABI, provider);
    
    return Number(await contract.lastWinningNumber());
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
    calculatePotentialWin,
    getUserGameHistory,
    getLastWinningNumber
};

export default FortuneTx;