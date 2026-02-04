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