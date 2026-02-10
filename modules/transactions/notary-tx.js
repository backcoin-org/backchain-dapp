// modules/js/transactions/notary-tx.js
// ✅ V9.0 - Updated for Notary V9 (ETH-only, immutable)
//
// CHANGES V9.0:
// - Renamed: DecentralizedNotary → Notary
// - notarize() → certify(bytes32, string, uint8, address) payable
// - ETH-only fees (no BKC fee, no BKC approval)
// - No ERC721 — certificates are mappings, not tokens
// - certId replaces tokenId (sequential uint256)
// - verify() replaces verifyByHash() — returns (exists, owner, timestamp, docType, meta)
// - getCertificate() replaces getDocument() — returns different tuple
// - getFee() returns single uint256 (ETH), not (bkcFee, ethFee) tuple
// - getStats() returns 2-tuple (certCount, totalEthCollected)
// - Added: batchCertify, transferCertificate
// - Removed: ownerOf, balanceOf, tokenURI, hashToTokenId, notarizationFeeETH
//
// ============================================================================
// V9 FEE STRUCTURE:
// - ETH fee only (Tier 1) → ecosystem (operator/treasury/buyback)
// - No BKC fee, no NFT discounts
// ============================================================================

import { txEngine, calculateFeeClientSide } from '../core/index.js';
import { resolveOperator } from '../core/operator.js';
import { addresses, contractAddresses } from '../../config.js';

// ============================================================================
// 1. CONTRACT CONFIGURATION
// ============================================================================

function getContracts() {
    const notary = addresses?.notary ||
                   contractAddresses?.notary ||
                   window.contractAddresses?.notary;

    if (!notary) {
        console.error('❌ Notary address not found!');
        throw new Error('Contract addresses not loaded. Please refresh the page.');
    }

    return { NOTARY: notary };
}

/**
 * Notary V9 ABI
 */
const NOTARY_ABI = [
    // Write functions
    'function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)',
    'function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)',
    'function transferCertificate(bytes32 documentHash, address newOwner) external',

    // Read functions
    'function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)',
    'function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)',
    'function getFee() view returns (uint256)',
    'function getStats() view returns (uint256 certCount, uint256 totalEthCollected)',
    'function certCount() view returns (uint256)',
    'function version() view returns (string)',

    // Events
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)',
    'event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)',
    'event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)'
];

// Document types
const DOC_TYPES = {
    GENERAL: 0,
    CONTRACT: 1,
    IDENTITY: 2,
    DIPLOMA: 3,
    PROPERTY: 4,
    FINANCIAL: 5,
    LEGAL: 6,
    MEDICAL: 7,
    IP: 8,
    OTHER: 9
};

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getNotaryContract(signer) {
    const ethers = window.ethers;
    if (!ethers) throw new Error('ethers.js not loaded');
    if (!signer) throw new Error('Signer is required for write operations');
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, signer);
}

async function getNotaryContractReadOnly() {
    const ethers = window.ethers;
    if (!ethers) throw new Error('ethers.js not loaded');
    const { NetworkManager } = await import('../core/index.js');
    const provider = NetworkManager.getProvider();
    if (!provider) throw new Error('Provider not available');
    const contracts = getContracts();
    return new ethers.Contract(contracts.NOTARY, NOTARY_ABI, provider);
}

function isValidBytes32(hash) {
    if (!hash) return false;
    const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;
    return /^0x[a-fA-F0-9]{64}$/.test(cleanHash);
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Certifies a document on the blockchain
 * V9: certify(bytes32 documentHash, string meta, uint8 docType, address operator) payable
 * ETH-only fees — no BKC
 */
export async function certify({
    documentHash,
    meta = '',
    docType = 0,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;

    if (!documentHash) {
        throw new Error('Document hash is required');
    }

    const formattedHash = documentHash.startsWith('0x') ? documentHash : `0x${documentHash}`;

    if (!isValidBytes32(formattedHash)) {
        throw new Error('Invalid document hash format. Must be a valid bytes32 (64 hex characters)');
    }

    if (docType < 0 || docType > 9) {
        throw new Error('Document type must be between 0 and 9');
    }

    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'Certify',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'certify',
        args: () => [formattedHash, meta || '', docType, resolveOperator(storedOperator)],

        get value() { return ethFee; },

        validate: async (signer, userAddress) => {
            const contract = await getNotaryContractReadOnly();

            // Check if already certified
            const result = await contract.verify(formattedHash);
            if (result.exists) {
                throw new Error('This document hash has already been certified');
            }

            // Calculate ETH fee client-side
            ethFee = await calculateFeeClientSide(ethers.id('NOTARY_CERTIFY'));
            console.log('[NotaryTx] Fee:', ethers.formatEther(ethFee), 'ETH');

            // Check ETH balance
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minEthNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minEthNeeded) {
                throw new Error(`Insufficient ETH. Need ~${ethers.formatEther(minEthNeeded)} ETH for fee + gas`);
            }
        },

        onSuccess: async (receipt) => {
            let certId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'Certified') {
                            certId = Number(parsed.args.certId);
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, certId);
        },

        onError: (error) => {
            console.error('[NotaryTx] Certification failed:', error);
            if (onError) onError(error);
        }
    });
}

