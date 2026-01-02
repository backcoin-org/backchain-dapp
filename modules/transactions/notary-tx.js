// modules/js/transactions/notary-tx.js
// ✅ PRODUCTION V1.1 - FIXED: Uses dynamic addresses from config.js
// 
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
// - Uses decentralizedNotary as the contract address
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - notarize: Register a document hash on the blockchain
// ============================================================================

import { txEngine, ValidationLayer } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 * Addresses are loaded from deployment-addresses.json at app init
 * 
 * @returns {Object} Contract addresses
 * @throws {Error} If addresses are not loaded
 */
function getContracts() {
    const notary = addresses?.decentralizedNotary || 
                   contractAddresses?.decentralizedNotary ||
                   window.contractAddresses?.decentralizedNotary ||
                   // Also check alternative names
                   addresses?.notary ||
                   contractAddresses?.notary ||
                   window.contractAddresses?.notary;
    
    if (!notary) {
        console.error('❌ Notary address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        NOTARY: notary
    };
}

/**
 * Notary ABI - DecentralizedNotary contract
 */
const NOTARY_ABI = [
    // Write functions
    'function notarize(string ipfsCid, string description, bytes32 contentHash) external returns (uint256)',
    
    // Read functions
    'function getDocument(uint256 documentId) view returns (address owner, string ipfsCid, string description, bytes32 contentHash, uint256 timestamp, bool exists)',
    'function getDocumentByHash(bytes32 contentHash) view returns (uint256 documentId, address owner, string ipfsCid, string description, uint256 timestamp)',
    'function getUserDocuments(address user) view returns (uint256[])',
    'function documentCount() view returns (uint256)',
    'function hashExists(bytes32 contentHash) view returns (bool)',
    
    // Events
    'event DocumentNotarized(uint256 indexed documentId, address indexed owner, string ipfsCid, bytes32 contentHash, uint256 timestamp)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Notary contract instance
 */
function getNotaryContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, signer);
}

/**
 * Creates Notary contract instance (read-only)
 */
async function getNotaryContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, provider);
}

/**
 * Converts string to bytes32 hash
 * @param {string} str - String to hash
 * @returns {string} bytes32 hash
 */
function stringToBytes32(str) {
    const ethers = window.ethers;
    return ethers.keccak256(ethers.toUtf8Bytes(str));
}

/**
 * Validates bytes32 format
 * @param {string} hash - Hash to validate
 * @returns {boolean} True if valid
 */
function isValidBytes32(hash) {
    if (!hash) return false;
    const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;
    return /^0x[a-fA-F0-9]{64}$/.test(cleanHash);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Notarizes a document on the blockchain
 * 
 * @param {Object} params - Notarization parameters
 * @param {string} params.ipfsCid - IPFS CID where document is stored
 * @param {string} [params.description] - Document description
 * @param {string} params.contentHash - SHA256 hash of the document content (bytes32)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives documentId)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function notarize({
    ipfsCid,
    description = '',
    contentHash,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    
    // Validate inputs
    ValidationLayer.notary.validateNotarize({ ipfsCid, description, contentHash });

    // Ensure contentHash is properly formatted
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    if (!isValidBytes32(formattedHash)) {
        throw new Error('Content hash must be a valid 32-byte hex string');
    }

    return await txEngine.execute({
        name: 'Notarize',
        button,
        
        getContract: async (signer) => getNotaryContract(signer),
        method: 'notarize',
        args: [ipfsCid, description || '', formattedHash],
        
        // Custom validation: check hash doesn't already exist
        validate: async (signer, userAddress) => {
            const contract = getNotaryContract(signer);
            
            // Check if this hash was already notarized
            const exists = await contract.hashExists(formattedHash);
            if (exists) {
                throw new Error('This document has already been notarized');
            }
        },
        
        onSuccess: async (receipt) => {
            // Try to extract documentId from event
            let documentId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'DocumentNotarized') {
                            documentId = Number(parsed.args.documentId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, documentId);
            }
        },
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets document by ID
 * @param {number} documentId - Document ID
 * @returns {Promise<Object>} Document info
 */
export async function getDocument(documentId) {
    const contract = await getNotaryContractReadOnly();
    const doc = await contract.getDocument(documentId);
    
    if (!doc.exists) {
        return null;
    }
    
    return {
        id: documentId,
        owner: doc.owner,
        ipfsCid: doc.ipfsCid,
        description: doc.description,
        contentHash: doc.contentHash,
        timestamp: Number(doc.timestamp),
        date: new Date(Number(doc.timestamp) * 1000)
    };
}

/**
 * Gets document by content hash
 * @param {string} contentHash - Content hash (bytes32)
 * @returns {Promise<Object|null>} Document info or null
 */
export async function getDocumentByHash(contentHash) {
    const ethers = window.ethers;
    const contract = await getNotaryContractReadOnly();
    
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    try {
        const doc = await contract.getDocumentByHash(formattedHash);
        
        if (doc.documentId === 0n && doc.owner === ethers.ZeroAddress) {
            return null;
        }
        
        return {
            id: Number(doc.documentId),
            owner: doc.owner,
            ipfsCid: doc.ipfsCid,
            description: doc.description,
            timestamp: Number(doc.timestamp),
            date: new Date(Number(doc.timestamp) * 1000)
        };
    } catch {
        return null;
    }
}

/**
 * Gets all documents for a user
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of document IDs
 */
export async function getUserDocuments(userAddress) {
    const contract = await getNotaryContractReadOnly();
    const ids = await contract.getUserDocuments(userAddress);
    return ids.map(id => Number(id));
}

/**
 * Gets total document count
 * @returns {Promise<number>} Total documents notarized
 */
export async function getDocumentCount() {
    const contract = await getNotaryContractReadOnly();
    return Number(await contract.documentCount());
}

/**
 * Checks if a content hash has been notarized
 * @param {string} contentHash - Content hash to check
 * @returns {Promise<boolean>} True if already notarized
 */
export async function isHashNotarized(contentHash) {
    const contract = await getNotaryContractReadOnly();
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    return await contract.hashExists(formattedHash);
}

/**
 * Verifies a document against its notarized hash
 * @param {ArrayBuffer|Uint8Array} fileContent - File content to verify
 * @returns {Promise<Object>} Verification result { verified, document }
 */
export async function verifyDocument(fileContent) {
    // Calculate hash of the file
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileContent);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check if this hash exists
    const document = await getDocumentByHash(contentHash);
    
    return {
        verified: document !== null,
        contentHash,
        document
    };
}

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates SHA-256 hash of file content
 * Use this before calling notarize()
 * 
 * @param {File|Blob|ArrayBuffer} file - File to hash
 * @returns {Promise<string>} Content hash as hex string with 0x prefix
 */
export async function calculateFileHash(file) {
    let buffer;
    
    if (file instanceof ArrayBuffer) {
        buffer = file;
    } else if (file instanceof Blob || file instanceof File) {
        buffer = await file.arrayBuffer();
    } else {
        throw new Error('Invalid file type. Expected File, Blob, or ArrayBuffer');
    }
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// 6. EXPORT
// ============================================================================

export const NotaryTx = {
    notarize,
    // Read helpers
    getDocument,
    getDocumentByHash,
    getUserDocuments,
    getDocumentCount,
    isHashNotarized,
    verifyDocument,
    // Utilities
    calculateFileHash
};

export default NotaryTx;