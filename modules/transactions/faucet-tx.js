// modules/js/transactions/faucet-tx.js
// ✅ PRODUCTION V1.1 - FIXED: Flexible imports and callbacks
//
// CHANGES V1.1:
// - Made imports optional/flexible (State, showToast, loadUserData)
// - Added onSuccess/onError callbacks for consistency with other tx modules
// - Added support for both API faucet and on-chain faucet contract
// - Uses addresses from config.js for on-chain faucet if needed
//
// Handles testnet faucet claims for BKC and ETH tokens

import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

/**
 * Get faucet contract address (for on-chain claims)
 * @returns {string|null} Faucet contract address or null
 */
function getFaucetAddress() {
    return addresses?.faucet || 
           contractAddresses?.faucet ||
           window.contractAddresses?.faucet ||
           null;
}

/**
 * Faucet Contract ABI (for on-chain claims)
 */
const FAUCET_ABI = [
    'function claim() external',
    'function canClaim(address user) view returns (bool)',
    'function lastClaimTime(address user) view returns (uint256)',
    'function claimCooldown() view returns (uint256)',
    'function claimAmountBKC() view returns (uint256)',
    'function claimAmountETH() view returns (uint256)',
    'event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets current user address from various sources
 */
function getUserAddress() {
    // Try multiple sources
    if (typeof State !== 'undefined' && State?.userAddress) {
        return State.userAddress;
    }
    if (window.State?.userAddress) {
        return window.State.userAddress;
    }
    if (window.userAddress) {
        return window.userAddress;
    }
    if (window.ethereum?.selectedAddress) {
        return window.ethereum.selectedAddress;
    }
    return null;
}

/**
 * Shows toast notification (with fallback)
 */
function notify(message, type = 'info') {
    // Try window.showToast
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    // Fallback to console
    const logFn = type === 'error' ? console.error : console.log;
    logFn(`[Faucet] ${message}`);
}

/**
 * Refreshes user data (with fallback)
 */
async function refreshUserData() {
    // Try window.loadUserData
    if (typeof window.loadUserData === 'function') {
        await window.loadUserData();
        return;
    }
    // Try window.refreshBalances
    if (typeof window.refreshBalances === 'function') {
        await window.refreshBalances();
        return;
    }
    console.log('[Faucet] No refresh function available');
}

// ============================================================================
// FAUCET CLAIM - API METHOD
// ============================================================================

/**
 * Claim tokens from the testnet faucet via API
 * 
 * @param {Object} params - Claim parameters
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {string} [params.address] - Address to claim for (defaults to connected wallet)
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Result with success, txHash, amounts
 */
export async function claim({
    button = null,
    address = null,
    onSuccess = null,
    onError = null
} = {}) {
    const userAddress = address || getUserAddress();
    
    if (!userAddress) {
        const error = 'Please connect wallet first';
        notify(error, 'error');
        if (onError) onError(new Error(error));
        return { success: false, error };
    }
    
    // Store original button state
    const originalText = button?.innerHTML || 'Claim';
    const originalDisabled = button?.disabled || false;
    
    if (button) {
        button.innerHTML = '<div class="loader inline-block"></div> Claiming...';
        button.disabled = true;
    }
    
    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${userAddress}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            notify('✅ Tokens received!', 'success');
            
            // Refresh balances
            await refreshUserData();
            
            const result = { 
                success: true, 
                txHash: data.txHash,
                bkcAmount: data.bkcAmount,
                ethAmount: data.ethAmount
            };
            
            if (onSuccess) onSuccess(result);
            return result;
            
        } else {
            const msg = data.error || data.message || 'Faucet unavailable';
            notify(msg, 'error');
            
            const error = new Error(msg);
            if (onError) onError(error);
            return { success: false, error: msg };
        }
        
    } catch (e) {
        console.error('Faucet error:', e);
        notify('Faucet unavailable', 'error');
        
        if (onError) onError(e);
        return { success: false, error: e.message };
        
    } finally {
        if (button) {
            button.innerHTML = originalText;
            button.disabled = originalDisabled;
        }
    }
}

// Legacy function name for backward compatibility
export const executeFaucetClaim = async (btnElement) => {
    return await claim({ button: btnElement });
};

