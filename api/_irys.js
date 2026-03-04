// api/_irys.js
// Shared Irys upload helper for serverless functions.
// Devnet: free (~60 day persistence). Mainnet: user pays crypto (permanent).

import { Uploader } from '@irys/upload';
import { Ethereum } from '@irys/upload-ethereum';

// Devnet uses devnet.irys.xyz; mainnet uses gateway.irys.xyz
export const IRYS_GATEWAY = 'https://devnet.irys.xyz';

let cachedUploader = null;

export async function getIrysUploader() {
    if (cachedUploader) return cachedUploader;

    const key = process.env.IRYS_PRIVATE_KEY;
    if (!key) throw new Error('IRYS_PRIVATE_KEY not configured');

    cachedUploader = await Uploader(Ethereum)
        .withWallet(key)
        .withRpc('https://ethereum-sepolia-rpc.publicnode.com')
        .devnet();

    return cachedUploader;
}

/**
 * Upload a file buffer to Irys (IPFS-compatible, Arweave-backed).
 *
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} mimeType
 * @returns {Promise<{Hash: string, gateway: string}>}
 */
export async function uploadToIrys(fileBuffer, fileName, mimeType) {
    const uploader = await getIrysUploader();

    const tags = [
        { name: 'Content-Type', value: mimeType },
        { name: 'File-Name', value: fileName },
        { name: 'App-Name', value: 'Backchain' },
    ];

    const receipt = await uploader.upload(fileBuffer, { tags });

    console.log(`[Irys] Uploaded: ${IRYS_GATEWAY}/${receipt.id} (${(fileBuffer.length / 1024).toFixed(0)}KB)`);

    return {
        Hash: receipt.id,
        gateway: `${IRYS_GATEWAY}/${receipt.id}`,
    };
}
