// js/modules/transactions.js
// ✅ PRODUCTION V14.0 - Optimized with Pre-flight Checks & Auto-Adjustment
// 
// IMPROVEMENTS:
// - Pre-flight checks before ANY transaction
// - Auto-adjustment of amounts when possible
// - Smart allowance management (approve more to avoid re-approvals)
// - Gas estimation with buffer
// - Better error recovery and user feedback
// - Automatic balance checks
// - ETH gas buffer verification
//

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI, decentralizedNotaryABI, actionsManagerABI, delegationManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings, loadUserDelegations } from './data.js';
import { recordPlatformUsage } from './firebase-auth-service.js';

// ====================================================================
// CONFIGURATION
// ====================================================================

const TX_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    APPROVAL_WAIT_MS: 1500,
    SIMULATION_TIMEOUT_MS: 10000,
    
    // Auto-adjustment settings
    ALLOWANCE_MULTIPLIER: 100n,      // Approve 100x to avoid re-approvals
    MIN_ETH_FOR_GAS: 0.002,          // Minimum ETH needed for gas
    GAS_BUFFER_PERCENT: 20,          // Add 20% buffer to gas estimates
    SLIPPAGE_BIPS: 300,              // 3% slippage tolerance
    
    // User-friendly thresholds
    MAX_AUTO_ADJUST_PERCENT: 5       // Max % to auto-reduce amount
};

// Arbitrum Sepolia Faucet Links
const FAUCET_LINKS = {
    arbitrumSepolia: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    alternativeFaucet: 'https://faucet.quicknode.com/arbitrum/sepolia',
    bkcFaucet: 'https://app.backcoin.org' // Our faucet
};

// ====================================================================
// UTILITIES
// ====================================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function safeFormatEther(value) {
    try {
        const bigValue = BigInt(value);
        if (bigValue > ethers.parseEther("1000000000")) return "UNLIMITED";
        return ethers.formatEther(bigValue);
    } catch { return "N/A"; }
}

// ====================================================================
// PRE-FLIGHT CHECK SYSTEM
// ====================================================================

/**
 * Comprehensive pre-flight checks before any transaction
 * Returns { canProceed, issues, adjustments }
 */
async function preFlightCheck(options) {
    const {
        requiredBKC = 0n,
        requiredETH = 0n,
        spenderAddress = null,
        checkAllowance = true,
        actionName = 'transaction'
    } = options;

    const issues = [];
    const adjustments = {};
    let canProceed = true;

    try {
        const signer = await getConnectedSigner();
        if (!signer) {
            return { canProceed: false, issues: ['Wallet not connected'], adjustments: {} };
        }

        const provider = signer.provider;
        const userAddress = State.userAddress;

        // 1. Check ETH balance for gas
        const ethBalance = await provider.getBalance(userAddress);
        const minEthForGas = ethers.parseEther(TX_CONFIG.MIN_ETH_FOR_GAS.toString());
        const totalEthNeeded = requiredETH + minEthForGas;

        if (ethBalance < totalEthNeeded) {
            if (ethBalance < minEthForGas) {
                issues.push(`Insufficient ETH for gas (have ${formatEth(ethBalance)}, need ~${TX_CONFIG.MIN_ETH_FOR_GAS} ETH)`);
                canProceed = false;
                adjustments.needsETH = true;
            } else if (requiredETH > 0n && ethBalance < totalEthNeeded) {
                issues.push(`Insufficient ETH (have ${formatEth(ethBalance)}, need ${formatEth(totalEthNeeded)})`);
                canProceed = false;
            }
        }

        // 2. Check BKC balance
        if (requiredBKC > 0n) {
            let bkcBalance = State.currentUserBalance || 0n;
            
            // Refresh balance if stale
            if (State.bkcTokenContract) {
                try {
                    bkcBalance = await State.bkcTokenContract.balanceOf(userAddress);
                    State.currentUserBalance = bkcBalance;
                } catch (e) {
                    console.warn('Could not refresh BKC balance:', e.message);
                }
            }

            if (bkcBalance < requiredBKC) {
                const shortfall = requiredBKC - bkcBalance;
                const shortfallPercent = Number((shortfall * 100n) / requiredBKC);
                
                // Can we auto-adjust?
                if (shortfallPercent <= TX_CONFIG.MAX_AUTO_ADJUST_PERCENT && bkcBalance > 0n) {
                    adjustments.adjustedBKC = bkcBalance;
                    adjustments.originalBKC = requiredBKC;
                    issues.push(`Amount reduced to ${formatBigNumber(bkcBalance)} BKC (your balance)`);
                } else {
                    issues.push(`Insufficient BKC (have ${formatBigNumber(bkcBalance)}, need ${formatBigNumber(requiredBKC)})`);
                    canProceed = false;
                    adjustments.needsBKC = true;
                }
            }
        }

        // 3. Check allowance
        if (checkAllowance && spenderAddress && requiredBKC > 0n) {
            try {
                const tokenABI = ["function allowance(address,address) view returns (uint256)"];
                const token = new ethers.Contract(addresses.bkcToken, tokenABI, provider);
                const currentAllowance = await token.allowance(userAddress, spenderAddress);
                
                const amountToCheck = adjustments.adjustedBKC || requiredBKC;
                
                if (currentAllowance < amountToCheck) {
                    adjustments.needsApproval = true;
                    adjustments.currentAllowance = currentAllowance;
                    adjustments.requiredAllowance = amountToCheck;
                    // Not a blocking issue - we'll approve automatically
                }
            } catch (e) {
                console.warn('Could not check allowance:', e.message);
            }
        }

        // 4. Estimate gas (if we can proceed so far)
        if (canProceed && options.estimateGas) {
            try {
                const gasEstimate = await options.estimateGas();
                const gasPrice = await provider.getFeeData();
                const estimatedCost = gasEstimate * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n);
                
                if (ethBalance < estimatedCost + requiredETH) {
                    issues.push(`Gas estimate: ~${formatEth(estimatedCost)} ETH`);
                    if (ethBalance < estimatedCost) {
                        canProceed = false;
                    }
                }
                
                adjustments.gasEstimate = gasEstimate;
                adjustments.estimatedGasCost = estimatedCost;
            } catch (e) {
                console.warn('Gas estimation failed:', e.message);
                // Continue anyway - wallet will estimate
            }
        }

        return { canProceed, issues, adjustments };

    } catch (e) {
        console.error('Pre-flight check error:', e);
        return { 
            canProceed: false, 
            issues: ['Pre-flight check failed: ' + e.message], 
            adjustments: {} 
        };
    }
}

