// modules/js/transactions/notary-tx.js
// ✅ PRODUCTION V2.0 - Updated for DecentralizedNotary V6 + Operator Support
// 
// CHANGES V2.0:
// - CRITICAL FIX: notarize() signature changed from boosterTokenId to operator
// - CRITICAL FIX: Added ETH fee support (msg.value required)
// - REMOVED: getBaseFee(), calculateFee() - don't exist in V6
// - REMOVED: tokenOfOwnerByIndex() - not in V6 (no ERC721Enumerable)
// - ADDED: verifyByHash() - public verification by content hash
// - ADDED: hashToTokenId() - reverse lookup
// - ADDED: getStats() - notarization statistics
// - ADDED: getFee() - returns both BKC and ETH fees
// - ADDED: getNotarizationFeeETH() - ETH fee amount
// - ADDED: resolveOperator() for hybrid operator system
// - Backwards compatible (operator is optional)
//
// ============================================================================
// V6 FEE STRUCTURE (EQUAL FOR ALL - NO DISCOUNTS):
// - BKC Fee: Retrieved from EcosystemManager (default ~1 BKC)
// - ETH Fee: Fixed amount (default 0.0001 ETH)
// - Both fees go to MiningManager → Operator/Burn/Treasury/Delegators
//
// IMPORTANT: NFT ownership does NOT provide fee discounts in V6!
//            NFTs only affect burn rate in DelegationManager.
// ============================================================================
// AVAILABLE TRANSACTIONS:
// - notarize: Register a document hash on the blockchain (mints NFT)
// ============================================================================

import { txEngine } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
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
 * DecentralizedNotary V6 ABI - with Operator support
 */
const NOTARY_ABI = [
    // ─────────────────────────────────────────────────────────────────────────
    // WRITE FUNCTION - V6 with Operator (NOT boosterTokenId!)
    // ─────────────────────────────────────────────────────────────────────────
    'function notarize(string calldata _ipfsCid, string calldata _description, bytes32 _contentHash, address _operator) external payable returns (uint256 tokenId)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Document Data
    // ─────────────────────────────────────────────────────────────────────────
    'function documents(uint256 tokenId) view returns (string ipfsCid, string description, bytes32 contentHash, uint256 timestamp)',
    'function getDocument(uint256 _tokenId) view returns (tuple(string ipfsCid, string description, bytes32 contentHash, uint256 timestamp))',
    'function notarizationFeePaid(uint256 tokenId) view returns (uint256)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Verification (V6 Feature!)
    // ─────────────────────────────────────────────────────────────────────────
    'function verifyByHash(bytes32 _contentHash) view returns (bool exists, uint256 tokenId, address owner, uint256 timestamp)',
    'function hashToTokenId(bytes32 hash) view returns (uint256)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Fees
    // ─────────────────────────────────────────────────────────────────────────
    'function getFee() view returns (uint256 bkcFee, uint256 ethFee)',
    'function notarizationFeeETH() view returns (uint256)',
    'function SERVICE_KEY() view returns (bytes32)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - Statistics
    // ─────────────────────────────────────────────────────────────────────────
    'function totalSupply() view returns (uint256)',
    'function totalNotarizations() view returns (uint256)',
    'function totalBKCCollected() view returns (uint256)',
    'function totalETHCollected() view returns (uint256)',
    'function getStats() view returns (uint256 notarizations, uint256 bkcCollected, uint256 ethCollected)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS - ERC721 Standard
    // ─────────────────────────────────────────────────────────────────────────
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 _tokenId) view returns (string)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    
    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS - V6 Format
    // ─────────────────────────────────────────────────────────────────────────
    'event DocumentNotarized(uint256 indexed tokenId, address indexed owner, string ipfsCid, bytes32 indexed contentHash, uint256 bkcFeePaid, uint256 ethFeePaid, address operator)',
    'event ETHFeeUpdated(uint256 oldFee, uint256 newFee)'
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * Creates Notary contract instance with signer (for write operations)
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
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, signer);
}

