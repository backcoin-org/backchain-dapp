// modules/js/transactions/notary-tx.js
// ✅ V4.0 - Updated for Notary V4 (native ERC-721 NFTs + all V3 features)
//
// CHANGES V3.0:
// - Per-docType fee: keccak256(abi.encode("NOTARY_CERTIFY_T", docType)) for 10 types
// - boostCertificate(bytes32, uint256 days_, address operator) payable
// - transferCertificate(bytes32, address, address) payable — added operator + fee
// - verify/getCertificate return 7 fields (added boosted, boostExpiry)
// - getCertificatesBatch(uint256, uint256) — batch reads
// - getStats() returns 4-tuple (certCount, totalEthCollected, totalBoostRevenue, totalTransfers)
// - isBoosted(bytes32) view — check if cert is boosted
// - CertificateBoosted event
//
// ============================================================================
// V3 FEE STRUCTURE:
// - 10 per-type certify fees (General/Identity/Other cheapest → Property/Legal/Medical premium)
// - Boost fee (per-day, like CHARITY_BOOST)
// - Transfer fee (small gas-based fee)
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
 * Notary V3 ABI
 */
const NOTARY_ABI = [
    // Write functions
    'function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)',
    'function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)',
    'function boostCertificate(bytes32 documentHash, uint256 days_, address operator) external payable',
    'function transferCertificate(bytes32 documentHash, address newOwner, address operator) external payable',

    // ERC-721 write functions
    'function approve(address to, uint256 tokenId) external',
    'function setApprovalForAll(address operator, bool approved) external',
    'function transferFrom(address from, address to, uint256 tokenId) external',
    'function safeTransferFrom(address from, address to, uint256 tokenId) external',

    // Read functions
    'function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta, bool boosted, uint32 boostExpiry)',
    'function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta, bool boosted, uint32 boostExpiry)',
    'function getCertificatesBatch(uint256 start, uint256 count) view returns (bytes32[] memory hashes, address[] memory owners, uint48[] memory timestamps, uint8[] memory docTypes, bool[] memory boostedFlags, uint32[] memory boostExpiries)',
    'function getFee() view returns (uint256)',
    'function isBoosted(bytes32 documentHash) view returns (bool)',
    'function getStats() view returns (uint256 certCount, uint256 totalEthCollected, uint256 totalBoostRevenue, uint256 totalTransfers)',
    'function certCount() view returns (uint256)',
    'function version() view returns (string)',
    'function MAX_BATCH_SIZE() view returns (uint8)',
    'function MAX_BOOST_DAYS() view returns (uint8)',

    // ERC-721 read functions
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)',

    // Notary events
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)',
    'event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)',
    'event CertificateBoosted(bytes32 indexed documentHash, address indexed booster, uint32 boostExpiry, address operator)',
    'event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)',

    // ERC-721 events
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
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

const DOC_TYPE_NAMES = [
    'General', 'Contract', 'Identity', 'Diploma', 'Property',
    'Financial', 'Legal', 'Medical', 'IP', 'Other'
];

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

/**
 * Action ID for certification fee.
 * Ecosystem contract uses flat fee: ethers.id("NOTARY_CERTIFY")
 * (per-docType IDs were planned but never configured on-chain)
 */
function getCertifyActionId() {
    return window.ethers.id('NOTARY_CERTIFY');
}

// Minimum fee ~$1 at ~$2500/ETH — prevents $0 fee on low-gas testnets
const MIN_CERTIFY_FEE = 400000000000000n; // 0.0004 ETH