function formatEth(wei) {
    return parseFloat(ethers.formatEther(wei)).toFixed(4);
}

// ====================================================================
// SMART APPROVAL SYSTEM
// ====================================================================

/**
 * Smart approval - approves a large amount to avoid future approvals
 */
async function smartApprove(tokenAddress, spenderAddress, minimumAmount, signer) {
    const tokenABI = [
        "function approve(address,uint256) returns (bool)", 
        "function allowance(address,address) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)"
    ];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    try {
        // Check current allowance
        const currentAllowance = await token.allowance(State.userAddress, spenderAddress);
        
        if (currentAllowance >= minimumAmount) {
            console.log("✅ Already approved:", safeFormatEther(currentAllowance), "BKC");
            return true;
        }
        
        // Get user's balance to determine approval amount
        const balance = await token.balanceOf(State.userAddress);
        
        // Approve the larger of: minimumAmount * multiplier OR user's full balance
        // This avoids needing to re-approve for future transactions
        const approveAmount = balance > minimumAmount * TX_CONFIG.ALLOWANCE_MULTIPLIER 
            ? minimumAmount * TX_CONFIG.ALLOWANCE_MULTIPLIER 
            : balance;
        
        console.log("Approving:", safeFormatEther(approveAmount), "BKC");
        showToast("Approve BKC spending...", "info");
        
        const tx = await token.approve(spenderAddress, approveAmount);
        showToast("Waiting for approval...", "info");
        
        const receipt = await tx.wait();
        if (receipt.status === 0) {
            throw new Error("Approval failed");
        }
        
        await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        
        // Verify
        const newAllowance = await token.allowance(State.userAddress, spenderAddress);
        if (newAllowance >= minimumAmount) {
            showToast("✅ Approved!", "success");
            return true;
        }
        
        throw new Error("Approval not reflected");
        
    } catch (e) {
        if (isUserRejection(e)) {
            showToast("Approval cancelled", "error");
            return false;
        }
        
        console.error("Approval error:", e);
        handleTransactionError(e);
        return false;
    }
}

// ====================================================================
// TRANSACTION EXECUTOR WITH AUTO-ADJUSTMENT
// ====================================================================

/**
 * Execute transaction with automatic adjustments and retries
 */
async function executeWithAutoAdjust(txFunction, options = {}) {
    const {
        retries = TX_CONFIG.MAX_RETRIES,
        onAttempt = () => {},
        onSuccess = () => {},
        description = 'Transaction',
        gasLimitOverride = null
    } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            onAttempt(attempt);
            
            // Build transaction options
            const txOptions = {};
            
            if (gasLimitOverride) {
                txOptions.gasLimit = gasLimitOverride;
            }
            
            const tx = await txFunction(txOptions);
            showToast("⏳ Confirming...", "info");
            
            const receipt = await tx.wait();
            
            if (receipt.status === 0) {
                throw new Error("Transaction reverted");
            }
            
            onSuccess(receipt);
            return { success: true, receipt, txHash: receipt.hash };
            
        } catch (e) {
            console.error(`${description} attempt ${attempt} failed:`, e);
            
            // User cancelled - don't retry
            if (isUserRejection(e)) {
                showToast("Transaction cancelled", "warning");
                return { success: false, cancelled: true };
            }
            
            // Gas estimation failed - try with manual gas limit
            if (e.message?.includes('cannot estimate gas') && !gasLimitOverride) {
                console.log("Retrying with manual gas limit...");
                options.gasLimitOverride = 500000n;
                continue;
            }
            
            // Network error - retry
            if (attempt < retries && isRetryableError(e)) {
                showToast(`Network issue, retrying... (${attempt}/${retries})`, "warning");
                await sleep(TX_CONFIG.RETRY_DELAY_MS * attempt);
                continue;
            }
            
            handleTransactionError(e);
            return { success: false, error: e };
        }
    }
    
    return { success: false };
}

