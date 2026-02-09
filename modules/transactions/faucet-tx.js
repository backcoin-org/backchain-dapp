// modules/js/transactions/faucet-tx.js
// ✅ V9.0 - Updated for SimpleBKCFaucet V9
//
// CHANGES V9.0:
// - Updated ABI: claimCooldown→cooldown, claimAmountBKC→tokensPerClaim, claimAmountETH→ethPerClaim
// - Added getUserInfo() 4-tuple: (canClaim, lastClaim, nextClaim, tokensAvailable)
// - Added getFaucetStatus() 6-tuple
// - claim() still takes no params (same in V9)
//
// Handles testnet faucet claims for BKC and ETH tokens

import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

function getFaucetAddress() {
    return addresses?.faucet ||
           contractAddresses?.faucet ||
           window.contractAddresses?.faucet ||
           null;
}

/**
 * SimpleBKCFaucet V9 ABI
 */
const FAUCET_ABI = [
    // Write
    'function claim() external',

    // Read - User
    'function canClaim(address user) view returns (bool)',
    'function getUserInfo(address user) view returns (bool canClaimNow, uint256 lastClaim, uint256 nextClaim, uint256 tokensAvailable)',

    // Read - Config
    'function cooldown() view returns (uint256)',
    'function tokensPerClaim() view returns (uint256)',
    'function ethPerClaim() view returns (uint256)',
    'function getFaucetStatus() view returns (uint256 _tokensPerClaim, uint256 _ethPerClaim, uint256 _cooldown, uint256 bkcBalance, uint256 ethBalance, bool isPaused)',
    'function getStats() view returns (uint256 totalClaims, uint256 totalBkcDistributed, uint256 totalEthDistributed)',

    // Events
    'event TokensClaimed(address indexed user, uint256 bkcAmount, uint256 ethAmount)'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserAddress() {
    if (typeof State !== 'undefined' && State?.userAddress) return State.userAddress;
    if (window.State?.userAddress) return window.State.userAddress;
    if (window.userAddress) return window.userAddress;
    if (window.ethereum?.selectedAddress) return window.ethereum.selectedAddress;
    return null;
}

function notify(message, type = 'info') {
    if (typeof window.showToast === 'function') { window.showToast(message, type); return; }
    const logFn = type === 'error' ? console.error : console.log;
    logFn(`[Faucet] ${message}`);
}

async function refreshUserData() {
    if (typeof window.loadUserData === 'function') { await window.loadUserData(); return; }
    if (typeof window.refreshBalances === 'function') { await window.refreshBalances(); return; }
}

// ============================================================================
// FAUCET CLAIM - API METHOD
// ============================================================================

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
            notify('Tokens received!', 'success');
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

export const executeFaucetClaim = async (btnElement) => {
    return await claim({ button: btnElement });
};

// ============================================================================
// FAUCET CLAIM - ON-CHAIN METHOD
// ============================================================================

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
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, provider);

            // V9: Use getUserInfo for richer check
            try {
                const info = await contract.getUserInfo(userAddress);
                if (!info.canClaimNow) {
                    const now = Math.floor(Date.now() / 1000);
                    const waitSeconds = Number(info.nextClaim) - now;
                    if (waitSeconds > 0) {
                        const waitMinutes = Math.ceil(waitSeconds / 60);
                        throw new Error(`Please wait ${waitMinutes} minutes before claiming again`);
                    }
                }
            } catch (e) {
                if (e.message.includes('wait')) throw e;
                // Fallback to canClaim
                const canClaimNow = await contract.canClaim(userAddress);
                if (!canClaimNow) {
                    throw new Error('Cannot claim yet. Please wait for cooldown.');
                }
            }
        },

        onSuccess: async (receipt) => {
            notify('Tokens received!', 'success');
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

export async function canClaim(userAddress) {
    const faucetAddress = getFaucetAddress();
    if (!faucetAddress) return { canClaim: false, error: 'Faucet not configured' };

    try {
        const ethers = window.ethers;
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, provider);

        // V9: Use getUserInfo
        try {
            const info = await contract.getUserInfo(userAddress);
            const now = Math.floor(Date.now() / 1000);
            return {
                canClaim: info.canClaimNow,
                lastClaimTime: Number(info.lastClaim),
                nextClaimTime: Number(info.nextClaim),
                tokensAvailable: info.tokensAvailable,
                waitSeconds: info.canClaimNow ? 0 : Math.max(0, Number(info.nextClaim) - now)
            };
        } catch {
            // Fallback
            const canClaimNow = await contract.canClaim(userAddress);
            return { canClaim: canClaimNow, waitSeconds: 0 };
        }
    } catch (e) {
        console.error('Error checking claim status:', e);
        return { canClaim: false, error: e.message };
    }
}

/**
 * Get faucet info (amounts, cooldown)
 * V9: tokensPerClaim, ethPerClaim, cooldown
 */
export async function getFaucetInfo() {
    const faucetAddress = getFaucetAddress();
    if (!faucetAddress) return { error: 'Faucet not configured' };

    try {
        const ethers = window.ethers;
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        const contract = new ethers.Contract(faucetAddress, FAUCET_ABI, provider);

        // V9: Use getFaucetStatus
        try {
            const status = await contract.getFaucetStatus();
            return {
                bkcAmount: status._tokensPerClaim || status[0],
                ethAmount: status._ethPerClaim || status[1],
                cooldownSeconds: Number(status._cooldown || status[2]),
                cooldownMinutes: Number(status._cooldown || status[2]) / 60,
                bkcAmountFormatted: ethers.formatEther(status._tokensPerClaim || status[0]),
                ethAmountFormatted: ethers.formatEther(status._ethPerClaim || status[1]),
                bkcBalance: status.bkcBalance || status[3],
                ethBalance: status.ethBalance || status[4],
                isPaused: status.isPaused || status[5] || false
            };
        } catch {
            // Fallback to individual calls
            const [bkcAmount, ethAmount, cooldown] = await Promise.all([
                contract.tokensPerClaim(),
                contract.ethPerClaim(),
                contract.cooldown()
            ]);
            return {
                bkcAmount, ethAmount,
                cooldownSeconds: Number(cooldown),
                cooldownMinutes: Number(cooldown) / 60,
                bkcAmountFormatted: ethers.formatEther(bkcAmount),
                ethAmountFormatted: ethers.formatEther(ethAmount)
            };
        }
    } catch (e) {
        console.error('Error getting faucet info:', e);
        return { error: e.message };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const FaucetTx = {
    claim,
    claimOnChain,
    executeFaucetClaim,
    canClaim,
    getFaucetInfo,
    getFaucetAddress,
    FAUCET_API_URL
};

export default FaucetTx;