function formatHash(hash) {
    return hash.startsWith('0x') ? hash : `0x${hash}`;
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Certifies a document on the blockchain
 * V3: Per-docType fees via calculateFeeClientSide
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

    if (!documentHash) throw new Error('Document hash is required');

    const formattedHash = formatHash(documentHash);
    if (!isValidBytes32(formattedHash)) {
        throw new Error('Invalid document hash format. Must be a valid bytes32 (64 hex characters)');
    }
    if (docType < 0 || docType > 9) throw new Error('Document type must be between 0 and 9');

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

            // Calculate fee client-side (gas-based)
            const actionId = getCertifyActionId();
            ethFee = await calculateFeeClientSide(actionId);
            if (ethFee < MIN_CERTIFY_FEE) ethFee = MIN_CERTIFY_FEE;
            console.log(`[NotaryTx] Certify fee:`, ethers.formatEther(ethFee), 'ETH');

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

// Backward-compatible alias
export const notarize = certify;

/**
 * Boosts a certificate (featured for X days)
 * V3: boostCertificate(bytes32, uint256, address) payable
 */
export async function boostCertificate({
    documentHash,
    days = 1,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (!documentHash) throw new Error('Document hash is required');
    if (days < 1 || days > 30) throw new Error('Boost duration must be 1-30 days');

    const formattedHash = formatHash(documentHash);
    let storedOperator = operator;
    let totalFee = 0n;

    return await txEngine.execute({
        name: 'BoostCertificate',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'boostCertificate',
        args: () => [formattedHash, days, resolveOperator(storedOperator)],
        get value() { return totalFee; },

        validate: async (signer, userAddress) => {
            const contract = await getNotaryContractReadOnly();

            // Check cert exists
            const result = await contract.verify(formattedHash);
            if (!result.exists) throw new Error('Certificate not found');

            // Calculate boost cost client-side (per-day fee × days)
            const feePerDay = await calculateFeeClientSide(ethers.id('NOTARY_BOOST'));
            totalFee = feePerDay * BigInt(days);

            // Boost fee may be 0 if not configured on-chain

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            if (ethBalance < totalFee + ethers.parseEther('0.001')) {
                throw new Error(`Insufficient ETH. Need ~${ethers.formatEther(totalFee)} ETH for ${days}-day boost`);
            }
        },

        onSuccess,
        onError
    });
}

/**
 * Transfers certificate ownership
 * V3: transferCertificate(bytes32, address, address) payable — operator + fee
 */
export async function transferCertificate({
    documentHash,
    newOwner,
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (!documentHash) throw new Error('Document hash is required');
    if (!newOwner || newOwner === ethers.ZeroAddress) throw new Error('Valid recipient address is required');

    const formattedHash = formatHash(documentHash);
    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'TransferCertificate',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'transferCertificate',
        args: () => [formattedHash, newOwner, resolveOperator(storedOperator)],
        get value() { return ethFee; },

        validate: async (signer, userAddress) => {
            const contract = await getNotaryContractReadOnly();

            // Check cert exists and user is owner
            const result = await contract.verify(formattedHash);
            if (!result.exists) throw new Error('Certificate not found');
            if (result.owner.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Only the certificate owner can transfer it');
            }
            if (newOwner.toLowerCase() === userAddress.toLowerCase()) {
                throw new Error('Cannot transfer to yourself');
            }

            // Calculate transfer fee client-side (may be 0 if not configured)
            ethFee = await calculateFeeClientSide(ethers.id('NOTARY_TRANSFER'));
            console.log('[NotaryTx] Transfer fee:', ethers.formatEther(ethFee), 'ETH');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minNeeded) {
                throw new Error(`Insufficient ETH. Need ~${ethers.formatEther(minNeeded)} ETH for transfer + gas`);
            }
        },

        onSuccess,
        onError
    });
}

// ============================================================================
// 4. READ FUNCTIONS
// ============================================================================

/**
 * Verifies if a document hash was certified
 * V3: Returns 7 fields (added boosted, boostExpiry)
 */
export async function verify(documentHash) {
    const contract = await getNotaryContractReadOnly();
    const formattedHash = formatHash(documentHash);

    try {
        const result = await contract.verify(formattedHash);
        return {
            exists: result.exists,
            owner: result.exists ? result.owner : null,
            timestamp: result.exists ? Number(result.timestamp) : null,
            date: result.exists ? new Date(Number(result.timestamp) * 1000) : null,
            docType: result.exists ? Number(result.docType) : null,
            meta: result.exists ? result.meta : null,
            isBoosted: result.exists ? result.boosted : false,
            boostExpiry: result.exists ? Number(result.boostExpiry) : null
        };
    } catch (error) {
        console.error('[NotaryTx] verify error:', error);
        return { exists: false, owner: null, timestamp: null, date: null, docType: null, meta: null, isBoosted: false, boostExpiry: null };
    }
}

