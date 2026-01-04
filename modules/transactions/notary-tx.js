// modules/js/transactions/notary-tx.js
// ✅ PRODUCTION V1.2 - FIXED: Correct ABI and uses Alchemy for reads
// 
// CHANGES V1.2:
// - Fixed notarize() signature: added _boosterTokenId parameter
// - Uses Alchemy provider for all read operations (avoids MetaMask RPC issues)
// - Fixed event name: DocumentNotarized uses tokenId not documentId
// - Added getBaseFee() and calculateFee() helpers
//
// CHANGES V1.1:
// - Imports addresses from config.js (loaded from deployment-addresses.json)
// - Removed hardcoded fallback addresses
//
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - notarize: Register a document hash on the blockchain (mints NFT)
// ============================================================================

import { txEngine } from '../core/index.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

/**
 * Get contract addresses dynamically from config.js
 */
function getContracts() {
    const notary = addresses?.decentralizedNotary || 
                   contractAddresses?.decentralizedNotary ||
                   window.contractAddresses?.decentralizedNotary ||
                   addresses?.notary ||
                   contractAddresses?.notary ||
                   window.contractAddresses?.notary;
    
    const bkcToken = addresses?.bkcToken ||
                     contractAddresses?.bkcToken ||
                     window.contractAddresses?.bkcToken;
    
    if (!notary) {
        console.error('❌ Notary address not found!', { addresses, contractAddresses });
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }
    
    return {
        NOTARY: notary,
        BKC_TOKEN: bkcToken
    };
}

/**
 * Notary ABI - DecentralizedNotary contract
 * V1.2: Fixed to match actual contract signature
 */
const NOTARY_ABI = [
    // Write functions - CORRECT SIGNATURE
    'function notarize(string calldata _ipfsCid, string calldata _description, bytes32 _contentHash, uint256 _boosterTokenId) external returns (uint256 tokenId)',
    
    // Read functions
    'function getDocument(uint256 _tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))',
    'function getBaseFee() view returns (uint256)',
    'function calculateFee(uint256 _boosterTokenId) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    
    // Events
    'event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 feePaid)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Notary contract instance with signer (for write operations)
 */
function getNotaryContract(signer) {
    const ethers = window.ethers;
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, signer);
}

/**
 * Creates Notary contract instance with Alchemy provider (for read operations)
 * V1.2: Uses Alchemy to avoid MetaMask RPC rate limits
 */
async function getNotaryContractReadOnly() {
    const ethers = window.ethers;
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, provider);
}

/**
 * Validates bytes32 format
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
 * Notarizes a document on the blockchain (mints NFT certificate)
 * 
 * @param {Object} params - Notarization parameters
 * @param {string} params.ipfsCid - IPFS CID where document is stored
 * @param {string} [params.description] - Document description
 * @param {string} params.contentHash - SHA256 hash of the document content (bytes32)
 * @param {number} [params.boosterTokenId=0] - RewardBoosterNFT token ID for fee discount (0 = no discount)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives tokenId)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function notarize({
    ipfsCid,
    description = '',
    contentHash,
    boosterTokenId = 0,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Validate inputs
    if (!ipfsCid || ipfsCid.trim() === '') {
        throw new Error('IPFS CID is required');
    }
    
    if (!contentHash) {
        throw new Error('Content hash is required');
    }

    // Ensure contentHash is properly formatted
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    if (!isValidBytes32(formattedHash)) {
        throw new Error('Content hash must be a valid 32-byte hex string');
    }
    
    // Convert boosterTokenId to BigInt
    const boosterId = BigInt(boosterTokenId || 0);
    
    // Get fee amount for approval
    let feeAmount = 0n;

    return await txEngine.execute({
        name: 'Notarize',
        button,
        
        getContract: async (signer) => getNotaryContract(signer),
        method: 'notarize',
        // V1.2: Correct args order matching contract
        args: [ipfsCid, description || '', formattedHash, boosterId],
        
        // Token approval for fee payment
        get approval() {
            if (feeAmount > 0n && contracts.BKC_TOKEN) {
                return {
                    token: contracts.BKC_TOKEN,
                    spender: contracts.NOTARY,
                    amount: feeAmount
                };
            }
            return null;
        },
        
        // V1.2: Use Alchemy for validation reads
        validate: async (signer, userAddress) => {
            const readContract = await getNotaryContractReadOnly();
            
            // Get fee amount for this notarization
            try {
                feeAmount = await readContract.calculateFee(boosterId);
                console.log('[NotaryTx] Fee to pay:', feeAmount.toString());
            } catch (e) {
                // If calculateFee fails, try getBaseFee
                try {
                    feeAmount = await readContract.getBaseFee();
                    console.log('[NotaryTx] Base fee:', feeAmount.toString());
                } catch (e2) {
                    console.warn('[NotaryTx] Could not fetch fee, assuming 0');
                    feeAmount = 0n;
                }
            }
            
            // Check user has enough BKC for fee
            if (feeAmount > 0n && contracts.BKC_TOKEN) {
                const { NetworkManager } = await import('../core/index.js');
                const provider = NetworkManager.getProvider();
                
                const bkcAbi = ['function balanceOf(address) view returns (uint256)'];
                const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, bkcAbi, provider);
                const balance = await bkcContract.balanceOf(userAddress);
                
                if (balance < feeAmount) {
                    throw new Error(`Insufficient BKC balance. Need ${ethers.formatEther(feeAmount)} BKC`);
                }
            }
        },
        
        onSuccess: async (receipt) => {
            // Extract tokenId from event
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === 'DocumentNotarized') {
                            tokenId = Number(parsed.args.tokenId);
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, tokenId);
            }
        },
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS (Helpers)
// ============================================================================

/**
 * Gets document by token ID
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object|null>} Document info or null
 */
