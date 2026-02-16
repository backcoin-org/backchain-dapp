// api/upload.js
// ✅ VERSION V3.0: Migrated from Pinata to Lighthouse (IPFS+Filecoin permanent storage)
// Used by: Notary document upload with signature verification

import { Formidable } from 'formidable';
import fs from 'fs';
import { ethers } from 'ethers';
import crypto from 'crypto';

const LIGHTHOUSE_UPLOAD_URL = 'https://node.lighthouse.storage/api/v0/add';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
};

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    console.log(`[${new Date().toISOString()}] Upload request received`);

    const API_KEY = process.env.LIGHTHOUSE_API_KEY;
    if (!API_KEY) {
        console.error('LIGHTHOUSE_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    let file = null;

    try {
        const form = new Formidable({
            maxFileSize: 20 * 1024 * 1024, // 20MB (Lighthouse allows much more)
            uploadDir: '/tmp',
            keepExtensions: true,
            multiples: false,
            filter: () => true, // Accept ALL file types (notary can certify anything)
        });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    if (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('maxFileSize')) {
                        reject(new Error('FILE_TOO_LARGE'));
                    } else {
                        reject(new Error('Form parsing failed: ' + err.message));
                    }
                }
                resolve([fields, files]);
            });
        });

        file = (files.file && Array.isArray(files.file)) ? files.file[0] : files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file received.' });
        }

        const fileName = file.originalFilename || 'unknown';
        const fileSize = file.size;
        const fileMime = file.mimetype || 'application/octet-stream';

        console.log(`File: ${fileName} | Size: ${(fileSize / 1024).toFixed(1)} KB | Type: ${fileMime}`);

        // Validate signature
        const signature = (Array.isArray(fields.signature)) ? fields.signature[0] : fields.signature;
        const address = (Array.isArray(fields.address)) ? fields.address[0] : fields.address;

        const message = "I am signing to authenticate my file for notarization on Backchain.";

        if (!signature || !address) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Missing signature/address.' });
        }

        let recoveredAddress;
        try {
            if (ethers.verifyMessage) {
                recoveredAddress = ethers.verifyMessage(message, signature);
            } else if (ethers.utils && ethers.utils.verifyMessage) {
                recoveredAddress = ethers.utils.verifyMessage(message, signature);
            }
        } catch (e) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Invalid signature format.' });
        }

        if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Signature mismatch.' });
        }

        console.log('Signature verified for:', address.slice(0, 10) + '...');

        // Calculate SHA-256 hash
        const fileBuffer = fs.readFileSync(file.filepath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const contentHash = '0x' + hashSum.digest('hex');

        // Upload to IPFS+Filecoin via Lighthouse REST API (permanent storage)
        const blob = new Blob([fileBuffer], { type: fileMime });
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const lhResponse = await fetch(LIGHTHOUSE_UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${API_KEY}` },
            body: formData
        });

        if (!lhResponse.ok) {
            const errText = await lhResponse.text().catch(() => '');
            throw new Error(`Lighthouse HTTP ${lhResponse.status}: ${errText.slice(0, 200)}`);
        }

        const lhData = await lhResponse.json();
        const ipfsHash = lhData?.Hash;

        if (!ipfsHash) {
            throw new Error('Lighthouse returned no hash: ' + JSON.stringify(lhData).slice(0, 200));
        }
        const ipfsUri = `ipfs://${ipfsHash}`;

        console.log('Uploaded (Lighthouse):', ipfsUri);

        return res.status(200).json({
            success: true,
            ipfsUri,
            contentHash,
            fileName,
            fileSize,
            mimeType: fileMime,
            ipfsHash
        });

    } catch (error) {
        console.error('Upload Error:', error.message);

        if (error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                error: 'File too large',
                details: 'Maximum file size is 20MB.'
            });
        }

        return res.status(500).json({
            error: 'Upload failed',
            details: error.message
        });

    } finally {
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try { fs.unlinkSync(file.filepath); } catch (e) {}
        }
    }
}