// ============================================================================
// FAUCET CLAIM - ON-CHAIN METHOD
// ============================================================================

/**
 * Claim tokens from the on-chain faucet contract
 * Use this if the API is unavailable
 * 
 * @param {Object} params - Claim parameters
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function claimOnChain({
    button = null,
    onSuccess = null,
    onError = null
} = {}) {
    const faucetAddress = getFaucetAddress();
    
    if (!faucetAddress) {
        const error = 'Faucet contract address not configured';
        notify(error, 'error');
        if (onError) onError(new Error(error));
        return { success: false, error };
    }
    
    // Import txEngine dynamically
    const { txEngine } = await import('../core/index.js');
    
    return await txEngine.execute({
        name: 'FaucetClaim',
        button,
        
        getContract: async (signer) => {
            const ethers = window.ethers;
            return new ethers.Contract(faucetAddress, FAUCET_ABI, signer);
        },
        method: 'claim',
        args: [],
        
        validate: async (signer, userAddress) => {
            const ethers = window.ethers;
            const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, signer);
            
            const canClaimNow = await contract.canClaim(userAddress);
            if (!canClaimNow) {
                const lastClaim = await contract.lastClaimTime(userAddress);
                const cooldown = await contract.claimCooldown();
                const nextClaim = Number(lastClaim) + Number(cooldown);
                const now = Math.floor(Date.now() / 1000);
                
                if (nextClaim > now) {
                    const waitMinutes = Math.ceil((nextClaim - now) / 60);
                    throw new Error(`Please wait ${waitMinutes} minutes before claiming again`);
                }
            }
        },
        
        onSuccess: async (receipt) => {
            notify('✅ Tokens received!', 'success');
            await refreshUserData();
            if (onSuccess) onSuccess(receipt);
        },
        
        onError: (error) => {
            notify(error.message || 'Claim failed', 'error');
            if (onError) onError(error);
        }
    });
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

/**
 * Check if user can claim from on-chain faucet
 * @param {string} userAddress - User address
 * @returns {Promise<Object>} Claim status
 */
export async function canClaim(userAddress) {
    const faucetAddress = getFaucetAddress();
    if (!faucetAddress) {
        return { canClaim: false, error: 'Faucet not configured' };
    }
    
    try {
        const ethers = window.ethers;
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, provider);
        
        const [canClaimNow, lastClaim, cooldown] = await Promise.all([
            contract.canClaim(userAddress),
            contract.lastClaimTime(userAddress),
            contract.claimCooldown()
        ]);
        
        const nextClaimTime = Number(lastClaim) + Number(cooldown);
        const now = Math.floor(Date.now() / 1000);
        
        return {
            canClaim: canClaimNow,
            lastClaimTime: Number(lastClaim),
            cooldownSeconds: Number(cooldown),
            nextClaimTime,
            waitSeconds: canClaimNow ? 0 : Math.max(0, nextClaimTime - now)
        };
    } catch (e) {
        console.error('Error checking claim status:', e);
        return { canClaim: false, error: e.message };
    }
}

/**
 * Get faucet info (amounts, cooldown)
 * @returns {Promise<Object>} Faucet configuration
 */
export async function getFaucetInfo() {
    const faucetAddress = getFaucetAddress();
    if (!faucetAddress) {
        return { error: 'Faucet not configured' };
    }
    
    try {
        const ethers = window.ethers;
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, provider);
        
        const [bkcAmount, ethAmount, cooldown] = await Promise.all([
            contract.claimAmountBKC(),
            contract.claimAmountETH(),
            contract.claimCooldown()
        ]);
        
        return {
            bkcAmount,
            ethAmount,
            cooldownSeconds: Number(cooldown),
            cooldownMinutes: Number(cooldown) / 60,
            bkcAmountFormatted: ethers.formatEther(bkcAmount),
            ethAmountFormatted: ethers.formatEther(ethAmount)
        };
    } catch (e) {
        console.error('Error getting faucet info:', e);
        return { error: e.message };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const FaucetTx = {
    // Main claim functions
    claim,
    claimOnChain,
    executeFaucetClaim, // Legacy alias
    // Read functions
    canClaim,
    getFaucetInfo,
    // Utilities
    getFaucetAddress,
    FAUCET_API_URL
};

export default FaucetTx;