// ====================================================================
// ERROR HANDLING
// ====================================================================

function isUserRejection(error) {
    const msg = error?.message || error?.reason || '';
    return msg.includes('user rejected') || 
           msg.includes('User denied') || 
           msg.includes('cancelled') ||
           msg.includes('canceled') ||
           error?.code === 4001;
}

function isRetryableError(error) {
    const msg = error?.message || error?.reason || '';
    const retryablePatterns = [
        'Internal JSON-RPC',
        'network',
        'timeout',
        'ETIMEDOUT',
        'ECONNRESET',
        'rate limit',
        'Too Many Requests',
        'nonce',
        'replacement transaction',
        'already known'
    ];
    return retryablePatterns.some(pattern => msg.toLowerCase().includes(pattern.toLowerCase()));
}

function formatError(error) {
    const msg = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
    
    // Contract-specific errors with user-friendly messages
    const errorMap = {
        'insufficient funds': 'INSUFFICIENT_GAS',
        'exceeds the balance': 'INSUFFICIENT_GAS',
        'InsufficientOracleFee': 'Insufficient ETH for service fee',
        'InvalidGuessCount': 'Wrong number of guesses for selected mode',
        'InvalidGuessRange': 'Guess must be within the valid range',
        'ZeroAmount': 'Amount cannot be zero',
        'NoActiveTiers': 'Game is currently unavailable',
        'InsufficientAllowance': 'Token approval needed',
        'InsufficientBalance': 'Insufficient BKC balance',
        'InsufficientTokenBalance': 'Contract has insufficient tokens',
        'InsufficientEthBalance': 'Contract has insufficient ETH',
        'DelegationNotFound': 'Delegation not found',
        'DelegationLocked': 'Delegation is still locked',
        'LockPeriodActive': 'Lock period still active',
        'InvalidIndex': 'Invalid delegation index',
        'NotOwner': 'You are not the owner',
        'CooldownActive': 'Please wait for cooldown',
        'NoRewardsToClaim': 'No rewards available to claim',
        'InsufficientPrizePool': 'Prize pool is too low',
        'SlippageExceeded': 'Price changed too much, try again',
        'PoolEmpty': 'No NFTs available in pool'
    };
    
    for (const [pattern, message] of Object.entries(errorMap)) {
        if (msg.includes(pattern)) {
            return message;
        }
    }
    
    // Clean up common prefixes
    if (msg.includes('execution reverted:')) {
        return msg.split('execution reverted:')[1].trim().slice(0, 100);
    }
    
    return msg.slice(0, 100);
}

function handleTransactionError(error) {
    const formattedError = formatError(error);
    
    if (formattedError === 'INSUFFICIENT_GAS') {
        showInsufficientGasError();
        return;
    }
    
    showToast(formattedError, "error");
}

function showInsufficientGasError() {
    showToast("⛽ Need ETH for gas fees!", "error");
    
    // Show modal with faucet links
    setTimeout(() => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/80" onclick="this.parentElement.remove()"></div>
            <div class="relative bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-700">
                <h3 class="text-lg font-bold text-white mb-2">⛽ Need Gas (ETH)</h3>
                <p class="text-sm text-zinc-400 mb-4">
                    Transactions on Arbitrum require a small amount of ETH for gas fees.
                </p>
                <div class="space-y-2">
                    <a href="${FAUCET_LINKS.arbitrumSepolia}" target="_blank" 
                       class="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl font-bold">
                        🚰 Alchemy Faucet
                    </a>
                    <a href="${FAUCET_LINKS.alternativeFaucet}" target="_blank"
                       class="block w-full py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white text-center rounded-xl">
                        QuickNode Faucet
                    </a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="mt-4 w-full py-2 text-zinc-500 hover:text-zinc-300">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }, 300);
}

// ====================================================================
// SIGNER HELPER
// ====================================================================

async function getConnectedSigner() {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return null;
    }
    
    try {
        const rawProvider = State.web3Provider || State.provider || window.ethereum;
        if (!rawProvider) {
            showToast("No wallet provider found", "error");
            return null;
        }
        
        const provider = new ethers.BrowserProvider(rawProvider);
        return await provider.getSigner();
    } catch (e) {
        console.error("Signer error:", e);
        showToast("Wallet connection error", "error");
        return null;
    }
}

