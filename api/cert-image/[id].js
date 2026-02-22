// api/cert-image/[id].js
// Proxies the actual image for a Notary token (cert or asset).
// Used as the `image` field in ERC-721 metadata so MetaMask can fetch
// from a first-party URL (backcoin.org) directly.
// Proxies instead of redirecting because MetaMask doesn't follow 302 for NFT images.

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

export const config = { api: { responseLimit: false } };

let NOTARY_ADDRESS;
try {
    const addresses = JSON.parse(readFileSync(join(process.cwd(), 'deployment-addresses.json'), 'utf8'));
    NOTARY_ADDRESS = addresses.notary;
} catch {
    NOTARY_ADDRESS = '0xFe3F90C76F1aAEED93b8063238658FF3CAD62d24';
}

const NOTARY_ABI = [
    'function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta)',
    'function isAsset(uint256 tokenId) view returns (bool)',
    'function getAsset(uint256 tokenId) view returns (address owner, uint48 registeredAt, uint8 assetType, uint8 annotationCount, uint32 transferCount, string memory meta, bytes32 documentHash)',
];

const IPFS_GATEWAYS = [
    'https://gateway.lighthouse.storage/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
];
const ARWEAVE_GATEWAY = 'https://gateway.irys.xyz';
const FALLBACK_IMAGE_URL = 'https://backcoin.org/assets/bkc_logo_3d.png';

// MIME type corrections — IPFS gateways sometimes return wrong types
const MIME_FIXES = {
    'video/webp': 'image/webp',
    'application/octet-stream': null, // detect from magic bytes
};

// Detect image type from magic bytes
function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return 'image/png';
    const hex = buffer.subarray(0, 12).toString('hex');
    if (hex.startsWith('89504e47')) return 'image/png';
    if (hex.startsWith('ffd8ff')) return 'image/jpeg';
    if (hex.startsWith('47494638')) return 'image/gif';
    if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    if (hex.startsWith('424d')) return 'image/bmp';
    if (buffer.subarray(0, 4).toString('ascii') === '<svg' || buffer.subarray(0, 5).toString('ascii') === '<?xml') return 'image/svg+xml';
    return 'image/png';
}

// Normalize content type
function fixContentType(rawType, buffer) {
    const base = (rawType || '').split(';')[0].trim().toLowerCase();
    if (MIME_FIXES[base] !== undefined) {
        return MIME_FIXES[base] || detectImageType(buffer);
    }
    if (base.startsWith('image/')) return base;
    // Not an image type — detect from bytes
    return detectImageType(buffer);
}

function resolveUri(uri) {
    if (!uri) return null;
    const t = uri.trim();
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('ipfs://')) return t.slice(7); // return just the CID
    if (t.startsWith('ar://')) {
        const id = t.slice(5);
        if (id.startsWith('Qm') || id.startsWith('bafy')) return id; // IPFS CID
        return `${ARWEAVE_GATEWAY}/${id}`;
    }
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(t) || t.startsWith('bafy'))
        return t; // bare CID
    return null;
}

function parseMeta(meta) {
    if (!meta) return {};
    try {
        if (meta.trim().startsWith('{')) return JSON.parse(meta);
    } catch {}
    return {};
}

function fetchUrl(url, timeout = 8000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const get = (u, redirects = 0) => {
            if (redirects > 3) return reject(new Error('Too many redirects'));
            client.get(u, { timeout }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return get(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) {
                    res.resume(); // drain
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve({
                    buffer: Buffer.concat(chunks),
                    rawContentType: res.headers['content-type'] || ''
                }));
                res.on('error', reject);
            }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
        };
        get(url);
    });
}

// Try multiple IPFS gateways for a CID
async function fetchFromIPFS(cid) {
    for (const gw of IPFS_GATEWAYS) {
        try {
            return await fetchUrl(`${gw}${cid}`, 7000);
        } catch (e) {
            console.warn(`[CertImage] Gateway ${gw} failed for ${cid}: ${e.message}`);
        }
    }
    throw new Error('All IPFS gateways failed');
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end();

    const tokenId = parseInt(req.query.id);
    if (isNaN(tokenId) || tokenId < 1) {
        return serveFallback(res);
    }

    const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const notary = new ethers.Contract(NOTARY_ADDRESS, NOTARY_ABI, provider);

        let resolved = null;
        const isAssetToken = await notary.isAsset(tokenId);

        if (isAssetToken) {
            const result = await notary.getAsset(tokenId);
            const meta = parseMeta(result.meta);
            resolved = resolveUri(meta.uri);
        } else {
            const result = await notary.getCertificate(tokenId);
            if (result.documentHash !== '0x' + '0'.repeat(64)) {
                const meta = parseMeta(result.meta);
                resolved = resolveUri(meta.uri);
            }
        }

        if (!resolved) {
            return serveFallback(res);
        }

        // Fetch the image — resolved is either a CID or a full URL
        let data;
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
            data = await fetchUrl(resolved);
        } else {
            // It's an IPFS CID — try multiple gateways
            data = await fetchFromIPFS(resolved);
        }

        const contentType = fixContentType(data.rawContentType, data.buffer);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', data.buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        return res.status(200).send(data.buffer);

    } catch (error) {
        console.error(`[CertImage] Error for token #${tokenId}:`, error.message);
        return serveFallback(res);
    }
}

// Proxy the fallback image instead of 302 redirect (MetaMask doesn't follow redirects)
async function serveFallback(res) {
    try {
        const { buffer, rawContentType } = await fetchUrl(FALLBACK_IMAGE_URL, 5000);
        res.setHeader('Content-Type', rawContentType || 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        return res.status(200).send(buffer);
    } catch {
        // Last resort: inline 1x1 transparent PNG
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', pixel.length);
        return res.status(200).send(pixel);
    }
}