export async function getDocument(tokenId) {
    const contract = await getNotaryContractReadOnly();
    
    try {
        const doc = await contract.getDocument(tokenId);
        const owner = await contract.ownerOf(tokenId);
        
        return {
            id: tokenId,
            owner: owner,
            ipfsCid: doc.ipfsCid,
            description: doc.description,
            contentHash: doc.contentHash,
            timestamp: Number(doc.timestamp),
            date: new Date(Number(doc.timestamp) * 1000)
        };
    } catch {
        return null;
    }
}

/**
 * Gets base notarization fee (without discount)
 * @returns {Promise<bigint>} Base fee in BKC
 */
export async function getBaseFee() {
    const contract = await getNotaryContractReadOnly();
    return await contract.getBaseFee();
}

/**
 * Calculates fee with booster discount
 * @param {number} boosterTokenId - Booster NFT token ID (0 for no discount)
 * @returns {Promise<bigint>} Fee amount after discount
 */
export async function calculateFee(boosterTokenId = 0) {
    const contract = await getNotaryContractReadOnly();
    return await contract.calculateFee(BigInt(boosterTokenId));
}

/**
 * Gets total number of notarized documents
 * @returns {Promise<number>} Total documents
 */
export async function getTotalDocuments() {
    const contract = await getNotaryContractReadOnly();
    return Number(await contract.totalSupply());
}

/**
 * Gets document count for a user
 * @param {string} userAddress - User address
 * @returns {Promise<number>} Number of documents owned
 */
export async function getUserDocumentCount(userAddress) {
    const contract = await getNotaryContractReadOnly();
    return Number(await contract.balanceOf(userAddress));
}

/**
 * Gets all document IDs for a user
 * @param {string} userAddress - User address
 * @returns {Promise<number[]>} Array of token IDs
 */
export async function getUserDocuments(userAddress) {
    const contract = await getNotaryContractReadOnly();
    const count = await contract.balanceOf(userAddress);
    const ids = [];
    
    for (let i = 0; i < count; i++) {
        try {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
            ids.push(Number(tokenId));
        } catch {
            break;
        }
    }
    
    return ids;
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

/**
 * Verifies a document against a stored hash
 * @param {ArrayBuffer|Uint8Array} fileContent - File content to verify
 * @param {string} expectedHash - Expected hash (bytes32)
 * @returns {Promise<boolean>} True if hashes match
 */
export async function verifyDocumentHash(fileContent, expectedHash) {
    const calculatedHash = await calculateFileHash(fileContent);
    const normalizedExpected = expectedHash.toLowerCase();
    const normalizedCalculated = calculatedHash.toLowerCase();
    return normalizedExpected === normalizedCalculated;
}

// ============================================================================
// 6. EXPORT
// ============================================================================

export const NotaryTx = {
    notarize,
    // Read helpers
    getDocument,
    getBaseFee,
    calculateFee,
    getTotalDocuments,
    getUserDocumentCount,
    getUserDocuments,
    // Utilities
    calculateFileHash,
    verifyDocumentHash
};

export default NotaryTx;