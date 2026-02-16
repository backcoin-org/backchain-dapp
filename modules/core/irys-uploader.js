// modules/core/irys-uploader.js
// Media Upload Pipeline — Optimize + Permanent Storage
//
// Flow: file → client-side optimization → Irys/Arweave (permanent) → Pinata fallback
//
// Irys/Arweave: pay once, stored forever. Devnet: free, data ~60 days.
// Pinata/IPFS: fallback when Irys unavailable.

import { sepoliaRpcUrl } from '../../config.js';
import { optimizeMedia } from './media-optimizer.js';

// ============================================================================
// CONFIG
// ============================================================================

export const IRYS_CONFIG = {
    gateway: 'https://devnet.irys.xyz',  // devnet data lives here (gateway.irys.xyz 302-redirects)
    devnet: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: {
        document: ['application/pdf', 'text/plain', 'application/json', 'text/html', 'text/csv'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
    }
};

// ============================================================================
// LAZY SINGLETON
// ============================================================================

let _uploader = null;
let _uploaderAddress = null; // Track which wallet address owns the cached uploader

/**
 * Get or create the Irys WebUploader instance.
 * Lazy-loads SDK only when first upload happens (not on page load).
 * Invalidates cache if wallet address changes.
 */
export async function getUploader() {
    const ethers = window.ethers;
    if (!ethers || !window.ethereum) {
        throw new Error('MetaMask not available. Connect your wallet first.');
    }

    let provider, signer, currentAddress;
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        currentAddress = await signer.getAddress();
        console.log(`[Irys] Wallet connected: ${currentAddress.slice(0, 10)}...`);
    } catch (e) {
        console.error('[Irys] Wallet connection failed:', e);
        throw new Error('Connect your wallet first. MetaMask error: ' + (e.message || e));
    }

    // Invalidate if wallet changed
    if (_uploader && _uploaderAddress !== currentAddress) {
        console.log('[Irys] Wallet changed, re-creating uploader');
        _uploader = null;
        _uploaderAddress = null;
    }

    if (_uploader) return _uploader;

    console.log('[Irys] Loading SDK...');

    let WebUploader, WebArbitrum, EthersV6Adapter;
    try {
        const modules = await Promise.all([
            import('@irys/web-upload'),
            import('@irys/web-upload-ethereum'),
            import('@irys/web-upload-ethereum-ethers-v6')
        ]);
        WebUploader = modules[0].WebUploader;
        WebArbitrum = modules[1].WebArbitrum;
        EthersV6Adapter = modules[2].EthersV6Adapter;
        console.log('[Irys] SDK modules loaded');
    } catch (e) {
        console.error('[Irys] Failed to load SDK modules:', e);

        // Stale chunk detection — after a rebuild, old chunk hashes no longer exist.
        // Auto-reload the page once to get fresh bundle references.
        if (e.message?.includes('Failed to fetch dynamically imported module')) {
            if (!sessionStorage.getItem('_irys_retry')) {
                sessionStorage.setItem('_irys_retry', '1');
                console.log('[Irys] Stale chunk detected, reloading page...');
                window.location.reload();
                return; // Unreachable, but satisfies linter
            }
            sessionStorage.removeItem('_irys_retry');
            throw new Error('Irys SDK failed to load. Please clear your browser cache (Ctrl+Shift+Del) and try again.');
        }

        throw new Error('Failed to load Irys SDK: ' + (e.message || e));
    }

    try {
        let builder = WebUploader(WebArbitrum).withAdapter(EthersV6Adapter(provider));

        if (IRYS_CONFIG.devnet) {
            builder = builder.withRpc(sepoliaRpcUrl).devnet();
        }

        console.log(`[Irys] Connecting to bundler node... (RPC: ${sepoliaRpcUrl?.slice(0, 40)}...)`);

        // Timeout after 15s to prevent indefinite hang
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Irys bundler connection timed out (15s). Check your network.')), 15000)
        );
        _uploader = await Promise.race([builder, timeout]);
        _uploaderAddress = currentAddress;
        console.log(`[Irys] Ready (${IRYS_CONFIG.devnet ? 'devnet' : 'mainnet'}) for ${currentAddress.slice(0, 6)}...`);
        return _uploader;
    } catch (e) {
        _uploader = null;
        _uploaderAddress = null;
        console.error('[Irys] SDK initialization failed:', e);
        throw new Error('Irys initialization failed: ' + (e.message || e));
    }
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a File with automatic optimization + permanent storage.
 *
 * Pipeline: optimize (Canvas WebP) → Irys/Arweave (permanent) → Pinata API (fallback)
 *
 * @param {File} file - Browser File object
 * @param {object} [options] - Upload options
 * @param {Array<{name:string, value:string}>} [options.tags] - Custom Arweave tags
 * @param {function} [options.onProgress] - Progress callback (phase, detail)
 * @param {object} [options.optimize] - Optimization options (maxWidth, quality, etc.)
 * @param {boolean} [options.skipOptimize] - Skip optimization (e.g., for pre-optimized files)
 * @returns {Promise<{id: string, url: string, size: number, type: string}>}
 */
