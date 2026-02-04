// modules/js/core/operator.js
// ✅ PRODUCTION V1.0 - Operator Management for Backchain dApp
// 
// This module manages operator addresses for the hybrid operator system.
// Operators earn a percentage of ALL fees (BKC + ETH) generated through
// their frontends/apps/bots.
//
// ============================================================================
// HYBRID OPERATOR SYSTEM:
//
//   1. Page DOES NOT pass operator → Uses default from localStorage
//   2. Page PASSES operator → Uses that operator  
//   3. Page PASSES null → No operator (ZeroAddress)
//
// ============================================================================
// USAGE:
//
//   import { resolveOperator } from './core/operator.js';
//
//   // In args (as function):
//   args: () => [amount, lockDuration, resolveOperator(operator)]
//
// ============================================================================

// ============================================================================
// 1. CONSTANTS
// ============================================================================

const STORAGE_KEY = 'bkc_operator';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// ============================================================================
// 2. CORE FUNCTIONS
// ============================================================================

/**
 * Gets the current default operator address
 * @returns {string} Operator address or ZeroAddress if not set
 */
export function getOperator() {
    const ethers = window.ethers;
    
    try {
        // Try localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isValidAddress(saved)) {
            return normalizeAddress(saved);
        }
        
        // Try global config
        if (window.BACKCHAIN_OPERATOR && isValidAddress(window.BACKCHAIN_OPERATOR)) {
            return normalizeAddress(window.BACKCHAIN_OPERATOR);
        }
        
        // Try addresses config
        if (window.addresses?.operator && isValidAddress(window.addresses.operator)) {
            return normalizeAddress(window.addresses.operator);
        }
        
    } catch (e) {
        console.warn('[Operator] Error getting operator:', e);
    }
    
    return ethers?.ZeroAddress || ZERO_ADDRESS;
}

/**
 * Resolves operator with page override support
 * This is the main function for hybrid system
 * 
 * @param {string|null|undefined} pageOperator - Operator passed by page
 * @returns {string} Resolved operator address
 * 
 * @example
 * // Use default
 * resolveOperator()          // → localStorage or ZeroAddress
 * 
 * // Use specific
 * resolveOperator('0x123')   // → '0x123'
 * 
 * // Explicitly no operator
 * resolveOperator(null)      // → ZeroAddress
 */
export function resolveOperator(pageOperator) {
    const ethers = window.ethers;
    const zero = ethers?.ZeroAddress || ZERO_ADDRESS;
    
    // Page explicitly passed null = no operator
    if (pageOperator === null) {
        return zero;
    }
    
    // Page passed a valid address = use it
    if (pageOperator && isValidAddress(pageOperator)) {
        return normalizeAddress(pageOperator);
    }
    
    // Otherwise use default
    return getOperator();
}

/**
 * Sets the default operator address
 * @param {string} address - Operator address
 * @returns {boolean} Success
 */
export function setOperator(address) {
    if (!address) {
        clearOperator();
        return true;
    }
    
    if (!isValidAddress(address)) {
        console.warn('[Operator] Invalid address:', address);
        return false;
    }
    
    try {
        const normalized = normalizeAddress(address);
        localStorage.setItem(STORAGE_KEY, normalized);
        window.BACKCHAIN_OPERATOR = normalized;
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('operatorChanged', {
            detail: { address: normalized }
        }));
        
        console.log('[Operator] Set to:', normalized);
        return true;
    } catch (e) {
        console.error('[Operator] Error setting:', e);
        return false;
    }
}

/**
 * Clears the default operator
 */
export function clearOperator() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        delete window.BACKCHAIN_OPERATOR;
        
        window.dispatchEvent(new CustomEvent('operatorChanged', {
            detail: { address: null }
        }));
        
        console.log('[Operator] Cleared');
    } catch (e) {
        console.warn('[Operator] Error clearing:', e);
    }
}

/**
 * Checks if a valid operator is configured
 * @returns {boolean}
 */
export function hasOperator() {
    const ethers = window.ethers;
    const zero = ethers?.ZeroAddress || ZERO_ADDRESS;
    const op = getOperator();
    return op && op !== zero;
}

/**
 * Gets operator info for debugging/UI
 * @returns {Object} { address, source, isSet }
 */
export function getOperatorInfo() {
    const ethers = window.ethers;
    const zero = ethers?.ZeroAddress || ZERO_ADDRESS;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidAddress(stored)) {
        return { address: stored, source: 'localStorage', isSet: true };
    }
    
    if (window.BACKCHAIN_OPERATOR && isValidAddress(window.BACKCHAIN_OPERATOR)) {
        return { address: window.BACKCHAIN_OPERATOR, source: 'global', isSet: true };
    }
    
    if (window.addresses?.operator && isValidAddress(window.addresses.operator)) {
        return { address: window.addresses.operator, source: 'config', isSet: true };
    }
    
    return { address: zero, source: 'none', isSet: false };
}

// ============================================================================
// 3. VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a string is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean}
 */
export function isValidAddress(address) {
    const ethers = window.ethers;
    
    if (!address || typeof address !== 'string') return false;
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) return false;
    
    // Use ethers validation if available
    if (ethers?.isAddress) {
        return ethers.isAddress(address);
    }
    
    return true;
}

/**
 * Normalizes address to checksum format
 * @param {string} address - Address to normalize
 * @returns {string}
 */
export function normalizeAddress(address) {
    const ethers = window.ethers;
    
    if (!address) return ethers?.ZeroAddress || ZERO_ADDRESS;
    
    try {
        if (ethers?.getAddress) {
            return ethers.getAddress(address);
        }
    } catch (e) {
        // Invalid checksum, return as-is
    }
    
    return address;
}

/**
 * Gets short address for display (0x1234...5678)
 * @param {string} address - Address to shorten
 * @returns {string}
 */
export function shortAddress(address) {
    const ethers = window.ethers;
    const zero = ethers?.ZeroAddress || ZERO_ADDRESS;
    
    if (!address || address === zero) return 'None';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================================================
// 4. CONSTANTS EXPORT
// ============================================================================

export const OPERATOR_ZERO = ZERO_ADDRESS;

// ============================================================================
// 5. DEFAULT EXPORT
// ============================================================================

const Operator = {
    // Core
    get: getOperator,
    set: setOperator,
    clear: clearOperator,
    has: hasOperator,
    resolve: resolveOperator,
    info: getOperatorInfo,
    
    // Helpers
    isValid: isValidAddress,
    normalize: normalizeAddress,
    short: shortAddress,
    
    // Constants
    ZERO: ZERO_ADDRESS
};

// Global access
window.Operator = Operator;

export default Operator;
