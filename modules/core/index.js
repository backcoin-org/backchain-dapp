// modules/js/core/index.js
// ✅ PRODUCTION V1.0 - Barrel Export for Core Modules
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
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export with all commonly used items
 */
export default {
    // Main transaction engine (most used)
    txEngine: (await import('./transaction-engine.js')).txEngine,
    
    // Managers
    CacheManager: (await import('./cache-manager.js')).CacheManager,
    NetworkManager: (await import('./network-manager.js')).NetworkManager,
    GasManager: (await import('./gas-manager.js')).GasManager,
    
    // Handlers
    ErrorHandler: (await import('./error-handler.js')).ErrorHandler,
    ValidationLayer: (await import('./validation-layer.js')).ValidationLayer,
    
    // Config
    ErrorTypes: (await import('./error-handler.js')).ErrorTypes,
    NETWORK_CONFIG: (await import('./network-manager.js')).NETWORK_CONFIG,
    CacheTTL: (await import('./cache-manager.js')).CacheTTL
};