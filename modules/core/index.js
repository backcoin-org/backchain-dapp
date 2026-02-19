// modules/js/core/index.js
// ✅ PRODUCTION V2.0 - Added Operator Module
// 
// This file re-exports all core modules for simplified imports.
//
// ============================================================================
// USAGE:
// 
// Instead of:
//   import { CacheManager } from './core/cache-manager.js';
//   import { ErrorHandler } from './core/error-handler.js';
//   import { NetworkManager } from './core/network-manager.js';
//   import { getOperator, resolveOperator } from './core/operator.js';
//
// You can do:
//   import { CacheManager, ErrorHandler, NetworkManager, getOperator, resolveOperator } from './core/index.js';
//
// Or even simpler:
//   import * as Core from './core/index.js';
//   Core.txEngine.execute({ ... });
//   const op = Core.getOperator();
// ============================================================================

// Cache Manager
export { 
    CacheManager, 
    CacheTTL, 
    CacheKeys,
    startAutoCleanup,
    stopAutoCleanup 
} from './cache-manager.js';

// Error Handler
export { 
    ErrorHandler, 
    ErrorTypes, 
    ErrorMessages 
} from './error-handler.js';

// Network Manager
export { 
    NetworkManager, 
    NETWORK_CONFIG,
    setupNetworkListeners 
} from './network-manager.js';

// Gas Manager
export { 
    GasManager 
} from './gas-manager.js';

// Validation Layer
export { 
    ValidationLayer,
    runPreValidations 
} from './validation-layer.js';

// Transaction Engine
export { 
    txEngine,
    TransactionEngine,
    TransactionUI,
    showToast,
    openTxInExplorer 
} from './transaction-engine.js';

// Operator Module (NEW in V2.0)
export {
    getOperator,
    setOperator,
    clearOperator,
    hasOperator,
    resolveOperator,
    getOperatorInfo,
    isValidAddress,
    normalizeAddress,
    shortAddress,
    OPERATOR_ZERO
} from './operator.js';

// Decentralized Storage (Lighthouse/Filecoin — permanent, ~$0.005/GB)
export {
    uploadFile as irysUploadFile,
    uploadData as irysUploadData,
    getUploadPrice,
    resolveContentUrl,
    isArweaveContent,
    UPLOAD_CONFIG,
    IRYS_CONFIG
} from './irys-uploader.js';

// Media Optimization (Canvas-based)
export {
    optimizeImage,
    optimizeMedia,
    validateVideo
} from './media-optimizer.js';

// ============================================================================
// CLIENT-SIDE FEE CALCULATION
// opBNB doesn't support gasPrice override in eth_call, so we replicate
// the Solidity fee formula in JavaScript using ecosystem.getFeeConfig().
//
// Solidity formula (BackchainEcosystem.calculateFee):
//   Gas-based (feeType 0): gasEstimate × tx.gasprice × bps × multiplier / BPS
//   Value-based (feeType 1): txValue × bps / BPS
// ============================================================================

import { addresses, contractAddresses } from '../../config.js';

const ECOSYSTEM_FEE_ABI = [
    'function getFeeConfig(bytes32 _actionId) view returns (uint8 feeType, uint16 bps, uint32 multiplier, uint32 gasEstimate)'
];

const FEE_BPS = 10000n;

/**
 * Calculate ecosystem fee client-side.
 * Reads FeeConfig from the ecosystem contract and applies the fee formula
 * using the current network gasPrice.
 *
 * @param {string} actionId - bytes32 keccak256 action identifier
 * @param {bigint} [txValue=0n] - transaction value (for value-based fees)
 * @returns {Promise<bigint>} fee in wei
 */
export async function calculateFeeClientSide(actionId, txValue = 0n) {
    try {
        const ethers = window.ethers;
        const provider = NetworkManager.getProvider();

        const ecosystemAddr = addresses?.backchainEcosystem ||
                              contractAddresses?.backchainEcosystem;

        if (!ecosystemAddr) {
            console.warn('[FeeCalc] Ecosystem address not available');
            return 0n;
        }

        const ecosystem = new ethers.Contract(ecosystemAddr, ECOSYSTEM_FEE_ABI, provider);
        const cfg = await ecosystem.getFeeConfig(actionId);

        const feeType = Number(cfg.feeType);
        const bps = BigInt(cfg.bps);

        if (feeType === 2) {
            // V11 Fixed: gasEstimate × multiplier (direct wei amount)
            const fee = BigInt(cfg.gasEstimate) * BigInt(cfg.multiplier);
            console.log(`[FeeCalc] Fixed: ${ethers.formatEther(fee)} BNB`);
            return fee;
        }

        if (bps === 0n) return 0n;

        if (feeType === 0) {
            // Gas-based: gasEstimate × gasPrice × bps × multiplier / BPS
            const feeData = await provider.getFeeData();
            const rawGasPrice = feeData.gasPrice || feeData.maxFeePerGas || 100000000n;
            const gasPrice = rawGasPrice * 150n / 100n;
            const fee = BigInt(cfg.gasEstimate) * gasPrice * bps * BigInt(cfg.multiplier) / FEE_BPS;
            console.log(`[FeeCalc] Gas-based: ${ethers.formatEther(fee)} ETH (gasEst=${cfg.gasEstimate}, gasPrice=${rawGasPrice}→${gasPrice} +50%, bps=${bps}, mult=${cfg.multiplier})`);
            return fee;
        } else {
            // Value-based: txValue × bps / BPS
            const fee = txValue * bps / FEE_BPS;
            console.log(`[FeeCalc] Value-based: ${ethers.formatEther(fee)} ETH`);
            return fee;
        }
    } catch (e) {
        console.error('[FeeCalc] Error:', e.message);
        return 0n;
    }
}

// Deprecated: gasPrice override doesn't work on opBNB. Use calculateFeeClientSide instead.
export async function getGasPriceOverrides() {
    const feeData = await NetworkManager.getProvider().getFeeData();
    return { gasPrice: feeData.gasPrice || feeData.maxFeePerGas || 100000000n };
}

// ============================================================================
// CONVENIENCE IMPORTS (Re-exports for easy access)
// ============================================================================

import { CacheManager, CacheTTL, CacheKeys } from './cache-manager.js';
import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { NetworkManager, NETWORK_CONFIG } from './network-manager.js';
import { GasManager } from './gas-manager.js';
import { ValidationLayer } from './validation-layer.js';
import { txEngine } from './transaction-engine.js';
import { getOperator, resolveOperator, setOperator, hasOperator, shortAddress } from './operator.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export with all commonly used items
 */
export default {
    // Main transaction engine (most used)
    txEngine,
    
    // Managers
    CacheManager,
    NetworkManager,
    GasManager,
    
    // Handlers
    ErrorHandler,
    ValidationLayer,
    
    // Operator (NEW in V2.0)
    getOperator,
    resolveOperator,
    setOperator,
    hasOperator,
    shortAddress,
    
    // Config
    ErrorTypes,
    NETWORK_CONFIG,
    CacheTTL
};