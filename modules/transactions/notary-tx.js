// modules/transactions/notary-tx.js
// ✅ V5.0 - Notary V5 — Cartório Digital (ERC-721)
//
// V5 CHANGES (over V4):
// - REMOVED: boostCertificate, getBoostCost, isBoosted, CertificateBoosted event
// - REMOVED: boost fields from verify/getCertificate/getCertificatesBatch
// - ADDED: registerAsset, transferAsset, addAnnotation
// - ADDED: getAsset, getAnnotation, getAnnotationCount, isAsset
// - ADDED: getAssetRegisterFee, getAssetTransferFee, getAnnotateFee
// - UPDATED: getStats returns (certCount, totalTransfers, assetCount, annotationTotal)
//
// ============================================================================
// V5 FEE STRUCTURE:
// - 10 per-type certify fees (General/Identity/Other cheapest → Property/Legal/Medical premium)
// - Transfer fee (cert transfer via documentHash)
// - Asset Register fee (premium — 0.001 BNB)
// - Asset Transfer fee (financial — 0.0005 BNB)
// - Annotation fee (content — 0.0002 BNB)
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
 * Notary V5 ABI
 */
const NOTARY_ABI = [
    // Write functions — Certificates
    'function certify(bytes32 documentHash, string calldata meta, uint8 docType, address operator) external payable returns (uint256 certId)',
    'function batchCertify(bytes32[] calldata documentHashes, string[] calldata metas, uint8[] calldata docTypes, address operator) external payable returns (uint256 startId)',
    'function transferCertificate(bytes32 documentHash, address newOwner, address operator) external payable',

    // Write functions — Assets
    'function registerAsset(uint8 assetType, string calldata meta, bytes32 documentHash, address operator) external payable returns (uint256 tokenId)',
    'function transferAsset(uint256 tokenId, address newOwner, uint256 declaredValue, string calldata meta, address operator) external payable',
    'function addAnnotation(uint256 tokenId, uint8 annotationType, string calldata meta, address operator) external payable returns (uint256 annotationId)',

    // Write functions — Admin
    'function setBaseURI(string calldata newBaseURI) external',

    // ERC-721 write functions
    'function approve(address to, uint256 tokenId) external',
    'function setApprovalForAll(address operator, bool approved) external',
    'function transferFrom(address from, address to, uint256 tokenId) external',
    'function safeTransferFrom(address from, address to, uint256 tokenId) external',

    // Read functions — Certificates
    'function verify(bytes32 documentHash) view returns (bool exists, address owner, uint48 timestamp, uint8 docType, string memory meta)',
    'function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)',
    'function getCertificatesBatch(uint256 start, uint256 count) view returns (bytes32[] memory hashes, address[] memory owners, uint48[] memory timestamps, uint8[] memory docTypes)',
    'function getFee() view returns (uint256)',

    // Read functions — Assets
    'function getAsset(uint256 tokenId) view returns (address owner, uint48 registeredAt, uint8 assetType, uint8 annotationCount, uint32 transferCount, string memory meta, bytes32 documentHash)',
    'function getAnnotation(uint256 tokenId, uint256 index) view returns (address author, uint48 timestamp, uint8 annotationType, string memory meta)',
    'function getAnnotationCount(uint256 tokenId) view returns (uint256)',
    'function isAsset(uint256 tokenId) view returns (bool)',

    // Read functions — Global
    'function getStats() view returns (uint256 certCount, uint256 totalTransfers, uint256 assetCount, uint256 annotationTotal)',
    'function certCount() view returns (uint256)',
    'function assetCount() view returns (uint256)',
    'function annotationTotal() view returns (uint256)',
    'function version() view returns (string)',
    'function MAX_BATCH_SIZE() view returns (uint8)',
    'function MAX_ASSET_TYPE() view returns (uint8)',
    'function MAX_ANNOTATION_TYPE() view returns (uint8)',

    // ERC-721 read functions
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)',

    // Events — Certificates
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 indexed documentHash, uint8 docType, address operator)',
    'event BatchCertified(address indexed owner, uint256 startId, uint256 count, address operator)',
    'event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)',

    // Events — Assets
    'event AssetRegistered(uint256 indexed tokenId, address indexed owner, uint8 assetType, bytes32 documentHash, address operator)',
    'event AssetTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 declaredValue, uint48 timestamp)',
    'event AnnotationAdded(uint256 indexed tokenId, uint256 indexed annotationId, address indexed author, uint8 annotationType)',
    'event BaseURIUpdated(string newBaseURI)',

    // ERC-721 events
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
];

// Document types (0-9)
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

