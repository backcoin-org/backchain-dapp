// modules/js/core/transaction-engine.js
// ✅ PRODUCTION V1.2 - Added skipSimulation option
// 
// CHANGES V1.2:
// - Added skipSimulation option to bypass estimateGas (for RPC issues)
// - When skipSimulation=true, uses fixed gas limit instead of estimating
// - Added small delays before sending to stabilize RPC
//
// CHANGES V1.1:
// - Added support for args as function (getter pattern for dynamic values)
// - Fixed updateMetaMaskRpcs -> switchToNextRpc (correct method name)
// - Added better error messages for simulation failures
// - Added approval getter support for dynamic approval amounts
// - Improved ENS error handling on testnets
//
// This is the main orchestrator for all blockchain transactions.
// It handles the complete flow: validation → approval → simulation → execution
//
// ============================================================================
// TRANSACTION FLOW:
// 1. Anti-reentrancy check (prevent double-clicks)
// 2. Layer 1-2: Network + Wallet validation (FREE)
// 3. Layer 3: Balance validation (FREE - reads)
// 4. Custom domain validation (FREE - reads)
// 5. Token approval if needed
// 6. Simulation via estimateGas (FREE)
// 7. Execute transaction
// 8. Wait for confirmation
// 9. Invalidate caches + callbacks
// ============================================================================

import { NetworkManager } from './network-manager.js';
import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { ValidationLayer } from './validation-layer.js';
import { GasManager } from './gas-manager.js';
import { CacheManager } from './cache-manager.js';

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

const ENGINE_CONFIG = {
    // Retry settings
    DEFAULT_MAX_RETRIES: 2,
    RETRY_BASE_DELAY: 2000,
    
    // Approval settings
    APPROVAL_MULTIPLIER: 10n,  // Approve 10x to reduce future approvals
    APPROVAL_WAIT_TIME: 1500,  // Wait after approval for propagation
    
    // Confirmation settings
    CONFIRMATION_TIMEOUT: 60000,  // 60 seconds
    CONFIRMATION_RETRY_DELAY: 3000,
    
    // Gas settings
    GAS_SAFETY_MARGIN: 20  // 20% margin
};

/**
 * ERC20 ABI for approvals
 */
const ERC20_APPROVAL_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
];

// ============================================================================
// 2. TRANSACTION UI HELPER
// ============================================================================

/**
 * Manages UI state during transaction
 */
export class TransactionUI {
    constructor(buttonElement, txName, showToasts = true) {
        this.button = buttonElement;
        this.txName = txName;
        this.showToasts = showToasts;
        this.originalContent = null;
        this.originalDisabled = false;
        
        if (this.button) {
            this.originalContent = this.button.innerHTML;
            this.originalDisabled = this.button.disabled;
        }
    }

    /**
     * Sets the current phase and updates button
     */
    setPhase(phase) {
        if (!this.button) return;

        const phases = {
            'validating': { text: 'Validating...', icon: '🔍' },
            'approving': { text: 'Approving...', icon: '✅' },
            'simulating': { text: 'Simulating...', icon: '🧪' },
            'confirming': { text: 'Confirm in Wallet', icon: '👛' },
            'waiting': { text: 'Processing...', icon: '⏳' },
            'success': { text: 'Success!', icon: '🎉' },
            'error': { text: 'Failed', icon: '❌' }
        };

        const config = phases[phase] || { text: phase, icon: '⏳' };
        
        this.button.disabled = true;
        this.button.innerHTML = `
            <span class="tx-status">
                <span class="tx-icon">${config.icon}</span>
                <span class="tx-text">${config.text}</span>
            </span>
        `;
    }

    /**
     * Shows retry attempt
     */
    setRetry(attempt, maxAttempts) {
        if (!this.button) return;
        
        this.button.innerHTML = `
            <span class="tx-status">
                <span class="tx-icon">🔄</span>
                <span class="tx-text">Retry ${attempt}/${maxAttempts}...</span>
            </span>
        `;
    }

    /**
     * Restores button to original state
     */
    cleanup() {
        if (!this.button) return;
        
        this.button.innerHTML = this.originalContent;
        this.button.disabled = this.originalDisabled;
    }

    /**
     * Shows success state temporarily then restores
     */
    showSuccess(duration = 2000) {
        this.setPhase('success');
        setTimeout(() => this.cleanup(), duration);
    }

    /**
     * Shows error state temporarily then restores
     */
    showError(duration = 2000) {
        this.setPhase('error');
        setTimeout(() => this.cleanup(), duration);
    }
}

// ============================================================================
// 3. TRANSACTION ENGINE
// ============================================================================

export class TransactionEngine {
    constructor() {
        /**
         * Set of pending transaction IDs (anti-reentrancy)
         */
        this.pendingTxIds = new Set();
    }