// Keep backward-compatible alias
export const notarize = certify;

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * Verifies if a document hash was certified
 * V9: verify() returns (exists, owner, timestamp, docType, meta)
 */
export async function verify(documentHash) {
    const contract = await getNotaryContractReadOnly();
    const formattedHash = documentHash.startsWith('0x') ? documentHash : `0x${documentHash}`;

    try {
        const result = await contract.verify(formattedHash);
        return {
            exists: result.exists,
            owner: result.exists ? result.owner : null,
            timestamp: result.exists ? Number(result.timestamp) : null,
            date: result.exists ? new Date(Number(result.timestamp) * 1000) : null,
            docType: result.exists ? Number(result.docType) : null,
            meta: result.exists ? result.meta : null
        };
    } catch (error) {
        console.error('[NotaryTx] verify error:', error);
        return { exists: false, owner: null, timestamp: null, date: null, docType: null, meta: null };
    }
}

// Backward-compatible alias
export const verifyByHash = verify;

/**
 * Gets certificate by sequential ID
 * V9: getCertificate() returns (documentHash, owner, timestamp, docType, meta)
 */
export async function getCertificate(certId) {
    const contract = await getNotaryContractReadOnly();

    try {
        const result = await contract.getCertificate(certId);
        if (result.documentHash === '0x' + '0'.repeat(64)) return null;

        return {
            id: certId,
            documentHash: result.documentHash,
            owner: result.owner,
            timestamp: Number(result.timestamp),
            date: new Date(Number(result.timestamp) * 1000),
            docType: Number(result.docType),
            meta: result.meta
        };
    } catch {
        return null;
    }
}

// Backward-compatible alias
export const getDocument = getCertificate;

/**
 * Gets current certification fee (ETH only)
 * V9: getFee() returns single uint256
 */
export async function getFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('NOTARY_CERTIFY'));
    return {
        ethFee: fee,
        ethFormatted: ethers.formatEther(fee) + ' ETH'
    };
}

/**
 * Gets total number of certified documents
 */
export async function getTotalDocuments() {
    const contract = await getNotaryContractReadOnly();
    return Number(await contract.certCount());
}

/**
 * Gets certification statistics
 * V9: getStats() returns 2-tuple (certCount, totalEthCollected)
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getNotaryContractReadOnly();

    const stats = await contract.getStats();
    return {
        totalCertifications: Number(stats.certCount || stats[0]),
        totalETHCollected: stats.totalEthCollected || stats[1],
        totalETHFormatted: ethers.formatEther(stats.totalEthCollected || stats[1])
    };
}

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================

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

export async function verifyDocumentHash(fileContent, expectedHash) {
    const calculatedHash = await calculateFileHash(fileContent);
    return normalizeHash(expectedHash) === normalizeHash(calculatedHash);
}

function normalizeHash(hash) {
    return (hash.startsWith('0x') ? hash : `0x${hash}`).toLowerCase();
}

export async function verifyDocumentOnChain(fileContent, expectedHash) {
    const hash = expectedHash || await calculateFileHash(fileContent);
    const onChainResult = await verify(hash);

    let hashMatches = true;
    if (expectedHash) {
        hashMatches = await verifyDocumentHash(fileContent, expectedHash);
    }

    return {
        contentHash: hash,
        hashMatches,
        existsOnChain: onChainResult.exists,
        certId: null, // V9: no tokenId, use hash as key
        owner: onChainResult.owner,
        timestamp: onChainResult.timestamp,
        date: onChainResult.date,
        docType: onChainResult.docType,
        isVerified: hashMatches && onChainResult.exists
    };
}

// ============================================================================
// 6. EXPORT
// ============================================================================

export const NotaryTx = {
    // Write functions
    certify,
    notarize, // backward-compatible alias

    // Read helpers
    verify,
    verifyByHash, // backward-compatible alias
    getCertificate,
    getDocument, // backward-compatible alias
    getTotalDocuments,
    getFee,
    getStats,

    // Utilities
    calculateFileHash,
    verifyDocumentHash,
    verifyDocumentOnChain,

    // Constants
    DOC_TYPES
};

export default NotaryTx;
