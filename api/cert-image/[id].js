// api/cert-image/[id].js
// Redirects to the actual image for a Notary token (cert or asset).
// Used as the `image` field in ERC-721 metadata so MetaMask can fetch
// from a first-party URL (backcoin.org) instead of an IPFS gateway directly.

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/';
const ARWEAVE_GATEWAY = 'https://gateway.irys.xyz';
const FALLBACK_IMAGE = 'https://backcoin.org/assets/bkc_logo_3d.png';

function resolveUri(uri) {
    if (!uri) return null;
    const t = uri.trim();
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('ipfs://')) return `${IPFS_GATEWAY}${t.slice(7)}`;
    if (t.startsWith('ar://')) {
        const id = t.slice(5);
        if (id.startsWith('Qm') || id.startsWith('bafy')) return `${IPFS_GATEWAY}${id}`;
        return `${ARWEAVE_GATEWAY}/${id}`;
    }
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(t) || t.startsWith('bafy'))
        return `${IPFS_GATEWAY}${t}`;
    return null;
}

function parseMeta(meta) {
    if (!meta) return {};
    try {
        if (meta.trim().startsWith('{')) return JSON.parse(meta);
    } catch {}
    return {};
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end();

    const tokenId = parseInt(req.query.id);
    if (isNaN(tokenId) || tokenId < 1) {
        return res.redirect(302, FALLBACK_IMAGE);
    }

    const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const notary = new ethers.Contract(NOTARY_ADDRESS, NOTARY_ABI, provider);

        let imageUrl = null;
        const isAssetToken = await notary.isAsset(tokenId);

        if (isAssetToken) {
            const result = await notary.getAsset(tokenId);
            const meta = parseMeta(result.meta);
            imageUrl = resolveUri(meta.uri);
        } else {
            const result = await notary.getCertificate(tokenId);
            if (result.documentHash !== '0x' + '0'.repeat(64)) {
                const meta = parseMeta(result.meta);
                imageUrl = resolveUri(meta.uri);
            }
        }

        return res.redirect(302, imageUrl || FALLBACK_IMAGE);
    } catch (error) {
        console.error(`[CertImage] Error for token #${tokenId}:`, error.message);
        return res.redirect(302, FALLBACK_IMAGE);
    }
}
