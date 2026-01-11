// modules/js/transactions/notary-tx.js
// ✅ PRODUCTION V1.4 - FIXED: ABI format and contract instantiation
// 
// CHANGES V1.4:
// - Changed ABI from string format to object format (ethers v6 compatibility)
// - Added fallback for getContract when signer is not available
// - Better error handling for contract instantiation
// - Added debug logging for troubleshooting
// - Fixed: "Cannot read properties of undefined (reading 'estimateGas')"
//
// CHANGES V1.3:
// - Fee is now fetched BEFORE calling txEngine.execute
// - Approval object is static (not a getter) with pre-fetched fee amount
// - This fixes "ERC20: insufficient allowance" error
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
    
    console.log('[NotaryTx] Using addresses:', { notary, bkcToken });
    
    return {
        NOTARY: notary,
        BKC_TOKEN: bkcToken
    };
}

/**
 * Notary ABI - DecentralizedNotary contract
 * V1.4: Using OBJECT format instead of string for ethers v6 compatibility
 */
const NOTARY_ABI = [
    // Write functions
    {
        name: 'notarize',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_ipfsCid', type: 'string' },
            { name: '_description', type: 'string' },
            { name: '_contentHash', type: 'bytes32' },
            { name: '_boosterTokenId', type: 'uint256' }
        ],
        outputs: [
            { name: 'tokenId', type: 'uint256' }
        ]
    },
    
    // Read functions
    {
        name: 'getDocument',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_tokenId', type: 'uint256' }],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'ipfsCid', type: 'string' },
                    { name: 'description', type: 'string' },
                    { name: 'contentHash', type: 'bytes32' },
                    { name: 'timestamp', type: 'uint256' }
                ]
            }
        ]
    },
    {
        name: 'getBaseFee',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'calculateFee',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_boosterTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'tokenOfOwnerByIndex',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    
    // Events
    {
        name: 'DocumentNotarized',
        type: 'event',
        inputs: [
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'owner', type: 'address', indexed: true },
            { name: 'ipfsCid', type: 'string', indexed: false },
            { name: 'contentHash', type: 'bytes32', indexed: true },
            { name: 'feePaid', type: 'uint256', indexed: false }
        ]
    }
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Notary contract instance with signer (for write operations)
 * V1.4: Added validation and debug logging
 */
function getNotaryContract(signer) {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    if (!signer) {
        throw new Error('Signer is required for write operations');
    }
    
    const contracts = getContracts();
    
    console.log('[NotaryTx] Creating contract with signer:', {
        address: contracts.NOTARY,
        hasSigner: !!signer
    });
    
    const contract = new ethers.Contract(contracts.NOTARY, NOTARY_ABI, signer);
    
    // V1.4: Verify contract has the notarize method
    if (typeof contract.notarize !== 'function') {
        console.error('[NotaryTx] Contract missing notarize method!', {
            contractMethods: Object.keys(contract).filter(k => typeof contract[k] === 'function')
        });
        throw new Error('Contract ABI error: notarize method not found');
    }
    
    console.log('[NotaryTx] Contract created successfully, methods:', 
        Object.keys(contract).filter(k => typeof contract[k] === 'function').slice(0, 10)
    );
    
    return contract;
}

/**
 * Creates Notary contract instance with Alchemy provider (for read operations)
 * V1.4: Added better error handling and fallback
 */
async function getNotaryContractReadOnly() {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    try {
        const { NetworkManager } = await import('../core/index.js');
        const provider = NetworkManager.getProvider();
        
        if (!provider) {
            throw new Error('Provider not available');
        }
        
        const contracts = getContracts();
        const contract = new ethers.Contract(contracts.NOTARY, NOTARY_ABI, provider);
        
        return contract;
    } catch (error) {
        console.warn('[NotaryTx] Failed to get read-only contract:', error.message);
        throw error;
    }
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
    
    console.log('[NotaryTx] Starting notarize with params:', {
        ipfsCid,
        description: description?.substring(0, 50) + '...',
        contentHash: contentHash?.substring(0, 20) + '...',
        boosterTokenId
    });
    
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
    
    // V1.3 FIX: Get fee BEFORE calling txEngine.execute
    // This ensures approval amount is known before the transaction starts
    let feeAmount = 0n;
    try {
        const readContract = await getNotaryContractReadOnly();
        feeAmount = await readContract.calculateFee(boosterId);
        console.log('[NotaryTx] Fee to pay (pre-fetch):', ethers.formatEther(feeAmount), 'BKC');
    } catch (e) {
        console.warn('[NotaryTx] calculateFee failed, trying getBaseFee:', e.message);
        try {
            const readContract = await getNotaryContractReadOnly();
            feeAmount = await readContract.getBaseFee();
            console.log('[NotaryTx] Base fee (pre-fetch):', ethers.formatEther(feeAmount), 'BKC');
        } catch (e2) {
            console.warn('[NotaryTx] Could not pre-fetch fee, will try during validation:', e2.message);
        }
    }

    return await txEngine.execute({
        name: 'Notarize',
        button,
        
        // V1.4 FIX: Added debug logging in getContract
        getContract: async (signer) => {
            console.log('[NotaryTx] getContract called with signer:', !!signer);
            const contract = getNotaryContract(signer);
            console.log('[NotaryTx] Contract instance created:', !!contract);
            console.log('[NotaryTx] Contract.notarize exists:', typeof contract.notarize);
            return contract;
        },
        
        method: 'notarize',
        args: [ipfsCid, description || '', formattedHash, boosterId],
        
        // V1.3 FIX: Static approval object (not a getter)
        // feeAmount is already known from pre-fetch above
        approval: (feeAmount > 0n && contracts.BKC_TOKEN) ? {
            token: contracts.BKC_TOKEN,
            spender: contracts.NOTARY,
            amount: feeAmount
        } : null,
        
        // Validation using Alchemy
        validate: async (signer, userAddress) => {
            console.log('[NotaryTx] Validating for user:', userAddress);
            
            // Check user has enough BKC for fee
            if (feeAmount > 0n && contracts.BKC_TOKEN) {
                const { NetworkManager } = await import('../core/index.js');
                const provider = NetworkManager.getProvider();
                
                const bkcAbi = ['function balanceOf(address) view returns (uint256)'];
                const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, bkcAbi, provider);
                const balance = await bkcContract.balanceOf(userAddress);
                
                console.log('[NotaryTx] BKC balance:', ethers.formatEther(balance), 'Required:', ethers.formatEther(feeAmount));
                
                if (balance < feeAmount) {
                    throw new Error(`Insufficient BKC balance. Need ${ethers.formatEther(feeAmount)} BKC`);
                }
            }
            
            console.log('[NotaryTx] Validation passed');
        },
        
        onSuccess: async (receipt) => {
            console.log('[NotaryTx] Transaction successful:', receipt.hash);
            
            // Extract tokenId from event
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'DocumentNotarized') {
                            tokenId = Number(parsed.args.tokenId);
                            console.log('[NotaryTx] Minted token ID:', tokenId);
                            break;
                        }
                    } catch {}
                }
            } catch (e) {
                console.warn('[NotaryTx] Could not parse event logs:', e.message);
            }

            if (onSuccess) {
                onSuccess(receipt, tokenId);
            }
        },
        
        onError: (error) => {
            console.error('[NotaryTx] Transaction failed:', error);
            if (onError) {
                onError(error);
            }
        }
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