/**
 * Creates Notary contract instance with provider (for read operations)
 */
async function getNotaryContractReadOnly() {
    const ethers = window.ethers;
    
    if (!ethers) {
        throw new Error('ethers.js not loaded');
    }
    
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    
    if (!provider) {
        throw new Error('Provider not available');
    }
    
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
 * Notarizes a document on the blockchain
 * V6: Fee is EQUAL for all users (no booster discounts!)
 * 
 * @param {Object} params - Notarization parameters
 * @param {string} params.ipfsCid - IPFS content identifier
 * @param {string} [params.description] - Document description
 * @param {string} params.contentHash - SHA-256 hash of the document (bytes32)
 * @param {string} [params.operator] - Operator address (optional - uses default if not provided)
 * @param {HTMLElement} [params.button] - Button element for loading state
 * @param {Function} [params.onSuccess] - Success callback (receives receipt, tokenId, feePaid)
 * @param {Function} [params.onError] - Error callback
 * @returns {Promise<Object>} Transaction result
 */
export async function notarize({
    ipfsCid,
    description = '',
    contentHash,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    const contracts = getContracts();
    
    // Validate inputs
    if (!ipfsCid || ipfsCid.trim().length === 0) {
        throw new Error('IPFS CID is required');
    }
    
    if (!contentHash) {
        throw new Error('Content hash is required');
    }
    
    // Format hash
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    if (!isValidBytes32(formattedHash)) {
        throw new Error('Invalid content hash format. Must be a valid bytes32 (64 hex characters)');
    }
    
    // Store values for closure
    let storedOperator = operator;
    let bkcFeeAmount = 0n;
    let ethFeeAmount = 0n;

    return await txEngine.execute({
        name: 'Notarize',
        button,
        
        getContract: async (signer) => getNotaryContract(signer),
        method: 'notarize',
        
        // V2: Args now include operator instead of boosterTokenId
        args: () => [ipfsCid, description || '', formattedHash, resolveOperator(storedOperator)],
        
        // V2: ETH fee is REQUIRED in V6!
        get value() { return ethFeeAmount; },
        
        // BKC approval for fee
        get approval() {
            if (bkcFeeAmount > 0n && contracts.BKC_TOKEN) {
                return {
                    token: contracts.BKC_TOKEN,
                    spender: contracts.NOTARY,
                    amount: bkcFeeAmount
                };
            }
            return null;
        },
        
        validate: async (signer, userAddress) => {
            const contract = getNotaryContract(signer);
            
            // Get fees from contract
            try {
                const [bkcFee, ethFee] = await contract.getFee();
                bkcFeeAmount = bkcFee;
                ethFeeAmount = ethFee;
                
                console.log('[NotaryTx] Fees:', {
                    bkcFee: ethers.formatEther(bkcFee) + ' BKC',
                    ethFee: ethers.formatEther(ethFee) + ' ETH'
                });
            } catch (e) {
                // Fallback to individual calls
                try {
                    ethFeeAmount = await contract.notarizationFeeETH();
                } catch {
                    ethFeeAmount = ethers.parseEther('0.0001'); // Default
                }
                bkcFeeAmount = ethers.parseEther('1'); // Default
            }
            
            // Check ETH balance for fee
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            
            // Need ETH for fee + gas
            const minEthNeeded = ethFeeAmount + ethers.parseEther('0.001');
            if (ethBalance < minEthNeeded) {
                throw new Error(`Insufficient ETH. Need ~${ethers.formatEther(minEthNeeded)} ETH for fee + gas`);
            }
            
            // Check BKC balance for fee
            if (bkcFeeAmount > 0n && contracts.BKC_TOKEN) {
                const bkcAbi = ['function balanceOf(address) view returns (uint256)'];
                const bkcContract = new ethers.Contract(contracts.BKC_TOKEN, bkcAbi, provider);
                const bkcBalance = await bkcContract.balanceOf(userAddress);
                
                if (bkcBalance < bkcFeeAmount) {
                    throw new Error(`Insufficient BKC. Need ${ethers.formatEther(bkcFeeAmount)} BKC`);
                }
            }
        },
        
        onSuccess: async (receipt) => {
            let tokenId = null;
            let feePaid = { bkc: 0n, eth: 0n };
            
            // Parse event for tokenId and fees
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'DocumentNotarized') {
                            tokenId = Number(parsed.args.tokenId);
                            feePaid = {
                                bkc: parsed.args.bkcFeePaid,
                                eth: parsed.args.ethFeePaid
                            };
                            break;
                        }
                    } catch {}
                }
            } catch {}

            if (onSuccess) {
                onSuccess(receipt, tokenId, feePaid);
            }
        },
        
        onError: (error) => {
            console.error('[NotaryTx] Notarization failed:', error);
            if (onError) {
                onError(error);
            }
        }
    });
}

