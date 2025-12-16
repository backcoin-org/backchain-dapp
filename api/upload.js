// api/upload.js
// ✅ VERSION V2.1: 4MB limit, any file type support

import pinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';
import { ethers } from 'ethers';
import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

// --- CORS Headers ---
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
    // 1. CORS
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log(`[${new Date().toISOString()}] Upload request received`);

    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
        console.error('❌ PINATA_JWT not configured');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    let file = null;

    try {
        // 2. Parse form with 4MB limit (any file type allowed)
        const form = new Formidable({
            maxFileSize: 4 * 1024 * 1024, // 4MB - any file type
            uploadDir: '/tmp',
            keepExtensions: true,
            multiples: false,
            filter: () => true, // Accept ALL file types
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
        
        console.log(`📄 File: ${fileName} | Size: ${(fileSize / 1024).toFixed(1)} KB | Type: ${fileMime}`);

        // 3. Validate signature
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

        console.log('✅ Signature verified for:', address.slice(0, 10) + '...');

        // 4. Calculate SHA-256 hash
        console.log('🔒 Calculating SHA-256...');
        const fileBuffer = fs.readFileSync(file.filepath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const contentHash = '0x' + hashSum.digest('hex');
        console.log('🔹 Hash:', contentHash.slice(0, 20) + '...');

        // 5. Upload to IPFS via Pinata
        console.log('☁️ Uploading to Pinata IPFS...');
        
        const stream = fs.createReadStream(file.filepath);
        const fileOptions = {
            pinataMetadata: {
                name: `Notary_${fileName}`,
                keyvalues: {
                    owner: address,
                    timestamp: new Date().toISOString(),
                    originalName: fileName,
                    mimeType: fileMime
                }
            },
            pinataOptions: { cidVersion: 1 }
        };

        const fileResult = await pinata.pinFileToIPFS(stream, fileOptions);
        const ipfsUri = `ipfs://${fileResult.IpfsHash}`;
        
        console.log('✅ Uploaded:', ipfsUri);

        // 6. Return success with all data
        return res.status(200).json({ 
            success: true,
            ipfsUri: ipfsUri,
            contentHash: contentHash,
            fileName: fileName,
            fileSize: fileSize,
            mimeType: fileMime,
            ipfsHash: fileResult.IpfsHash
        });

    } catch (error) {
        console.error('❌ Upload Error:', error.message);
        
        if (error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                error: 'File too large',
                details: 'Maximum file size is 4MB.'
            });
        }
        
        return res.status(500).json({
            error: 'Upload failed',
            details: error.message
        });

    } finally {
        // Cleanup temp file
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try {
                fs.unlinkSync(file.filepath);
            } catch (e) {
                console.warn('Could not delete temp file:', e.message);
            }
        }
    }
}