export async function uploadFile(file, options = {}) {
    if (!file || !file.size) throw new Error('No file provided');
    if (file.size > IRYS_CONFIG.maxFileSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${IRYS_CONFIG.maxFileSize / 1024 / 1024}MB)`);
    }

    const onProgress = options.onProgress || (() => {});

    // Step 1: Optimize media (images → WebP, videos → size check)
    let optimized = file;
    if (!options.skipOptimize) {
        onProgress('optimizing', 'Optimizing media...');
        optimized = await optimizeMedia(file, options.optimize || {});
    }

    // Step 2: Primary — Irys/Arweave (permanent storage)
    try {
        onProgress('preparing', 'Connecting to Arweave...');
        const irys = await getUploader();

        const tags = [
            { name: 'App-Name', value: 'Backchain' },
            { name: 'Content-Type', value: optimized.type || 'application/octet-stream' },
            ...(options.tags || [])
        ];

        onProgress('pricing', 'Calculating storage cost...');
        const price = await irys.getPrice(optimized.size);
        const balance = await irys.getLoadedBalance();

        const priceBn = BigInt(price.toString());
        const balanceBn = BigInt(balance.toString());

        if (balanceBn < priceBn) {
            const deficit = priceBn - balanceBn;
            const fundAmount = (deficit * 120n) / 100n;
            onProgress('funding', `Funding Arweave storage (${_formatEth(fundAmount)})...`);
            console.log(`[Irys] Funding ${_formatEth(fundAmount)} (balance: ${_formatEth(balanceBn)}, price: ${_formatEth(priceBn)})`);
            await _manualFund(irys, fundAmount);
        }

        onProgress('uploading', `Uploading ${(optimized.size / 1024).toFixed(0)} KB to Arweave...`);
        const receipt = await irys.uploadFile(optimized, { tags });

        const result = {
            id: receipt.id,
            url: `${IRYS_CONFIG.gateway}/${receipt.id}`,
            size: optimized.size,
            type: optimized.type
        };

        console.log(`[Upload] Arweave permanent: ${result.url} (${(optimized.size / 1024).toFixed(0)} KB)`);
        onProgress('done', result.url);
        return result;
    } catch (irysErr) {
        console.warn('[Upload] Irys/Arweave failed, trying Pinata fallback:', irysErr.message);
    }

    // Step 3: Fallback — Pinata API (IPFS)
    try {
        onProgress('uploading', `Uploading ${(optimized.size / 1024).toFixed(0)} KB to IPFS...`);
        const result = await _uploadViaAPI(optimized);
        console.log(`[Upload] Pinata fallback: ${result.url} (${(optimized.size / 1024).toFixed(0)} KB)`);
        onProgress('done', result.url);
        return result;
    } catch (apiErr) {
        console.error('[Upload] Both Irys and Pinata failed:', apiErr.message);
        throw new Error('Upload failed. Please check your connection and try again.');
    }
}

/**
 * Upload file to server-side API (Pinata IPFS).
 * Uses /api/upload-media which accepts images, videos, and audio.
 */
async function _uploadViaAPI(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.ipfsHash) {
        throw new Error('Upload returned no hash');
    }

    return {
        id: data.ipfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`,
        size: file.size,
        type: file.type
    };
}

/**
 * Upload raw string or buffer data to Arweave via Irys.
 *
 * @param {string|ArrayBuffer} data - Data to upload
 * @param {object} [options] - Upload options
 * @param {string} [options.contentType] - MIME type (default: text/plain)
 * @param {Array<{name:string, value:string}>} [options.tags] - Custom Arweave tags
 * @returns {Promise<{id: string, url: string, size: number}>}
 */
export async function uploadData(data, options = {}) {
    const irys = await getUploader();
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const size = new Blob([dataStr]).size;

    const tags = [
        { name: 'App-Name', value: 'Backchain' },
        { name: 'Content-Type', value: options.contentType || 'text/plain' },
        ...(options.tags || [])
    ];

    // Check price & auto-fund
    const price = await irys.getPrice(size);
    const balance = await irys.getLoadedBalance();

    const priceBn = BigInt(price.toString());
    const balanceBn = BigInt(balance.toString());

    if (balanceBn < priceBn) {
        const deficit = priceBn - balanceBn;
        const fundAmount = (deficit * 120n) / 100n;
        await _manualFund(irys, fundAmount);
    }

    const receipt = await irys.upload(dataStr, { tags });

    return {
        id: receipt.id,
        url: `${IRYS_CONFIG.gateway}/${receipt.id}`,
        size
    };
}

// ============================================================================
// PRICE & BALANCE
// ============================================================================

/**
 * Get the upload cost for a given number of bytes.
 *
 * @param {number} bytes - File size in bytes
 * @returns {Promise<{cost: bigint, costFormatted: string}>}
 */
