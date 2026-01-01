// modules/core/index.js
// ✅ PRODUCTION V1.1 - Fixed: Removed top-level await
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
//
// You can do:
//   import { CacheManager, ErrorHandler, NetworkManager } from './core/index.js';
//
// Or even simpler:
//   import * as Core from './core/index.js';
//   Core.txEngine.execute({ ... });
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

// ============================================================================
// CONVENIENCE IMPORTS (Re-exports for easy access)
// ============================================================================

// Re-export everything from each module for convenience
import { CacheManager, CacheTTL, CacheKeys } from './cache-manager.js';
import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { NetworkManager, NETWORK_CONFIG } from './network-manager.js';
import { GasManager } from './gas-manager.js';
import { ValidationLayer } from './validation-layer.js';
import { txEngine } from './transaction-engine.js';

// ============================================================================
// DEFAULT EXPORT (No top-level await)
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
    
    // Config
    ErrorTypes,
    NETWORK_CONFIG,
    CacheTTL
};