// Backward-compatible alias
export const verifyByHash = verify;

/**
 * Gets certificate by sequential ID
 * V3: Returns 7 fields (added boosted, boostExpiry)
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
            meta: result.meta,
            isBoosted: result.boosted,
            boostExpiry: Number(result.boostExpiry)
        };
    } catch {
        return null;
    }
}

// Backward-compatible alias
export const getDocument = getCertificate;

/**
 * Gets certificates in batch (V3)
 * Returns array of certificate objects
 */
export async function getCertificatesBatch(start, count) {
    const contract = await getNotaryContractReadOnly();

    try {
        const result = await contract.getCertificatesBatch(start, count);
        const certs = [];
        for (let i = 0; i < result.hashes.length; i++) {
            if (result.hashes[i] === '0x' + '0'.repeat(64)) continue;
            certs.push({
                id: start + i,
                documentHash: result.hashes[i],
                owner: result.owners[i],
                timestamp: Number(result.timestamps[i]),
                date: new Date(Number(result.timestamps[i]) * 1000),
                docType: Number(result.docTypes[i]),
                isBoosted: result.boostedFlags[i],
                boostExpiry: Number(result.boostExpiries[i])
            });
        }
        return certs;
    } catch (error) {
        console.error('[NotaryTx] getCertificatesBatch error:', error);
        return [];
    }
}

/**
 * Gets per-docType certification fee (ETH)
 * V3: Uses calculateFeeClientSide with per-type action ID
 */
export async function getCertifyFee(docType = 0) {
    const ethers = window.ethers;
    const actionId = getCertifyActionId();
    let fee = await calculateFeeClientSide(actionId);
    if (fee < MIN_CERTIFY_FEE) fee = MIN_CERTIFY_FEE;
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' ETH',
        docType,
        typeName: DOC_TYPE_NAMES[docType] || 'Unknown'
    };
}

/**
 * Gets current certification fee (backward compat — returns General type fee)
 */
export async function getFee() {
    return getCertifyFee(0);
}

/**
 * Gets boost cost for X days
 */
export async function getBoostCost(days = 1) {
    const ethers = window.ethers;
    const feePerDay = await calculateFeeClientSide(ethers.id('NOTARY_BOOST'));
    const totalFee = feePerDay * BigInt(days);
    return {
        feePerDay,
        feePerDayFormatted: ethers.formatEther(feePerDay),
        totalFee,
        totalFeeFormatted: ethers.formatEther(totalFee)
    };
}

/**
 * Gets transfer fee
 */
export async function getTransferFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('NOTARY_TRANSFER'));
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' ETH'
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
 * V3: Returns 4-tuple (certCount, totalEthCollected, totalBoostRevenue, totalTransfers)
 */
export async function getStats() {
    const ethers = window.ethers;
    const contract = await getNotaryContractReadOnly();

    const stats = await contract.getStats();
    return {
        totalCertifications: Number(stats[0]),
        totalETHCollected: stats[1],
        totalETHFormatted: ethers.formatEther(stats[1]),
        totalBoostRevenue: stats[2],
        totalBoostFormatted: ethers.formatEther(stats[2]),
        totalTransfers: Number(stats[3])
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

/**
 * Hash text content via SHA-256 (for text notarization)
 */
export async function calculateTextHash(text) {
    const buffer = new TextEncoder().encode(text);
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
        owner: onChainResult.owner,
        timestamp: onChainResult.timestamp,
        date: onChainResult.date,
        docType: onChainResult.docType,
        meta: onChainResult.meta,
        isBoosted: onChainResult.isBoosted,
        boostExpiry: onChainResult.boostExpiry,
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
    boostCertificate,
    transferCertificate,

    // Read helpers
    verify,
    verifyByHash, // backward-compatible alias
    getCertificate,
    getDocument, // backward-compatible alias
    getCertificatesBatch,
    getTotalDocuments,
    getFee,
    getCertifyFee,
    getBoostCost,
    getTransferFee,
    getStats,

    // Utilities
    calculateFileHash,
    calculateTextHash,
    verifyDocumentHash,
    verifyDocumentOnChain,
    getCertifyActionId,

    // Constants
    DOC_TYPES,
    DOC_TYPE_NAMES
};

export default NotaryTx;