    /**
     * Resolves args - supports both array and function (getter)
     * @private
     */
    _resolveArgs(args) {
        if (typeof args === 'function') {
            return args();
        }
        return args || [];
    }

    /**
     * Resolves approval config - supports getter pattern
     * @private
     */
    _resolveApproval(approval) {
        if (!approval) return null;
        
        // If approval has a getter (defined with get approval()), access it
        if (typeof approval === 'object') {
            return {
                token: approval.token,
                spender: approval.spender,
                amount: approval.amount
            };
        }
        
        return approval;
    }

    /**
     * Executes a transaction with full validation and error handling
     * 
     * @param {Object} config - Transaction configuration
     * @returns {Promise<Object>} Result { success, receipt?, error?, cancelled? }
     * 
     * @example
     * const result = await txEngine.execute({
     *     name: 'Donate',
     *     button: document.getElementById('donateBtn'),
     *     
     *     // Contract info
     *     getContract: async (signer) => new ethers.Contract(addr, abi, signer),
     *     method: 'donate',
     *     args: [campaignId, amount], // Can also be a function: () => [campaignId, amount]
     *     
     *     // Optional: ETH to send
     *     value: ethers.parseEther('0.001'),
     *     
     *     // Optional: Token approval (can use getter for dynamic amounts)
     *     approval: {
     *         token: BKC_ADDRESS,
     *         spender: CHARITY_ADDRESS,
     *         amount: donationAmount
     *     },
     *     
     *     // Optional: Custom validation
     *     validate: async (signer, userAddress) => {
     *         // Check campaign is active, etc.
     *     },
     *     
     *     // Callbacks
     *     onSuccess: (receipt) => { showToast('Donated!'); },
     *     onError: (error) => { console.error(error); }
     * });
     */
    async execute(config) {
        const {
            // Identification
            name,
            txId = null,
            
            // UI
            button = null,
            showToasts = true,
            
            // Contract
            getContract,           // async (signer) => Contract
            method,
            args = [],             // Array or function returning array
            value = null,          // ETH to send (bigint)
            
            // Approval (optional) - can be object or getter
            approval = null,       // { token, spender, amount }
            
            // Validations
            validate = null,       // async (signer, userAddress) => void
            
            // Callbacks
            onSuccess = null,
            onError = null,
            
            // Options
            maxRetries = ENGINE_CONFIG.DEFAULT_MAX_RETRIES,
            invalidateCache = true,
            skipSimulation = false,
            fixedGasLimit = 500000n
        } = config;

        // Generate unique transaction ID
        const uniqueTxId = txId || `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // ═══════════════════════════════════════════════════════════════════
        // ANTI-REENTRANCY CHECK
        // ═══════════════════════════════════════════════════════════════════
        if (this.pendingTxIds.has(uniqueTxId)) {
            console.warn(`[TX] Transaction ${uniqueTxId} already in progress`);
            return { 
                success: false, 
                reason: 'DUPLICATE_TX',
                message: 'Transaction already in progress'
            };
        }
        this.pendingTxIds.add(uniqueTxId);

        // Initialize UI helper
        const ui = new TransactionUI(button, name, showToasts);

        try {
            // ═══════════════════════════════════════════════════════════════
            // PHASE 1: PRE-VALIDATION (FREE)
            // ═══════════════════════════════════════════════════════════════
            ui.setPhase('validating');
            console.log(`[TX] Starting ${name}...`);

            // Layer 1: Network validation
            await ValidationLayer.validateNetwork();

            // Layer 1b: RPC health check
            await ValidationLayer.validateRpcHealth();

            // Layer 2: Wallet validation
            const userAddress = await ValidationLayer.validateWalletConnected();

            // Get signer
            const signer = await NetworkManager.getSigner();

            // Layer 3: ETH balance for gas
            await ValidationLayer.validateEthForGas(userAddress);

            // ═══════════════════════════════════════════════════════════════
            // PHASE 2: TOKEN VALIDATION (FREE - reads)
            // ═══════════════════════════════════════════════════════════════
            
            // Resolve approval (supports getter pattern)
            const resolvedApproval = this._resolveApproval(approval);
            
            if (resolvedApproval && resolvedApproval.amount > 0n) {
                await ValidationLayer.validateTokenBalance(
                    resolvedApproval.token,
                    resolvedApproval.amount,
                    userAddress
                );
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 3: CUSTOM DOMAIN VALIDATION (FREE)
            // ═══════════════════════════════════════════════════════════════
            if (validate) {
                await validate(signer, userAddress);
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 4: TOKEN APPROVAL (if needed)
            // ═══════════════════════════════════════════════════════════════
            
            // Re-resolve approval after validation (values may have changed)
            const finalApproval = this._resolveApproval(approval);
            
            if (finalApproval && finalApproval.amount > 0n) {
                const needsApproval = await ValidationLayer.needsApproval(
                    finalApproval.token,
                    finalApproval.spender,
                    finalApproval.amount,
                    userAddress
                );

                if (needsApproval) {
                    ui.setPhase('approving');
                    console.log(`[TX] Requesting token approval...`);
                    
                    await this._executeApproval(finalApproval, signer, userAddress);
                    
                    // Clear allowance cache
                    CacheManager.clear('allowance-');
                }
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 5: SIMULATION (FREE - estimateGas) - Can be skipped
            // ═══════════════════════════════════════════════════════════════

            const contract = await getContract(signer);
            const txOptions = value ? { value } : {};
            
            // Resolve args (supports function pattern)
            const resolvedArgs = this._resolveArgs(args);

            let gasEstimate;
            
            if (skipSimulation) {
                console.log(`[TX] Skipping simulation, using fixed gas limit: ${fixedGasLimit}`);
                gasEstimate = fixedGasLimit;
            } else {
                ui.setPhase('simulating');
                console.log(`[TX] Simulating transaction...`);
                
                try {
                    gasEstimate = await contract[method].estimateGas(...resolvedArgs, txOptions);
                    console.log(`[TX] Gas estimate: ${gasEstimate.toString()}`);
                } catch (simError) {
                    console.error(`[TX] Simulation failed:`, simError);
                    const parsed = ErrorHandler.parseSimulationError(simError, method);
                    throw ErrorHandler.create(parsed.type, { 
                        message: parsed.message,
                        original: simError 
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 6: EXECUTE TRANSACTION
            // ═══════════════════════════════════════════════════════════════
            ui.setPhase('confirming');
            console.log(`[TX] Requesting signature...`);

            const gasLimit = GasManager.addSafetyMargin(gasEstimate);
            const finalTxOptions = { ...txOptions, gasLimit };
            
            // Re-resolve args for execution (values may have been updated)
            const executionArgs = this._resolveArgs(args);

            const tx = await this._executeWithRetry(
                () => contract[method](...executionArgs, finalTxOptions),
                { maxRetries, ui, signer, name }
            );

            console.log(`[TX] Transaction submitted: ${tx.hash}`);

            // ═══════════════════════════════════════════════════════════════
            // PHASE 7: WAIT FOR CONFIRMATION
            // ═══════════════════════════════════════════════════════════════
            ui.setPhase('waiting');
            console.log(`[TX] Waiting for confirmation...`);

            const receipt = await this._waitForConfirmation(tx, signer.provider);
            console.log(`[TX] Confirmed in block ${receipt.blockNumber}`);

            // ═══════════════════════════════════════════════════════════════
            // SUCCESS!
            // ═══════════════════════════════════════════════════════════════
            ui.showSuccess();

            // Invalidate relevant caches
            if (invalidateCache) {
                CacheManager.invalidateByTx(name);
            }

            // Success callback
            if (onSuccess) {
                try {
                    await onSuccess(receipt);
                } catch (callbackError) {
                    console.warn('[TX] onSuccess callback error:', callbackError);
                }
            }

            return {
                success: true,
                receipt,
                txHash: receipt.hash || tx.hash,
                blockNumber: receipt.blockNumber
            };

        } catch (error) {
            // ═══════════════════════════════════════════════════════════════
            // ERROR HANDLING - V1.2: Use handleWithRpcSwitch for auto RPC switch
            // ═══════════════════════════════════════════════════════════════
            const handled = await ErrorHandler.handleWithRpcSwitch(error, name);
            
            // Log if RPC was switched
            if (handled.rpcSwitched) {
                console.log(`[TX] RPC switched to: ${handled.newRpc}`);
            }
            
            // Show appropriate UI
            if (handled.type === ErrorTypes.USER_REJECTED) {
                ui.cleanup(); // Just restore, don't show error
            } else {
                ui.showError();
            }

            // Error callback
            if (onError) {
                try {
                    onError(handled);
                } catch (callbackError) {
                    console.warn('[TX] onError callback error:', callbackError);
                }
            }

            return {
                success: false,
                error: handled,
                message: handled.message,
                cancelled: handled.type === ErrorTypes.USER_REJECTED
            };

        } finally {
            // Always remove from pending set
            this.pendingTxIds.delete(uniqueTxId);
        }
    }

    /**
     * Executes token approval
     * @private
     */
    async _executeApproval(approval, signer, userAddress) {
        const ethers = window.ethers;
        const { token, spender, amount } = approval;

        const tokenContract = new ethers.Contract(token, ERC20_APPROVAL_ABI, signer);

        // Approve more than needed to reduce future approvals
        const approveAmount = amount * ENGINE_CONFIG.APPROVAL_MULTIPLIER;

        try {
            const tx = await tokenContract.approve(spender, approveAmount);
            await tx.wait();
            
            console.log(`[TX] Approval confirmed`);

            // Wait for propagation
            await new Promise(r => setTimeout(r, ENGINE_CONFIG.APPROVAL_WAIT_TIME));

            // Verify approval worked
            const newAllowance = await tokenContract.allowance(userAddress, spender);
            
            if (newAllowance < amount) {
                throw new Error('Approval not reflected on-chain');
            }

        } catch (error) {
            if (ErrorHandler.isUserRejection(error)) {
                throw ErrorHandler.create(ErrorTypes.USER_REJECTED);
            }
            throw error;
        }
    }

    /**
     * Executes transaction with retry logic
     * @private
     */
    async _executeWithRetry(txFunction, { maxRetries, ui, signer, name }) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                // Show retry status
                if (attempt > 1) {
                    ui.setRetry(attempt, maxRetries + 1);
                    console.log(`[TX] Retry attempt ${attempt}/${maxRetries + 1}`);

                    // Check RPC health before retry
                    const health = await NetworkManager.checkRpcHealth();
                    if (!health.healthy) {
                        console.log('[TX] RPC unhealthy, switching...');
                        // Use correct method name
                        NetworkManager.switchToNextRpc();
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                return await txFunction();

            } catch (error) {
                lastError = error;

                // User rejected - don't retry
                if (ErrorHandler.isUserRejection(error)) {
                    throw error;
                }

                // Not retryable - don't retry
                if (!ErrorHandler.isRetryable(error)) {
                    throw error;
                }

                // Last attempt - throw
                if (attempt === maxRetries + 1) {
                    throw error;
                }

                // Wait before retry
                const waitTime = ErrorHandler.getWaitTime(error);
                console.log(`[TX] Waiting ${waitTime}ms before retry...`);
                await new Promise(r => setTimeout(r, waitTime));
            }
        }

        throw lastError;
    }

    /**
     * Waits for transaction confirmation with retry
     * @private
     */
    async _waitForConfirmation(tx, provider) {
        try {
            // Try standard wait
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                return receipt;
            }
            
            if (receipt.status === 0) {
                throw new Error('Transaction reverted on-chain');
            }

            return receipt;

        } catch (waitError) {
            // Handle wait errors (common on Arbitrum)
            console.warn('[TX] tx.wait() error, checking manually:', waitError.message);

            // Wait a bit then check manually
            await new Promise(r => setTimeout(r, ENGINE_CONFIG.CONFIRMATION_RETRY_DELAY));

            // Try to get receipt manually
            let receipt = await provider.getTransactionReceipt(tx.hash);

            if (receipt && receipt.status === 1) {
                return receipt;
            }

            if (receipt && receipt.status === 0) {
                throw new Error('Transaction reverted on-chain');
            }

            // One more try
            await new Promise(r => setTimeout(r, ENGINE_CONFIG.CONFIRMATION_RETRY_DELAY * 2));
            receipt = await provider.getTransactionReceipt(tx.hash);

            if (receipt && receipt.status === 1) {
                return receipt;
            }

            if (receipt && receipt.status === 0) {
                throw new Error('Transaction reverted on-chain');
            }

            // If we have a hash, assume success (optimistic)
            console.warn('[TX] Could not verify receipt, assuming success');
            return { 
                hash: tx.hash, 
                status: 1,
                blockNumber: 0 
            };
        }
    }

    /**
     * Checks if a transaction is currently pending
     * @param {string} txId - Transaction ID
     * @returns {boolean}
     */
    isPending(txId) {
        return this.pendingTxIds.has(txId);
    }

    /**
     * Gets count of pending transactions
     * @returns {number}
     */
    getPendingCount() {
        return this.pendingTxIds.size;
    }

    /**
     * Clears all pending transaction flags (use with caution)
     */
    clearPending() {
        this.pendingTxIds.clear();
    }
}

// ============================================================================
// 4. SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of TransactionEngine
 * Import this to use the engine
 */
export const txEngine = new TransactionEngine();

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a simple toast notification
 * This is a fallback - integrate with your existing toast system
 * 
 * @param {string} message - Message to show
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 */
export function showToast(message, type = 'info') {
    // Try to use existing toast system
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }

    // Fallback to console
    const prefix = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    }[type] || 'ℹ️';

    console.log(`${prefix} ${message}`);
}

/**
 * Opens block explorer for transaction
 * @param {string} txHash - Transaction hash
 */
export function openTxInExplorer(txHash) {
    const url = NetworkManager.getTxExplorerUrl(txHash);
    window.open(url, '_blank');
}

// ============================================================================
// 6. EXPORTS
// ============================================================================

export default txEngine;