// Asset types (0-3)
const ASSET_TYPES = {
    IMOVEL: 0,     // Real Estate
    VEICULO: 1,    // Vehicle
    IP: 2,         // Intellectual Property
    OUTROS: 3      // Others
};

const ASSET_TYPE_NAMES = [
    'Imóvel', 'Veículo', 'Propriedade Intelectual', 'Outros'
];

// Annotation types (0-6)
const ANNOTATION_TYPES = {
    HIPOTECA: 0,
    PENHORA: 1,
    ORDEM_JUDICIAL: 2,
    SEGURO: 3,
    REFORMA: 4,
    OBSERVACAO: 5,
    CANCELAMENTO: 6
};

const ANNOTATION_TYPE_NAMES = [
    'Hipoteca', 'Penhora', 'Ordem Judicial', 'Seguro',
    'Reforma', 'Observação', 'Cancelamento'
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
 */
function getCertifyActionId() {
    return window.ethers.id('NOTARY_CERTIFY');
}

// Minimum fee — prevents $0 fee on low-gas testnets
const MIN_CERTIFY_FEE = 400000000000000n; // 0.0004 BNB

function formatHash(hash) {
    return hash.startsWith('0x') ? hash : `0x${hash}`;
}

// ============================================================================
// 3. TRANSACTION FUNCTIONS — CERTIFICATES
// ============================================================================

/**
 * Certifies a document on the blockchain
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
            console.log(`[NotaryTx] Certify fee:`, ethers.formatEther(ethFee), 'BNB');

            // Check ETH balance
            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minEthNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minEthNeeded) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(minEthNeeded)} BNB for fee + gas`);
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
 * Transfers certificate ownership
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

            // Calculate transfer fee client-side
            ethFee = await calculateFeeClientSide(ethers.id('NOTARY_TRANSFER'));
            console.log('[NotaryTx] Transfer fee:', ethers.formatEther(ethFee), 'BNB');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minNeeded) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(minNeeded)} BNB for transfer + gas`);
            }
        },

        onSuccess,
        onError
    });
}

// ============================================================================
// 3b. TRANSACTION FUNCTIONS — ASSETS
// ============================================================================

/**
 * Registers a new asset (imóvel, veículo, IP, etc.)
 */
export async function registerAsset({
    assetType = 0,
    meta = '',
    documentHash = '0x' + '0'.repeat(64),
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (assetType < 0 || assetType > 3) throw new Error('Asset type must be between 0 and 3');

    const formattedDocHash = documentHash ? formatHash(documentHash) : '0x' + '0'.repeat(64);
    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'RegisterAsset',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'registerAsset',
        args: () => [assetType, meta || '', formattedDocHash, resolveOperator(storedOperator)],
        get value() { return ethFee; },

        validate: async (signer, userAddress) => {
            ethFee = await calculateFeeClientSide(ethers.id('ASSET_REGISTER'));
            console.log('[NotaryTx] Asset register fee:', ethers.formatEther(ethFee), 'BNB');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minNeeded) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(minNeeded)} BNB for registration + gas`);
            }
        },

        onSuccess: async (receipt) => {
            let tokenId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'AssetRegistered') {
                            tokenId = Number(parsed.args.tokenId);
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, tokenId);
        },

        onError: (error) => {
            console.error('[NotaryTx] Asset registration failed:', error);
            if (onError) onError(error);
        }
    });
}

/**
 * Transfers asset ownership with audit trail
 */
export async function transferAsset({
    tokenId,
    newOwner,
    declaredValue = 0n,
    meta = '',
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (!tokenId) throw new Error('Token ID is required');
    if (!newOwner || newOwner === ethers.ZeroAddress) throw new Error('Valid recipient address is required');

    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'TransferAsset',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'transferAsset',
        args: () => [tokenId, newOwner, declaredValue, meta || '', resolveOperator(storedOperator)],
        get value() { return ethFee; },

        validate: async (signer, userAddress) => {
            const contract = await getNotaryContractReadOnly();

            // Check asset exists
            const asset = await contract.getAsset(tokenId);
            if (Number(asset.registeredAt) === 0) throw new Error('Asset not found');

            // Check ownership or approval
            const owner = await contract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                // Check if approved
                const approved = await contract.getApproved(tokenId);
                const isApprovedForAll = await contract.isApprovedForAll(owner, userAddress);
                if (approved.toLowerCase() !== userAddress.toLowerCase() && !isApprovedForAll) {
                    throw new Error('Only the asset owner or approved operator can transfer it');
                }
            }

            if (newOwner.toLowerCase() === userAddress.toLowerCase()) {
                throw new Error('Cannot transfer to yourself');
            }

            ethFee = await calculateFeeClientSide(ethers.id('ASSET_TRANSFER'));
            console.log('[NotaryTx] Asset transfer fee:', ethers.formatEther(ethFee), 'BNB');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minNeeded) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(minNeeded)} BNB for transfer + gas`);
            }
        },

        onSuccess,
        onError
    });
}