// ====================================================================
// PLATFORM USAGE TRACKING
// ====================================================================

async function trackPlatformUsage(actionType, txHash) {
    if (!txHash) return;
    
    (async () => {
        try {
            const result = await recordPlatformUsage(actionType, txHash);
            if (result?.success && result.pointsAwarded > 0) {
                showToast(`🎯 +${result.pointsAwarded.toLocaleString()} Airdrop Points!`, "success");
            }
        } catch (e) {
            console.warn('Tracking failed:', e.message);
        }
    })();
}

// ====================================================================
// DELEGATION - OPTIMIZED
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Delegate';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Checking...');
    
    try {
        const totalAmountBigInt = BigInt(totalAmount);
        const durationBigInt = BigInt(durationSeconds);
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        // Pre-flight check
        const preflight = await preFlightCheck({
            requiredBKC: totalAmountBigInt,
            spenderAddress: addresses.delegationManager,
            actionName: 'delegation'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        // Use adjusted amount if available
        const finalAmount = preflight.adjustments.adjustedBKC || totalAmountBigInt;
        
        if (preflight.adjustments.adjustedBKC) {
            showToast(`Amount adjusted to ${formatBigNumber(finalAmount)} BKC`, "info");
        }
        
        // Approve if needed
        if (preflight.adjustments.needsApproval) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            const approved = await smartApprove(
                addresses.bkcToken,
                addresses.delegationManager,
                finalAmount,
                signer
            );
            if (!approved) return false;
        }
        
        updateButton('<div class="loader inline-block"></div> Delegating...');
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithAutoAdjust(
            () => delegationContract.delegate(finalAmount, durationBigInt, boosterIdBigInt),
            {
                description: 'Delegation',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm in wallet...", "info");
                },
                onSuccess: () => {
                    showToast("✅ Delegation successful!", "success");
                    loadUserData();
                }
            }
        );
        
        if (result.success) {
            trackPlatformUsage('delegation', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Delegation error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// UNSTAKE - OPTIMIZED
// ====================================================================

export async function executeUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Unstake';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        // Pre-flight - only need gas
        const preflight = await preFlightCheck({
            requiredETH: 0n,
            actionName: 'unstake'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        const indexBigInt = BigInt(Number(index));
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithAutoAdjust(
            () => delegationContract.unstake(indexBigInt, boosterIdBigInt),
            {
                description: 'Unstake',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm unstake...", "info");
                },
                onSuccess: async () => {
                    showToast("✅ Unstaked!", "success");
                    await loadUserData(true);
                    await loadUserDelegations(true);
                }
            }
        );
        
        if (result.success) {
            trackPlatformUsage('unstake', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Unstake error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// FORCE UNSTAKE - OPTIMIZED
// ====================================================================

export async function executeForceUnstake(index, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Force Unstake';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        const preflight = await preFlightCheck({ actionName: 'force unstake' });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        const indexBigInt = BigInt(Number(index));
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithAutoAdjust(
            () => delegationContract.forceUnstake(indexBigInt, boosterIdBigInt),
            {
                description: 'Force Unstake',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("⚠️ Confirm force unstake (50% penalty)...", "warning");
                },
                onSuccess: async () => {
                    showToast("✅ Force unstaked (penalty applied)", "success");
                    await loadUserData(true);
                    await loadUserDelegations(true);
                }
            }
        );
        
        if (result.success) {
            trackPlatformUsage('unstake', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Force unstake error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// CLAIM REWARDS - OPTIMIZED
// ====================================================================

export async function executeClaimRewards(boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Claiming...');
    
    try {
        const preflight = await preFlightCheck({ actionName: 'claim' });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        const boosterIdBigInt = BigInt(boosterIdToSend || 0);
        
        const delegationContract = new ethers.Contract(
            addresses.delegationManager,
            delegationManagerABI,
            signer
        );
        
        const result = await executeWithAutoAdjust(
            () => delegationContract.claimReward(boosterIdBigInt),
            {
                description: 'Claim',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm claim...", "info");
                },
                onSuccess: () => {
                    showToast("✅ Rewards claimed!", "success");
                    loadUserData();
                }
            }
        );
        
        if (result.success) {
            trackPlatformUsage('claimReward', result.txHash);
        }
        
        return result.success;
        
    } catch (e) {
        console.error("Claim error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// UNIVERSAL CLAIM (Staking + Mining) - OPTIMIZED
// ====================================================================

export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = btnElement?.innerHTML || 'Claim';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        const preflight = await preFlightCheck({ actionName: 'universal claim' });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        // Validate booster
        let boosterIdBigInt = 0n;
        try {
            const boosterNum = Number(boosterIdToSend || 0);
            if (boosterNum > 0 && State.myBoosters?.length > 0) {
                const ownsBooster = State.myBoosters.some(b => Number(b.tokenId) === boosterNum);
                if (ownsBooster) {
                    boosterIdBigInt = BigInt(boosterNum);
                }
            }
        } catch (e) {
            console.warn('Booster validation failed:', e);
        }
        
        const hasStaking = BigInt(stakingRewards || 0) > 0n;
        const hasMining = BigInt(minerRewards || 0) > 0n;
        
        let stakingSuccess = false;
        let miningSuccess = false;
        let txHash = null;
        
        // Claim staking rewards
        if (hasStaking) {
            updateButton('<div class="loader inline-block"></div> Claiming staking...');
            
            const delegationContract = new ethers.Contract(
                addresses.delegationManager,
                delegationManagerABI,
                signer
            );
            
            const result = await executeWithAutoAdjust(
                () => delegationContract.claimReward(boosterIdBigInt),
                {
                    description: 'Claim Staking',
                    onAttempt: () => showToast("Confirm staking claim...", "info")
                }
            );
            
            stakingSuccess = result.success;
            if (result.txHash) txHash = result.txHash;
        }
        
        // Claim mining rewards
        if (hasMining && addresses.miningManager) {
            updateButton('<div class="loader inline-block"></div> Claiming mining...');
            
            const miningABI = ["function claimRewards(uint256) external"];
            const miningContract = new ethers.Contract(addresses.miningManager, miningABI, signer);
            
            const result = await executeWithAutoAdjust(
                () => miningContract.claimRewards(boosterIdBigInt),
                {
                    description: 'Claim Mining',
                    onAttempt: () => showToast("Confirm mining claim...", "info")
                }
            );
            
            miningSuccess = result.success;
            if (result.txHash) txHash = result.txHash;
        }
        
        const anySuccess = stakingSuccess || miningSuccess;
        
        if (anySuccess) {
            showToast("✅ Rewards claimed!", "success");
            loadUserData();
            if (txHash) trackPlatformUsage('claimReward', txHash);
        }
        
        return anySuccess;
        
    } catch (e) {
        console.error("Universal claim error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// BUY NFT - OPTIMIZED
// ====================================================================

export async function executeBuyNFT(poolAddress, maxPrice, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Buy';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Checking...');
    
    try {
        // Get current price from pool
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        
        let currentPrice;
        try {
            currentPrice = await poolContract.getBuyPriceWithTax();
        } catch (e) {
            currentPrice = await poolContract.getBuyPrice();
        }
        
        // Add slippage tolerance
        const priceWithSlippage = currentPrice + (currentPrice * BigInt(TX_CONFIG.SLIPPAGE_BIPS) / 10000n);
        const finalMaxPrice = maxPrice && BigInt(maxPrice) > priceWithSlippage 
            ? BigInt(maxPrice) 
            : priceWithSlippage;
        
        // Pre-flight check
        const preflight = await preFlightCheck({
            requiredBKC: finalMaxPrice,
            spenderAddress: poolAddress,
            actionName: 'buy NFT'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return { success: false };
        }
        
        // Approve
        if (preflight.adjustments.needsApproval) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            const approved = await smartApprove(addresses.bkcToken, poolAddress, finalMaxPrice, signer);
            if (!approved) return { success: false };
        }
        
        updateButton('<div class="loader inline-block"></div> Buying...');
        
        const result = await executeWithAutoAdjust(
            () => poolContract.buyNFTWithSlippage(finalMaxPrice),
            {
                description: 'Buy NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm purchase...", "info");
                }
            }
        );
        
        if (result.success) {
            let tokenId = null;
            for (const log of result.receipt.logs) {
                try {
                    const parsed = poolContract.interface.parseLog(log);
                    if (parsed?.name === "NFTPurchased") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast(`✅ NFT${tokenId ? ` #${tokenId}` : ''} purchased!`, "success");
            loadUserData();
            trackPlatformUsage('buyNFT', result.txHash);
            
            return { success: true, tokenId, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Buy NFT error:", e);
        handleTransactionError(e);
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// SELL NFT - OPTIMIZED
// ====================================================================

export async function executeSellNFT(poolAddress, tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Sell';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        // Validate tokenId
        let validTokenId = tokenId;
        if (typeof tokenId === 'object' && tokenId !== null) {
            validTokenId = tokenId.tokenId || tokenId.id;
        }
        
        if (!validTokenId) {
            showToast("Invalid NFT token ID", "error");
            return { success: false };
        }
        
        validTokenId = BigInt(validTokenId);
        
        // Pre-flight check
        const preflight = await preFlightCheck({ actionName: 'sell NFT' });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return { success: false };
        }
        
        // Approve NFT
        const nftABI = ["function approve(address,uint256)", "function getApproved(uint256) view returns (address)"];
        const nftContract = new ethers.Contract(addresses.rewardBoosterNFT, nftABI, signer);
        
        const approved = await nftContract.getApproved(validTokenId);
        if (approved.toLowerCase() !== poolAddress.toLowerCase()) {
            updateButton('<div class="loader inline-block"></div> Approving NFT...');
            showToast("Approving NFT...", "info");
            const approveTx = await nftContract.approve(poolAddress, validTokenId);
            await approveTx.wait();
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        }
        
        // Get minimum payout with slippage protection
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer);
        let sellPrice;
        try {
            sellPrice = await poolContract.getSellPriceAfterTax();
        } catch {
            sellPrice = await poolContract.getSellPrice();
        }
        
        const minPayout = sellPrice - (sellPrice * BigInt(TX_CONFIG.SLIPPAGE_BIPS) / 10000n);
        
        updateButton('<div class="loader inline-block"></div> Selling...');
        
        const result = await executeWithAutoAdjust(
            () => poolContract.sellNFT(validTokenId, minPayout),
            {
                description: 'Sell NFT',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm sale...", "info");
                }
            }
        );
        
        if (result.success) {
            showToast("✅ NFT sold!", "success");
            loadUserData();
            trackPlatformUsage('sellNFT', result.txHash);
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Sell NFT error:", e);
        handleTransactionError(e);
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// FORTUNE POOL V2 - OPTIMIZED
// ====================================================================

const fortunePoolV2ABI = [
    "function play(uint256 _wagerAmount, uint256[] calldata _guesses, bool _isCumulative) external payable",
    "function prizePoolBalance() external view returns (uint256)",
    "function activeTierCount() external view returns (uint256)",
    "function getRequiredServiceFee(bool _isCumulative) external view returns (uint256)",
    "function prizeTiers(uint256) external view returns (uint128 maxRange, uint64 multiplierBips, bool active)",
    "event GamePlayed(uint256 indexed gameId, address indexed player, uint256 wagerAmount, uint256 prizeWon, bool isCumulative, uint8 matchCount)",
    "event GameDetails(uint256 indexed gameId, uint256[] guesses, uint256[] rolls, bool[] matches)",
    "event JackpotWon(uint256 indexed gameId, address indexed player, uint256 prizeAmount, uint256 tier)"
];

export async function executeFortunePlay(wager, guesses, isCumulative, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Play';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Checking...');
    
    try {
        const wagerBigInt = ethers.parseEther(wager.toString());
        const guessesArray = Array.isArray(guesses) ? guesses.map(g => BigInt(g)) : [BigInt(guesses)];
        
        const fortuneAddress = addresses.fortunePoolV2 || addresses.fortunePool;
        if (!fortuneAddress) {
            showToast("Fortune Pool not configured", "error");
            return { success: false };
        }
        
        const fortuneContract = new ethers.Contract(fortuneAddress, fortunePoolV2ABI, signer);
        
        // Get required service fee (ETH)
        let requiredFee = 0n;
        try {
            requiredFee = await fortuneContract.getRequiredServiceFee(isCumulative);
        } catch (e) {
            console.warn("Could not get service fee:", e.message);
        }
        
        // Validate guesses against tiers
        try {
            const tierCount = await fortuneContract.activeTierCount();
            const expectedGuesses = isCumulative ? Number(tierCount) : 1;
            
            if (guessesArray.length !== expectedGuesses) {
                showToast(`Need ${expectedGuesses} guess(es) for ${isCumulative ? 'Combo' : 'Jackpot'} mode`, "error");
                return { success: false };
            }
            
            // Validate each guess is within range
            for (let i = 0; i < guessesArray.length; i++) {
                const tierId = isCumulative ? i + 1 : Number(tierCount);
                const tier = await fortuneContract.prizeTiers(tierId);
                const maxRange = Number(tier.maxRange);
                
                if (guessesArray[i] < 1n || guessesArray[i] > BigInt(maxRange)) {
                    showToast(`Guess ${i + 1} must be between 1 and ${maxRange}`, "error");
                    return { success: false };
                }
            }
        } catch (e) {
            console.warn("Could not validate tiers:", e.message);
        }
        
        // Pre-flight check
        const preflight = await preFlightCheck({
            requiredBKC: wagerBigInt,
            requiredETH: requiredFee,
            spenderAddress: fortuneAddress,
            actionName: 'play fortune'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return { success: false };
        }
        
        // Use adjusted wager if needed
        const finalWager = preflight.adjustments.adjustedBKC || wagerBigInt;
        
        // Approve
        if (preflight.adjustments.needsApproval) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            const approved = await smartApprove(addresses.bkcToken, fortuneAddress, finalWager, signer);
            if (!approved) return { success: false };
        }
        
        updateButton('<div class="loader inline-block"></div> 🎰 Rolling...');
        
        const result = await executeWithAutoAdjust(
            () => fortuneContract.play(finalWager, guessesArray, isCumulative, { value: requiredFee }),
            {
                description: 'Fortune Game',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("🎰 Confirm your bet...", "info");
                }
            }
        );
        
        if (result.success) {
            // Parse results
            let gameId = null, rolls = [], prizeWon = 0, matches = [], matchCount = 0, isJackpot = false;
            
            for (const log of result.receipt.logs) {
                try {
                    const parsed = fortuneContract.interface.parseLog({ topics: log.topics, data: log.data });
                    
                    if (parsed?.name === "GamePlayed") {
                        gameId = Number(parsed.args.gameId);
                        prizeWon = Number(ethers.formatEther(parsed.args.prizeWon));
                        matchCount = Number(parsed.args.matchCount);
                    }
                    if (parsed?.name === "GameDetails") {
                        rolls = parsed.args.rolls.map(r => Number(r));
                        matches = Array.from(parsed.args.matches);
                    }
                    if (parsed?.name === "JackpotWon") {
                        isJackpot = true;
                    }
                } catch {}
            }
            
            // Show result
            if (prizeWon > 0) {
                if (isJackpot) {
                    showToast(`🎰🎰🎰 JACKPOT! +${prizeWon.toLocaleString()} BKC! 🎉`, "success");
                } else {
                    showToast(`🎉 YOU WON ${prizeWon.toLocaleString()} BKC!`, "success");
                }
            } else {
                showToast("No match this time. Try again!", "warning");
            }
            
            loadUserData();
            trackPlatformUsage('fortune', result.txHash);
            
            return {
                success: true,
                gameId, rolls, guesses: guessesArray.map(g => Number(g)),
                prizeWon, matches, matchCount, isJackpot, isCumulative,
                txHash: result.txHash
            };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Fortune error:", e);
        handleTransactionError(e);
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// NOTARIZE DOCUMENT - OPTIMIZED
// ====================================================================

export async function executeNotarize(params, submitButton) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const originalText = submitButton?.innerHTML || 'Notarize';
    const updateButton = (text) => {
        if (submitButton) {
            submitButton.innerHTML = text;
            submitButton.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        const { ipfsUri, contentHash, description } = params;
        const notaryAddress = addresses.decentralizedNotary || addresses.notary;
        
        if (!notaryAddress) {
            showToast("Notary contract not configured", "error");
            return false;
        }
        
        // Get fee
        let feeToPay = ethers.parseEther("1");
        try {
            const notaryRead = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer.provider);
            feeToPay = await notaryRead.calculateFee(0);
        } catch {}
        
        // Pre-flight check
        const preflight = await preFlightCheck({
            requiredBKC: feeToPay,
            spenderAddress: notaryAddress,
            actionName: 'notarize'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return false;
        }
        
        // Approve
        if (preflight.adjustments.needsApproval) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            const approved = await smartApprove(addresses.bkcToken, notaryAddress, feeToPay, signer);
            if (!approved) return false;
        }
        
        updateButton('<div class="loader inline-block"></div> Notarizing...');
        
        const notaryContract = new ethers.Contract(notaryAddress, decentralizedNotaryABI, signer);
        
        // Get booster for discount
        let boosterTokenId = 0n;
        try {
            const boosterInfo = await getHighestBoosterBoostFromAPI();
            if (boosterInfo?.tokenId) {
                boosterTokenId = BigInt(boosterInfo.tokenId);
            }
        } catch {}
        
        const result = await executeWithAutoAdjust(
            () => notaryContract.notarize(ipfsUri, description || '', contentHash, boosterTokenId),
            {
                description: 'Notarize',
                onAttempt: (attempt) => {
                    if (attempt === 1) showToast("Confirm notarization...", "info");
                }
            }
        );
        
        if (result.success) {
            let tokenId = null;
            for (const log of result.receipt.logs) {
                try {
                    const parsed = notaryContract.interface.parseLog(log);
                    if (parsed?.name === "DocumentNotarized") {
                        tokenId = parsed.args.tokenId?.toString();
                        break;
                    }
                } catch {}
            }
            
            showToast(`✅ Document notarized!${tokenId ? ` #${tokenId}` : ''}`, "success");
            trackPlatformUsage('notarize', result.txHash);
            
            return { success: true, tokenId, txHash: result.txHash };
        }
        
        return false;
        
    } catch (e) {
        console.error("Notarize error:", e);
        handleTransactionError(e);
        return false;
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// RENTAL - LIST NFT
// ====================================================================

export async function executeListNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'List';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        const { tokenId, pricePerHour, minHours, maxHours } = params;
        const rentalAddress = addresses.rentalManager;
        
        if (!rentalAddress) {
            showToast("Rental Manager not configured", "error");
            return { success: false };
        }
        
        const preflight = await preFlightCheck({ actionName: 'list rental' });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return { success: false };
        }
        
        // Approve NFT for rental
        const nftABI = [
            "function setApprovalForAll(address,bool)",
            "function isApprovedForAll(address,address) view returns (bool)"
        ];
        const nftContract = new ethers.Contract(addresses.rewardBoosterNFT, nftABI, signer);
        
        const isApproved = await nftContract.isApprovedForAll(State.userAddress, rentalAddress);
        if (!isApproved) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            showToast("Approving NFTs for rental...", "info");
            const approveTx = await nftContract.setApprovalForAll(rentalAddress, true);
            await approveTx.wait();
            await sleep(TX_CONFIG.APPROVAL_WAIT_MS);
        }
        
        updateButton('<div class="loader inline-block"></div> Listing...');
        
        const rentalContract = new ethers.Contract(rentalAddress, rentalManagerABI, signer);
        
        const result = await executeWithAutoAdjust(
            () => rentalContract.listNFT(
                BigInt(tokenId),
                BigInt(pricePerHour),
                BigInt(minHours),
                BigInt(maxHours)
            ),
            {
                description: 'List NFT',
                onAttempt: () => showToast("Confirm listing...", "info")
            }
        );
        
        if (result.success) {
            showToast(`✅ NFT #${tokenId} listed!`, "success");
            loadRentalListings(true);
            trackPlatformUsage('listRental', result.txHash);
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("List NFT error:", e);
        handleTransactionError(e);
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// RENTAL - RENT NFT
// ====================================================================

export async function executeRentNFT(params, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return { success: false };
    
    const originalText = btnElement?.innerHTML || 'Rent';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Processing...');
    
    try {
        const { tokenId, hours, totalCost } = params;
        const rentalAddress = addresses.rentalManager;
        
        if (!rentalAddress) {
            showToast("Rental Manager not configured", "error");
            return { success: false };
        }
        
        const costBigInt = BigInt(totalCost);
        
        const preflight = await preFlightCheck({
            requiredBKC: costBigInt,
            spenderAddress: rentalAddress,
            actionName: 'rent NFT'
        });
        
        if (!preflight.canProceed) {
            preflight.issues.forEach(issue => showToast(issue, "error"));
            return { success: false };
        }
        
        if (preflight.adjustments.needsApproval) {
            updateButton('<div class="loader inline-block"></div> Approving...');
            const approved = await smartApprove(addresses.bkcToken, rentalAddress, costBigInt, signer);
            if (!approved) return { success: false };
        }
        
        updateButton('<div class="loader inline-block"></div> Renting...');
        
        const rentalContract = new ethers.Contract(rentalAddress, rentalManagerABI, signer);
        
        const result = await executeWithAutoAdjust(
            () => rentalContract.rent(BigInt(tokenId), BigInt(hours)),
            {
                description: 'Rent NFT',
                onAttempt: () => showToast("Confirm rental...", "info")
            }
        );
        
        if (result.success) {
            showToast(`✅ NFT #${tokenId} rented for ${hours}h!`, "success");
            loadRentalListings(true);
            loadUserData();
            trackPlatformUsage('rentNFT', result.txHash);
            return { success: true, txHash: result.txHash };
        }
        
        return { success: false };
        
    } catch (e) {
        console.error("Rent NFT error:", e);
        handleTransactionError(e);
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// FAUCET - VIA API
// ====================================================================

const FAUCET_API_URL = "https://faucet-4wvdcuoouq-uc.a.run.app";

export async function executeFaucetClaim(btnElement) {
    if (!State.isConnected || !State.userAddress) {
        showToast("Please connect wallet first", "error");
        return { success: false };
    }
    
    const originalText = btnElement?.innerHTML || 'Claim';
    const updateButton = (text) => {
        if (btnElement) {
            btnElement.innerHTML = text;
            btnElement.disabled = text !== originalText;
        }
    };
    
    updateButton('<div class="loader inline-block"></div> Claiming...');
    
    try {
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(`✅ Received ${data.bkcAmount || '20'} BKC!`, "success");
            loadUserData();
            
            if (data.txHash) {
                trackPlatformUsage('faucet', data.txHash);
            }
            
            return {
                success: true,
                txHash: data.txHash,
                bkcAmount: data.bkcAmount,
                ethAmount: data.ethAmount
            };
        } else {
            const msg = data.error || "Faucet unavailable";
            showToast(msg, "error");
            return { success: false, error: msg };
        }
        
    } catch (e) {
        console.error("Faucet error:", e);
        showToast("Faucet unavailable", "error");
        return { success: false };
    } finally {
        updateButton(originalText);
    }
}

// ====================================================================
// ALIASES
// ====================================================================

export const executeNotarizeDocument = executeNotarize;
export const executeBuyBooster = executeBuyNFT;
export const executeSellBooster = executeSellNFT;
export const executeFortuneGame = executeFortunePlay;
export const executeFortuneParticipate = executeFortunePlay;

// Legacy support
export { smartApprove as robustApprove };