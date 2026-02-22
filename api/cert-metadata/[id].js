// api/cert-metadata/[id].js
// ERC-721 Metadata endpoint for Notary V4 (native ERC-721)
//
// GET /api/cert-metadata/42
// Returns: { name, description, image, external_url, attributes }

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

let NOTARY_ADDRESS;
try {
    const addresses = JSON.parse(readFileSync(join(process.cwd(), 'deployment-addresses.json'), 'utf8'));
    NOTARY_ADDRESS = addresses.notary;
} catch {
    NOTARY_ADDRESS = '0x0C073AeBB15447Ea71d34d4BDEFb3490f5178595';
}

const NOTARY_ABI = [
    'function getCertificate(uint256 certId) view returns (bytes32 documentHash, address owner, uint48 timestamp, uint8 docType, string memory meta, bool boosted, uint32 boostExpiry)',
    'function certCount() view returns (uint256)'
];

const DOC_TYPE_NAMES = [
    'General', 'Contract', 'Identity', 'Diploma', 'Property',
    'Financial', 'Legal', 'Medical', 'IP', 'Other'
];

const IPFS_GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';
const ARWEAVE_GATEWAY = 'https://gateway.irys.xyz';

function resolveUri(uri) {
    if (!uri) return null;
    const trimmed = uri.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('ipfs://')) return `${IPFS_GATEWAY}${trimmed.slice(7)}`;
    if (trimmed.startsWith('ar://')) {
        const id = trimmed.slice(5);
        if (id.startsWith('Qm') || id.startsWith('bafy')) return `${IPFS_GATEWAY}${id}`;
        return `${ARWEAVE_GATEWAY}/${id}`;
    }
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(trimmed) || trimmed.startsWith('bafy'))
        return `${IPFS_GATEWAY}${trimmed}`;
    return null;
}

function parseMeta(meta) {
    if (!meta) return {};
    try {
        if (meta.trim().startsWith('{')) return JSON.parse(meta);
    } catch { /* ignore */ }
    return { desc: meta };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const certId = parseInt(req.query.id);
    if (isNaN(certId) || certId < 1) {
        return res.status(400).json({ error: 'Invalid certificate ID' });
    }

    // Sepolia RPC (public — Alchemy key is Arbitrum-only)
    const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const notary = new ethers.Contract(NOTARY_ADDRESS, NOTARY_ABI, provider);

        const result = await notary.getCertificate(certId);
        if (result.documentHash === '0x' + '0'.repeat(64)) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const meta = parseMeta(result.meta);
        const docTypeName = DOC_TYPE_NAMES[Number(result.docType)] || 'Unknown';
        const certDate = new Date(Number(result.timestamp) * 1000).toISOString();
        const shortHash = `${result.documentHash.slice(0, 10)}...${result.documentHash.slice(-8)}`;

        const imageUrl = resolveUri(meta.uri) || null;

        const metadata = {
            name: meta.name || meta.desc || `Notary Certificate #${certId}`,
            description: `Backchain Notary Certificate #${certId}. ${docTypeName} document certified on opBNB. Hash: ${shortHash}`,
            image: imageUrl || `https://backcoin.org/assets/bkc_logo_3d.png`,
            external_url: `https://backcoin.org/#notary`,
            attributes: [
                { trait_type: 'Certificate ID', value: certId.toString() },
                { trait_type: 'Document Type', value: docTypeName },
                { trait_type: 'Certified Date', value: certDate, display_type: 'date' },
                { trait_type: 'Owner', value: result.owner },
                { trait_type: 'Content Hash', value: result.documentHash },
                ...(result.boosted ? [{ trait_type: 'Boosted', value: 'Yes' }] : []),
                ...(meta.type ? [{ trait_type: 'File Type', value: meta.type }] : []),
            ]
        };

        return res.status(200).json(metadata);
    } catch (error) {
        console.error(`[CertMetadata] Error for cert #${certId}:`, error.message);
        return res.status(500).json({ error: 'Failed to fetch certificate data' });
    }
}