// ============================================================================
// 4. READ FUNCTIONS
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
        const feePaid = await contract.notarizationFeePaid(tokenId).catch(() => 0n);
        
        return {
            id: tokenId,
            owner: owner,
            ipfsCid: doc.ipfsCid,
            description: doc.description,
            contentHash: doc.contentHash,
            timestamp: Number(doc.timestamp),
            date: new Date(Number(doc.timestamp) * 1000),
            feePaid: feePaid
        };
    } catch {
        return null;
    }
}

/**
 * Verifies if a document hash was notarized
 * V6: Allows public verification without knowing token ID
 * 
 * @param {string} contentHash - SHA-256 hash to verify (bytes32)
 * @returns {Promise<Object>} Verification result
 */
export async function verifyByHash(contentHash) {
    const contract = await getNotaryContractReadOnly();
    
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    try {
        const result = await contract.verifyByHash(formattedHash);
        
        return {
            exists: result.exists,
            tokenId: result.exists ? Number(result.tokenId) : null,
            owner: result.exists ? result.owner : null,
            timestamp: result.exists ? Number(result.timestamp) : null,
            date: result.exists ? new Date(Number(result.timestamp) * 1000) : null
        };
    } catch (error) {
        console.error('[NotaryTx] verifyByHash error:', error);
        return {
            exists: false,
            tokenId: null,
            owner: null,
            timestamp: null,
            date: null
        };
    }
}

/**
 * Gets token ID for a content hash (reverse lookup)
 * @param {string} contentHash - Content hash (bytes32)
 * @returns {Promise<number|null>} Token ID or null if not found
 */
export async function getTokenIdByHash(contentHash) {
    const contract = await getNotaryContractReadOnly();
    
    const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
    
    try {
        const tokenId = await contract.hashToTokenId(formattedHash);
        return Number(tokenId) > 0 ? Number(tokenId) : null;
    } catch {
        return null;
    }
}

/**
 * Gets current notarization fees
 * V6: Returns both BKC and ETH fees
 * 
 * @returns {Promise<Object>} Fee amounts
 */
export async function getFee() {
    const ethers = window.ethers;
    const contract = await getNotaryContractReadOnly();
    
    try {
        const [bkcFee, ethFee] = await contract.getFee();
        
        return {
            bkcFee: bkcFee,
            ethFee: ethFee,
            bkcFormatted: ethers.formatEther(bkcFee) + ' BKC',
            ethFormatted: ethers.formatEther(ethFee) + ' ETH',
            totalInEth: ethFee // BKC is separate token
        };
    } catch {
        // Fallback
        const ethFee = await contract.notarizationFeeETH().catch(() => ethers.parseEther('0.0001'));
        return {
            bkcFee: ethers.parseEther('1'),
            ethFee: ethFee,
            bkcFormatted: '1 BKC',
            ethFormatted: ethers.formatEther(ethFee) + ' ETH',
            totalInEth: ethFee
        };
    }
}