export async function getUploadPrice(bytes) {
    const irys = await getUploader();
    const price = await irys.getPrice(bytes);
    const priceBn = BigInt(price.toString());

    return {
        cost: priceBn,
        costFormatted: _formatEth(priceBn)
    };
}

/**
 * Get the current Irys balance for the connected wallet.
 *
 * @returns {Promise<{balance: bigint, balanceFormatted: string}>}
 */
export async function getBalance() {
    const irys = await getUploader();
    const balance = await irys.getLoadedBalance();
    const balanceBn = BigInt(balance.toString());

    return {
        balance: balanceBn,
        balanceFormatted: _formatEth(balanceBn)
    };
}

// ============================================================================
// UNIVERSAL URL RESOLVER
// ============================================================================

const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/'
];

/**
 * Universal content URL resolver.
 * Handles: ar://txId, ipfs://Qm..., bare CIDs (Qm.../bafy...), bare Arweave TX IDs,
 * and full HTTP URLs. Replaces all scattered IPFS/Arweave resolvers.
 *
 * @param {string} uri - Content URI in any format
 * @returns {string|null} Full HTTP gateway URL
 */
export function resolveContentUrl(uri) {
    if (!uri) return null;

    const trimmed = uri.trim();

    // Already a full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // ar://txId → Irys gateway
    if (trimmed.startsWith('ar://')) {
        const txId = trimmed.slice(5);
        return `${IRYS_CONFIG.gateway}/${txId}`;
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

    // Arweave/Irys TX ID: 43-44 chars, base64url or base58 charset
    // (Irys IDs can be 43 or 44 chars depending on encoding)
    if (/^[a-zA-Z0-9_-]{43,44}$/.test(trimmed) && !trimmed.startsWith('Qm')) {
        return `${IRYS_CONFIG.gateway}/${trimmed}`;
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
    // Arweave TX ID: exactly 43 chars base64url (no Qm prefix, no bafy prefix)
    if (/^[a-zA-Z0-9_-]{43}$/.test(trimmed) && !trimmed.startsWith('Qm')) return true;
    return false;
}

// ============================================================================
// MANUAL FUNDING (Arbitrum EIP-1559 fix + concurrency lock)
// ============================================================================
// The Irys SDK's fund() uses legacy gasPrice which fails on Arbitrum with:
//   "max fee per gas less than block base fee"
// This bypass sends ETH directly via ethers v6 with explicit gas buffer,
// then notifies the Irys node about the funding transaction.
// Mutex prevents concurrent fund calls (race condition when multiple uploads start).

let _fundingPromise = null;

async function _manualFund(irys, amount) {
    // If a funding operation is already in-flight, wait for it instead of double-funding
    if (_fundingPromise) {
        console.log('[Irys] Fund already in progress, waiting...');
        await _fundingPromise;
        return;
    }

    _fundingPromise = _doManualFund(irys, amount);
    try {
        await _fundingPromise;
    } finally {
        _fundingPromise = null;
    }
}

async function _doManualFund(irys, amount) {
    const ethers = window.ethers;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Get the Irys bundler node address for this token
    const nodeAddress = await irys.utils.getBundlerAddress(irys.token);
    console.log(`[Irys] Manual fund: sending ${_formatEth(amount)} to node ${nodeAddress.slice(0, 10)}...`);

    // Fetch current fee data and apply 3x buffer to avoid "baseFee > maxFeePerGas" on Arbitrum
    const feeData = await provider.getFeeData();
    const maxFeePerGas = (feeData.maxFeePerGas || 30000000n) * 3n;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 100000n;

    const tx = await signer.sendTransaction({
        to: nodeAddress,
        value: amount,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });

    console.log(`[Irys] Fund tx sent: ${tx.hash}`);

    // Wait for tx confirmation via raw RPC (avoids ethers v6 formatTransactionResponse
    // bug on Arbitrum where yParity mismatch on unrelated txs in the block causes crash)
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await provider.send('eth_getTransactionReceipt', [tx.hash]);
        if (receipt && receipt.blockNumber) {
            console.log(`[Irys] Fund tx confirmed in block ${parseInt(receipt.blockNumber, 16)}`);
            break;
        }
        if (i === 29) console.warn('[Irys] Fund tx confirmation timeout, proceeding anyway');
    }

    // Notify Irys node via direct HTTP POST (bypasses ethers v5/v6 yParity conflict
    // in irys.funder.submitFundTransaction which tries to parse the tx with ethers v5)
    const irysUrl = irys.url?.toString?.() || irys.api?.config?.url?.toString?.() || 'https://devnet.irys.xyz';
    const baseUrl = irysUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/account/balance/${irys.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_id: tx.hash })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[Irys] Fund notification returned ${response.status}: ${errText}`);
    } else {
        console.log(`[Irys] Fund registered with Irys node`);
    }

    // Wait for Irys to process the funding
    await new Promise(r => setTimeout(r, 2000));
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _formatEth(wei) {
    if (!window.ethers) {
        const eth = Number(wei) / 1e18;
        return `${eth.toFixed(6)} ETH`;
    }
    return `${window.ethers.formatEther(wei)} ETH`;
}
