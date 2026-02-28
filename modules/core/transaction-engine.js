// modules/js/core/transaction-engine.js
// ✅ PRODUCTION V2.0 - Zero MetaMask RPC reads
//
// CHANGES V2.0:
// - ALL read calls (estimateGas, getFeeData, waitForConfirmation) use Alchemy
// - MetaMask is ONLY used for signing transactions (approve + execute)
// - Approval uses fixed gasLimit (100k) to avoid estimateGas through MetaMask
// - Main tx estimateGas uses public provider with from: userAddress
// - _waitForConfirmation polls Alchemy directly (no tx.wait())
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
    GAS_SAFETY_MARGIN: 20,  // 20% margin
    DEFAULT_GAS_LIMIT: 500000n  // Fallback gas limit
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
     * V1.5: Validates that the contract has the required method
     * @private
     */
    _validateContractMethod(contract, method) {
        if (!contract) {
            throw new Error('Contract instance is null or undefined');
        }
        
        if (typeof contract[method] !== 'function') {
            // Get available methods for debugging
            const availableMethods = Object.keys(contract)
                .filter(key => typeof contract[key] === 'function')
                .filter(key => !key.startsWith('_') && !['on', 'once', 'emit', 'removeListener'].includes(key))
                .slice(0, 15);
            
            console.error(`[TX] Contract method "${method}" not found!`);
            console.error('[TX] Available methods:', availableMethods);
            
            throw new Error(
                `Contract method "${method}" not found. ` +
                `This usually means the ABI doesn't match the contract. ` +
                `Available methods: ${availableMethods.join(', ')}`
            );
        }
        
        // Also check estimateGas is available
        if (typeof contract[method].estimateGas !== 'function') {
            console.warn(`[TX] Method ${method} exists but estimateGas is not available`);
        }
        
        return true;
    }

    /**
     * Executes a transaction with full validation and error handling
     * 
     * @param {Object} config - Transaction configuration
     * @returns {Promise<Object>} Result { success, receipt?, error?, cancelled? }
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
            // value is accessed via config.value to preserve getter
            
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
            fixedGasLimit = ENGINE_CONFIG.DEFAULT_GAS_LIMIT
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
            console.log(`[TX] Starting: ${name}`);

            // Layer 1: Network validation
            await ValidationLayer.validateNetwork();

            // Layer 1b: RPC health check
            await ValidationLayer.validateRpcHealth();

            // Layer 2: Wallet validation
            const userAddress = await ValidationLayer.validateWalletConnected();
            console.log(`[TX] User address: ${userAddress}`);

            // Get signer
            const signer = await NetworkManager.getSigner();
            console.log(`[TX] Signer obtained`);

            // Layer 3: ETH balance for gas
            try {
                await ValidationLayer.validateEthForGas(userAddress);
            } catch (gasError) {
                console.warn('[TX] ETH gas validation failed, continuing anyway:', gasError.message);
                // Don't throw - let the transaction try and potentially fail with a clearer error
            }

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
                console.log(`[TX] Running custom validation...`);
                await validate(signer, userAddress);
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 4: TOKEN APPROVAL (if needed)
            // ═══════════════════════════════════════════════════════════════
            
            // V1.8: Access config.approval directly to re-evaluate getter (same fix as config.value)
            const finalApproval = this._resolveApproval(config.approval);
            
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
            // PHASE 5: GET CONTRACT & VALIDATE METHOD
            // ═══════════════════════════════════════════════════════════════
            console.log(`[TX] Getting contract instance...`);
            const contract = await getContract(signer);
            
            // V1.5: Validate the contract has the method
            this._validateContractMethod(contract, method);
            console.log(`[TX] Contract method "${method}" validated`);

            // ═══════════════════════════════════════════════════════════════
            // PHASE 6: SIMULATION (FREE - estimateGas) - Can be skipped
            // ═══════════════════════════════════════════════════════════════

            // V1.4 FIX: Access value from config to preserve getter
            const txValue = config.value;
            if (txValue) {
                console.log(`[TX] Transaction value (ETH):`, txValue.toString());
            }
            
            const txOptions = txValue ? { value: txValue } : {};
            
            // Resolve args (supports function pattern)
            const resolvedArgs = this._resolveArgs(args);
            console.log(`[TX] Args resolved:`, resolvedArgs.map(a => 
                typeof a === 'bigint' ? a.toString() : 
                typeof a === 'string' && a.length > 50 ? a.substring(0, 50) + '...' : a
            ));

            let gasEstimate;
            
            if (skipSimulation) {
                console.log(`[TX] Skipping simulation, using fixed gas limit: ${fixedGasLimit}`);
                gasEstimate = fixedGasLimit;
            } else {
                ui.setPhase('simulating');
                console.log(`[TX] Simulating transaction...`);

                try {
                    // V2.0: Use public provider for estimateGas (avoid MetaMask RPC rate limits)
                    const readProvider = NetworkManager.getProvider();
                    const contractAddress = await contract.getAddress();
                    const readContract = new ethers.Contract(contractAddress, contract.interface, readProvider);

                    if (!readContract[method] || typeof readContract[method].estimateGas !== 'function') {
                        throw new Error(`estimateGas not available for method "${method}"`);
                    }

                    gasEstimate = await readContract[method].estimateGas(...resolvedArgs, { ...txOptions, from: userAddress });
                    console.log(`[TX] Gas estimate: ${gasEstimate.toString()}`);
                } catch (simError) {
                    console.error(`[TX] Simulation failed:`, simError.message);
                    
                    // V1.5: Better error parsing
                    if (simError.message?.includes('not found') || simError.message?.includes('undefined')) {
                        throw new Error(
                            `Contract method "${method}" is not callable. ` +
                            `Check that the ABI matches the deployed contract.`
                        );
                    }
                    
                    const parsed = ErrorHandler.parseSimulationError(simError, method);
                    throw ErrorHandler.create(parsed.type, { 
                        message: parsed.message,
                        original: simError 
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════════
            // PHASE 7: EXECUTE TRANSACTION
            // ═══════════════════════════════════════════════════════════════
            ui.setPhase('confirming');
            console.log(`[TX] Requesting signature...`);

            const gasLimit = GasManager.addSafetyMargin(gasEstimate);
            const finalTxOptions = { ...txOptions, gasLimit };

            // V1.6: Bump maxFeePerGas to avoid "baseFee exceeds maxFeePerGas" on opBNB
            // V1.9: Use public provider for fee data (avoid MetaMask RPC rate limits)
            try {
                const readProvider = NetworkManager.getProvider();
                const feeData = await readProvider.getFeeData();
                if (feeData.maxFeePerGas) {
                    finalTxOptions.maxFeePerGas = feeData.maxFeePerGas * 120n / 100n;
                    finalTxOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
                }
            } catch {}

            // Re-resolve args for execution (values may have been updated)
            const executionArgs = this._resolveArgs(args);

            let tx;
            try {
                tx = await this._executeWithRetry(
                    () => contract[method](...executionArgs, finalTxOptions),
                    { maxRetries, ui, signer, name }
                );
            } catch (sendError) {
                // ERC-4337 embedded wallets: ethers.js v6 broadcasts the tx successfully
                // but fails parsing the bundler's response due to yParity mismatch.
                // The tx hash is embedded in the error — extract it and continue.
                if (sendError.code === 'INVALID_ARGUMENT'
                    && sendError.message?.includes('yParity')
                    && sendError.value?.hash) {
                    console.warn('[TX] yParity parse error after broadcast, extracting hash');
                    tx = { hash: sendError.value.hash };
                } else {
                    throw sendError;
                }
            }

            console.log(`[TX] Transaction submitted: ${tx.hash}`);

            // ═══════════════════════════════════════════════════════════════
            // PHASE 8: WAIT FOR CONFIRMATION
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
            // ERROR HANDLING
            // ═══════════════════════════════════════════════════════════════
            console.error(`[TX] Error:`, error?.message || error);
            
            // IMMEDIATELY restore button to prevent stuck state
            if (button) {
                console.log(`[TX] Restoring button...`);
                button.disabled = false;
                if (ui.originalContent) {
                    button.innerHTML = ui.originalContent;
                }
            }
            
            // Handle error (may switch RPC)
            let handled;
            try {
                handled = await ErrorHandler.handleWithRpcSwitch(error, name);
                
                if (handled.rpcSwitched) {
                    console.log(`[TX] RPC switched to: ${handled.newRpc}`);
                }
            } catch (handlerError) {
                console.warn('[TX] Error in handleWithRpcSwitch:', handlerError);
                handled = ErrorHandler.handle(error, name);
            }
            
            // Show brief error indication (only when no onError callback handles button)
            if (handled.type !== ErrorTypes.USER_REJECTED && button && !onError) {
                const savedContent = ui.originalContent;
                button.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;gap:8px"><span>❌</span><span>Failed</span></span>`;
                setTimeout(() => {
                    if (button) button.innerHTML = savedContent;
                }, 1500);
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
            
            // Safety cleanup after timeout
            setTimeout(() => {
                if (button && button.disabled) {
                    console.log('[TX] Safety cleanup triggered');
                    ui.cleanup();
                }
            }, 5000);
        }
    }

    /**
     * Executes token approval
     * @private
     */
    async _executeApproval(approval, signer, userAddress) {
        const ethers = window.ethers;
        const { token, spender, amount } = approval;

        console.log(`[TX] Approving ${ethers.formatEther(amount)} tokens...`);

        const tokenContract = new ethers.Contract(token, ERC20_APPROVAL_ABI, signer);

        // Approve more than needed to reduce future approvals
        const approveAmount = amount * ENGINE_CONFIG.APPROVAL_MULTIPLIER;

        try {
            // V1.7: Bump maxFeePerGas on approval too (same fix as main tx)
            // V1.9: Use public provider for fee data (avoid MetaMask RPC rate limits)
            let approvalTxOptions = {
                gasLimit: 100000n  // ERC-20 approve always < 50k gas; avoids estimateGas through MetaMask
            };
            try {
                const readProvider = NetworkManager.getProvider();
                const feeData = await readProvider.getFeeData();
                if (feeData.maxFeePerGas) {
                    approvalTxOptions.maxFeePerGas = feeData.maxFeePerGas * 120n / 100n;
                    approvalTxOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
                }
            } catch {}

            // Send approval transaction (uses MetaMask to sign, gas pre-set to avoid MetaMask RPC)
            let tx;
            try {
                tx = await tokenContract.approve(spender, approveAmount, approvalTxOptions);
            } catch (approveErr) {
                // ERC-4337: yParity parse error after successful broadcast
                if (approveErr.code === 'INVALID_ARGUMENT'
                    && approveErr.message?.includes('yParity')
                    && approveErr.value?.hash) {
                    console.warn('[TX] yParity error on approval, extracting hash');
                    tx = { hash: approveErr.value.hash };
                } else {
                    throw approveErr;
                }
            }
            
            // Wait for confirmation using Alchemy provider instead of MetaMask
            const readProvider = NetworkManager.getProvider();
            let receipt = null;
            
            // Poll for receipt using Alchemy
            for (let i = 0; i < 30; i++) { // Max 30 attempts (45 seconds)
                await new Promise(r => setTimeout(r, 1500));
                try {
                    receipt = await readProvider.getTransactionReceipt(tx.hash);
                } catch (pollErr) {
                    // ERC-4337: ethers.js v6 yParity parse error — use raw RPC
                    if (pollErr.message?.includes('yParity')) {
                        try {
                            const raw = await readProvider.send('eth_getTransactionReceipt', [tx.hash]);
                            if (raw) {
                                receipt = { hash: tx.hash, status: parseInt(raw.status, 16), blockNumber: parseInt(raw.blockNumber, 16) };
                            }
                        } catch {}
                    }
                }
                if (receipt) break;
            }

            if (!receipt) {
                // Fallback: try standard wait
                receipt = await tx.wait();
            }

            if (receipt.status === 0) {
                throw new Error('Approval transaction reverted');
            }
            
            console.log(`[TX] Approval confirmed`);

            // Wait for propagation
            await new Promise(r => setTimeout(r, ENGINE_CONFIG.APPROVAL_WAIT_TIME));

            // Verify approval worked using Alchemy
            const readTokenContract = new ethers.Contract(token, ERC20_APPROVAL_ABI, readProvider);
            const newAllowance = await readTokenContract.allowance(userAddress, spender);
            
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
                    console.log(`[TX] Retry ${attempt}/${maxRetries + 1}`);

                    // Check RPC health before retry
                    const health = await NetworkManager.checkRpcHealth();
                    if (!health.healthy) {
                        console.log('[TX] RPC unhealthy, switching...');
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
        // V2.0: Always use Alchemy for confirmation (avoid MetaMask RPC rate limits)
        const readProvider = NetworkManager.getProvider();

        // Poll for receipt using Alchemy directly (skip tx.wait() which uses MetaMask)
        for (let i = 0; i < 30; i++) { // Max 30 attempts (45 seconds)
            await new Promise(r => setTimeout(r, 1500));

            try {
                const receipt = await readProvider.getTransactionReceipt(tx.hash);

                if (receipt && receipt.status === 1) {
                    console.log('[TX] Confirmed via Alchemy');
                    return receipt;
                }

                if (receipt && receipt.status === 0) {
                    throw new Error('Transaction reverted on-chain');
                }
            } catch (pollError) {
                if (pollError.message === 'Transaction reverted on-chain') throw pollError;

                // ERC-4337 embedded wallets: ethers.js v6 fails to parse bundler
                // transaction signatures (yParity mismatch). Fall back to raw RPC.
                if (pollError.message?.includes('yParity')) {
                    console.warn('[TX] yParity parse error, using raw RPC fallback');
                    try {
                        const rawReceipt = await readProvider.send(
                            'eth_getTransactionReceipt', [tx.hash]
                        );
                        if (rawReceipt) {
                            const status = parseInt(rawReceipt.status, 16);
                            if (status === 1) {
                                console.log('[TX] Confirmed via raw RPC (ERC-4337)');
                                return {
                                    hash: tx.hash,
                                    status: 1,
                                    blockNumber: parseInt(rawReceipt.blockNumber, 16),
                                    gasUsed: rawReceipt.gasUsed ? BigInt(rawReceipt.gasUsed) : 0n
                                };
                            }
                            if (status === 0) {
                                throw new Error('Transaction reverted on-chain');
                            }
                        }
                    } catch (rawError) {
                        if (rawError.message === 'Transaction reverted on-chain') throw rawError;
                        console.warn('[TX] Raw RPC fallback also failed:', rawError.message);
                    }
                }
                // Ignore other individual poll errors, keep trying
            }
        }

        // If we have a hash, assume success (optimistic)
        console.warn('[TX] Could not verify receipt after 45s, assuming success');
        return {
            hash: tx.hash,
            status: 1,
            blockNumber: 0
        };
    }

    /**
     * Checks if a transaction is currently pending
     */
    isPending(txId) {
        return this.pendingTxIds.has(txId);
    }

    /**
     * Gets count of pending transactions
     */
    getPendingCount() {
        return this.pendingTxIds.size;
    }

    /**
     * Clears all pending transaction flags
     */
    clearPending() {
        this.pendingTxIds.clear();
    }
}

// ============================================================================
// 4. SINGLETON INSTANCE
// ============================================================================

export const txEngine = new TransactionEngine();

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a simple toast notification
 */
export function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }

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
 */
export function openTxInExplorer(txHash) {
    const url = NetworkManager.getTxExplorerUrl(txHash);
    window.open(url, '_blank');
}

// ============================================================================
// 6. EXPORTS
// ============================================================================

export default txEngine;