/**
 * Adds an annotation (averbação) to an asset
 */
export async function addAnnotation({
    tokenId,
    annotationType = 5, // Observação
    meta = '',
    operator,
    button = null,
    onSuccess = null,
    onError = null
}) {
    const ethers = window.ethers;
    if (!tokenId) throw new Error('Token ID is required');
    if (annotationType < 0 || annotationType > 6) throw new Error('Annotation type must be between 0 and 6');

    let storedOperator = operator;
    let ethFee = 0n;

    return await txEngine.execute({
        name: 'AddAnnotation',
        button,

        getContract: async (signer) => getNotaryContract(signer),
        method: 'addAnnotation',
        args: () => [tokenId, annotationType, meta || '', resolveOperator(storedOperator)],
        get value() { return ethFee; },

        validate: async (signer, userAddress) => {
            const contract = await getNotaryContractReadOnly();

            // Check asset exists
            const asset = await contract.getAsset(tokenId);
            if (Number(asset.registeredAt) === 0) throw new Error('Asset not found');

            // Check ownership or approval
            const owner = await contract.ownerOf(tokenId);
            if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                const approved = await contract.getApproved(tokenId);
                const isApprovedForAll = await contract.isApprovedForAll(owner, userAddress);
                if (approved.toLowerCase() !== userAddress.toLowerCase() && !isApprovedForAll) {
                    throw new Error('Only the asset owner or approved operator can add annotations');
                }
            }

            ethFee = await calculateFeeClientSide(ethers.id('ASSET_ANNOTATE'));
            console.log('[NotaryTx] Annotation fee:', ethers.formatEther(ethFee), 'BNB');

            const { NetworkManager } = await import('../core/index.js');
            const provider = NetworkManager.getProvider();
            const ethBalance = await provider.getBalance(userAddress);
            const minNeeded = ethFee + ethers.parseEther('0.001');
            if (ethBalance < minNeeded) {
                throw new Error(`Insufficient BNB. Need ~${ethers.formatEther(minNeeded)} BNB for annotation + gas`);
            }
        },

        onSuccess: async (receipt) => {
            let annotationId = null;
            try {
                const iface = new ethers.Interface(NOTARY_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === 'AnnotationAdded') {
                            annotationId = Number(parsed.args.annotationId);
                            break;
                        }
                    } catch {}
                }
            } catch {}
            if (onSuccess) onSuccess(receipt, annotationId);
        },

        onError: (error) => {
            console.error('[NotaryTx] Annotation failed:', error);
            if (onError) onError(error);
        }
    });
}

// ============================================================================
// 4. READ FUNCTIONS — CERTIFICATES
// ============================================================================

/**
 * Verifies if a document hash was certified
 * V5: Returns 5 fields (no boost)
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
 * V5: Returns 5 fields (no boost)
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
 * Gets certificates in batch
 * V5: No boost fields
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
                docType: Number(result.docTypes[i])
            });
        }
        return certs;
    } catch (error) {
        console.error('[NotaryTx] getCertificatesBatch error:', error);
        return [];
    }
}

// ============================================================================
// 4b. READ FUNCTIONS — ASSETS
// ============================================================================

/**
 * Gets asset data by tokenId
 */
export async function getAsset(tokenId) {
    const contract = await getNotaryContractReadOnly();

    try {
        const result = await contract.getAsset(tokenId);
        if (Number(result.registeredAt) === 0) return null;

        return {
            id: tokenId,
            owner: result.owner,
            registeredAt: Number(result.registeredAt),
            date: new Date(Number(result.registeredAt) * 1000),
            assetType: Number(result.assetType),
            assetTypeName: ASSET_TYPE_NAMES[Number(result.assetType)] || 'Outros',
            annotationCount: Number(result.annotationCount),
            transferCount: Number(result.transferCount),
            meta: result.meta,
            documentHash: result.documentHash
        };
    } catch {
        return null;
    }
}

/**
 * Gets annotation data
 */
