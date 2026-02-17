// modules/core/irys-uploader.js
// Media Upload Pipeline — Optimize + Permanent Storage (Lighthouse/Filecoin)
//
// Flow: file → client-side optimization → POST /api/upload-media (Lighthouse) → IPFS+Filecoin
//
// Lighthouse: pay once, stored forever on IPFS + Filecoin. ~$0.005/GB.
// No MetaMask required — server-side upload via API key.

import { optimizeMedia } from './media-optimizer.js';

// ============================================================================
// CONFIG
// ============================================================================

export const UPLOAD_CONFIG = {
    gateway: 'https://gateway.lighthouse.storage/ipfs',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: {
        document: ['application/pdf', 'text/plain', 'application/json', 'text/html', 'text/csv'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
    }
};

// Keep old name for backward compat
export const IRYS_CONFIG = UPLOAD_CONFIG;

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a File with automatic optimization + permanent storage.
 *
 * Pipeline: optimize (Canvas WebP) → POST /api/upload-media → Lighthouse (IPFS+Filecoin)
 *
 * @param {File} file - Browser File object
 * @param {object} [options] - Upload options
 * @param {Array<{name:string, value:string}>} [options.tags] - Metadata tags (stored as form fields)
 * @param {function} [options.onProgress] - Progress callback (phase, detail)
 * @param {object} [options.optimize] - Optimization options (maxWidth, quality, etc.)
 * @param {boolean} [options.skipOptimize] - Skip optimization (e.g., for pre-optimized files)
 * @returns {Promise<{id: string, url: string, size: number, type: string}>}
 */
export async function uploadFile(file, options = {}) {
    if (!file || !file.size) throw new Error('No file provided');
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`);
    }

    const onProgress = options.onProgress || (() => {});

    // Step 1: Optimize media (images → WebP, videos → size check)
    let optimized = file;
    if (!options.skipOptimize) {
        onProgress('optimizing', 'Optimizing media...');
        optimized = await optimizeMedia(file, options.optimize || {});
    }

    // Step 2: Upload via server API (Lighthouse — permanent IPFS+Filecoin)
    onProgress('uploading', `Uploading ${_formatSize(optimized.size)} to permanent storage...`);

    const formData = new FormData();
    formData.append('file', optimized);

    const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.ipfsHash) {
        throw new Error('Upload returned no hash');
    }

    const result = {
        id: data.ipfsHash,
        url: `${UPLOAD_CONFIG.gateway}/${data.ipfsHash}`,
        size: optimized.size,
        type: optimized.type
    };

    console.log(`[Upload] Permanent (Lighthouse): ${result.url} (${_formatSize(optimized.size)})`);
    onProgress('done', result.url);
    return result;
}

/**
 * Upload raw string or buffer data via API.
 *
 * @param {string|object} data - Data to upload (string or JSON-serializable object)
 * @param {object} [options] - Upload options
 * @param {string} [options.contentType] - MIME type (default: application/json)
 * @param {string} [options.fileName] - File name (default: data.json)
 * @returns {Promise<{id: string, url: string, size: number}>}
 */
export async function uploadData(data, options = {}) {
    const contentType = options.contentType || 'application/json';
    const fileName = options.fileName || 'data.json';
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    const blob = new Blob([dataStr], { type: contentType });
    const file = new File([blob], fileName, { type: contentType });

    const result = await uploadFile(file, { skipOptimize: true });
    return result;
}

// ============================================================================
// PRICE ESTIMATE
// ============================================================================

/**
 * Estimate the upload cost for a given number of bytes.
 * Lighthouse is ~$0.005/GB. Returns a formatted estimate.
 *
 * @param {number} bytes - File size in bytes
 * @returns {Promise<{cost: bigint, costFormatted: string}>}
 */
export async function getUploadPrice(bytes) {
    // Lighthouse: ~$0.005/GB = effectively free for small files
    // Return 0 cost since it's server-side (user doesn't pay directly)
    return {
        cost: 0n,
        costFormatted: 'Free (permanent storage)'
    };
}

// ============================================================================
// UNIVERSAL URL RESOLVER
// ============================================================================

const IPFS_GATEWAYS = [
    'https://gateway.lighthouse.storage/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/'
];

/**
 * Universal content URL resolver.
 * Handles: ar://txId, ipfs://Qm..., bare CIDs (Qm.../bafy...), bare Arweave TX IDs,
 * Irys devnet URLs, and full HTTP URLs.
 *
 * @param {string} uri - Content URI in any format
 * @returns {string|null} Full HTTP gateway URL
 */
export function resolveContentUrl(uri) {
    if (!uri) return null;

    const trimmed = uri.trim();

    // Already a full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Rewrite old Irys devnet URLs to Lighthouse gateway
        if (trimmed.includes('devnet.irys.xyz/')) {
            const txId = trimmed.split('devnet.irys.xyz/')[1];
            if (txId) return `https://gateway.irys.xyz/${txId}`;
        }
        return trimmed;
    }

    // ar://txId → Arweave gateway (for existing Arweave content)
    // Detect IPFS CIDs stored with wrong ar:// prefix (legacy bug)
    if (trimmed.startsWith('ar://')) {
        const txId = trimmed.slice(5);
        if (txId.startsWith('Qm') || txId.startsWith('bafy')) {
            return `${IPFS_GATEWAYS[0]}${txId}`;
        }
        return `https://gateway.irys.xyz/${txId}`;
    }

    // ipfs://CID → IPFS gateway
    if (trimmed.startsWith('ipfs://')) {
        const cid = trimmed.slice(7);
        return `${IPFS_GATEWAYS[0]}${cid}`;
    }

    // IPFS CID detection: starts with Qm (CIDv0, 46 chars) or bafy (CIDv1)
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(trimmed) || trimmed.startsWith('bafy')) {
        return `${IPFS_GATEWAYS[0]}${trimmed}`;
    }

    // Arweave/Irys TX ID: 43-44 chars, base64url charset (for existing content)
    if (/^[a-zA-Z0-9_-]{43,44}$/.test(trimmed) && !trimmed.startsWith('Qm')) {
        return `https://gateway.irys.xyz/${trimmed}`;
    }

    // Fallback: try as IPFS CID
    if (trimmed.length > 10) {
        return `${IPFS_GATEWAYS[0]}${trimmed}`;
    }

    return null;
}

/**
 * Check if a URI points to Arweave content.
 *
 * @param {string} uri - Content URI
 * @returns {boolean}
 */
export function isArweaveContent(uri) {
    if (!uri) return false;
    const trimmed = uri.trim();
    if (trimmed.startsWith('ar://')) return true;
    if (trimmed.includes('irys.xyz/') || trimmed.includes('arweave.net/')) return true;
    if (/^[a-zA-Z0-9_-]{43}$/.test(trimmed) && !trimmed.startsWith('Qm')) return true;
    return false;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