/**
 * Gets ETH fee amount
 * @returns {Promise<bigint>} ETH fee in wei
 */
export async function getNotarizationFeeETH() {
    const contract = await getNotaryContractReadOnly();
    try {
        return await contract.notarizationFeeETH();
    } catch {
        return window.ethers.parseEther('0.0001');
    }
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
 * Gets notarization statistics
 * @returns {Promise<Object>} Stats
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getNotaryContractReadOnly();
    
    try {
        const stats = await contract.getStats();
        
        return {
            totalNotarizations: Number(stats.notarizations),
            totalBKCCollected: stats.bkcCollected,
            totalBKCFormatted: ethers.formatEther(stats.bkcCollected),
            totalETHCollected: stats.ethCollected,
            totalETHFormatted: ethers.formatEther(stats.ethCollected)
        };
    } catch {
        // Fallback to individual calls
        const [notarizations, bkcCollected, ethCollected] = await Promise.all([
            contract.totalNotarizations().catch(() => 0n),
            contract.totalBKCCollected().catch(() => 0n),
            contract.totalETHCollected().catch(() => 0n)
        ]);
        
        return {
            totalNotarizations: Number(notarizations),
            totalBKCCollected: bkcCollected,
            totalBKCFormatted: ethers.formatEther(bkcCollected),
            totalETHCollected: ethCollected,
            totalETHFormatted: ethers.formatEther(ethCollected)
        };
    }
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
 * Gets token URI (metadata)
 * @param {number} tokenId - Token ID
 * @returns {Promise<string>} Token URI (data URI with base64 JSON)
 */
export async function getTokenURI(tokenId) {
    const contract = await getNotaryContractReadOnly();
    return await contract.tokenURI(tokenId);
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
 * @param {ArrayBuffer|Uint8Array|File|Blob} fileContent - File content to verify
 * @param {string} expectedHash - Expected hash (bytes32)
 * @returns {Promise<boolean>} True if hashes match
 */
export async function verifyDocumentHash(fileContent, expectedHash) {
    const calculatedHash = await calculateFileHash(fileContent);
    const normalizedExpected = expectedHash.toLowerCase();
    const normalizedCalculated = calculatedHash.toLowerCase();
    return normalizedExpected === normalizedCalculated;
}

/**
 * Verifies a document exists on-chain and matches the expected hash
 * @param {ArrayBuffer|File|Blob} fileContent - File content
 * @param {string} [expectedHash] - Optional expected hash (will calculate if not provided)
 * @returns {Promise<Object>} Verification result with on-chain status
 */
export async function verifyDocumentOnChain(fileContent, expectedHash) {
    // Calculate hash if not provided
    const hash = expectedHash || await calculateFileHash(fileContent);
    
    // Check on-chain
    const onChainResult = await verifyByHash(hash);
    
    // If expectedHash was provided, verify it matches the file
    let hashMatches = true;
    if (expectedHash) {
        hashMatches = await verifyDocumentHash(fileContent, expectedHash);
    }
    
    return {
        contentHash: hash,
        hashMatches: hashMatches,
        existsOnChain: onChainResult.exists,
        tokenId: onChainResult.tokenId,
        owner: onChainResult.owner,
        timestamp: onChainResult.timestamp,
        date: onChainResult.date,
        isVerified: hashMatches && onChainResult.exists
    };
}

// ============================================================================
// 6. EXPORT
// ============================================================================

export const NotaryTx = {
    // Write function
    notarize,
    
    // Read helpers - Documents
    getDocument,
    getTotalDocuments,
    getUserDocumentCount,
    getTokenURI,
    
    // Read helpers - Verification (V6!)
    verifyByHash,
    getTokenIdByHash,
    
    // Read helpers - Fees & Stats
    getFee,
    getNotarizationFeeETH,
    getStats,
    
    // Utilities
    calculateFileHash,
    verifyDocumentHash,
    verifyDocumentOnChain
};

export default NotaryTx;