export async function getAnnotation(tokenId, index) {
    const contract = await getNotaryContractReadOnly();

    try {
        const result = await contract.getAnnotation(tokenId, index);
        if (result.author === '0x' + '0'.repeat(40)) return null;

        return {
            tokenId,
            index,
            author: result.author,
            timestamp: Number(result.timestamp),
            date: new Date(Number(result.timestamp) * 1000),
            annotationType: Number(result.annotationType),
            annotationTypeName: ANNOTATION_TYPE_NAMES[Number(result.annotationType)] || 'Observação',
            meta: result.meta
        };
    } catch {
        return null;
    }
}

/**
 * Gets all annotations for an asset
 */
export async function getAnnotations(tokenId) {
    const contract = await getNotaryContractReadOnly();

    try {
        const count = Number(await contract.getAnnotationCount(tokenId));
        const annotations = [];
        for (let i = 0; i < count; i++) {
            const ann = await getAnnotation(tokenId, i);
            if (ann) annotations.push(ann);
        }
        return annotations;
    } catch {
        return [];
    }
}

/**
 * Checks if a tokenId is an asset (vs certificate)
 */
export async function isAsset(tokenId) {
    const contract = await getNotaryContractReadOnly();
    try {
        return await contract.isAsset(tokenId);
    } catch {
        return false;
    }
}

// ============================================================================
// 5. FEE FUNCTIONS
// ============================================================================

/**
 * Gets per-docType certification fee (BNB)
 */
export async function getCertifyFee(docType = 0) {
    const ethers = window.ethers;
    const actionId = getCertifyActionId();
    let fee = await calculateFeeClientSide(actionId);
    if (fee < MIN_CERTIFY_FEE) fee = MIN_CERTIFY_FEE;
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' BNB',
        docType,
        typeName: DOC_TYPE_NAMES[docType] || 'Unknown'
    };
}

/**
 * Gets current certification fee (backward compat)
 */
export async function getFee() {
    return getCertifyFee(0);
}

/**
 * Gets transfer fee (certificate)
 */
export async function getTransferFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('NOTARY_TRANSFER'));
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' BNB'
    };
}

/**
 * Gets asset registration fee
 */
export async function getAssetRegisterFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('ASSET_REGISTER'));
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' BNB'
    };
}

/**
 * Gets asset transfer fee
 */
export async function getAssetTransferFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('ASSET_TRANSFER'));
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' BNB'
    };
}

/**
 * Gets annotation fee
 */
export async function getAnnotateFee() {
    const ethers = window.ethers;
    const fee = await calculateFeeClientSide(ethers.id('ASSET_ANNOTATE'));
    return {
        fee,
        formatted: ethers.formatEther(fee) + ' BNB'
    };
}

// ============================================================================
// 6. STATS & TOTAL
// ============================================================================

/**
 * Gets total number of certified documents + assets
 */
export async function getTotalDocuments() {
    const contract = await getNotaryContractReadOnly();
    return Number(await contract.certCount());
}

/**
 * Gets certification statistics
 * V5: Returns (certCount, totalTransfers, assetCount, annotationTotal)
 */
export async function getStats() {
    const contract = await getNotaryContractReadOnly();

    const stats = await contract.getStats();
    return {
        totalCertifications: Number(stats[0]),
        totalTransfers: Number(stats[1]),
        totalAssets: Number(stats[2]),
        totalAnnotations: Number(stats[3])
    };
}

// ============================================================================
// 7. UTILITY FUNCTIONS
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
        isVerified: hashMatches && onChainResult.exists
    };
}

// ============================================================================
// 8. EXPORT
// ============================================================================

export const NotaryTx = {
    // Write functions — Certificates
    certify,
    notarize, // backward-compatible alias
    transferCertificate,

    // Write functions — Assets
    registerAsset,
    transferAsset,
    addAnnotation,

    // Read helpers — Certificates
    verify,
    verifyByHash, // backward-compatible alias
    getCertificate,
    getDocument, // backward-compatible alias
    getCertificatesBatch,

    // Read helpers — Assets
    getAsset,
    getAnnotation,
    getAnnotations,
    isAsset,

    // Fee helpers
    getFee,
    getCertifyFee,
    getTransferFee,
    getAssetRegisterFee,
    getAssetTransferFee,
    getAnnotateFee,

    // Stats
    getTotalDocuments,
    getStats,

    // Utilities
    calculateFileHash,
    calculateTextHash,
    verifyDocumentHash,
    verifyDocumentOnChain,
    getCertifyActionId,

    // Constants
    DOC_TYPES,
    DOC_TYPE_NAMES,
    ASSET_TYPES,
    ASSET_TYPE_NAMES,
    ANNOTATION_TYPES,
    ANNOTATION_TYPE_NAMES
};

export default NotaryTx;
