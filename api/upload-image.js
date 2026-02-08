// api/upload-image.js
// ✅ V1.0: Simplified image upload to Pinata IPFS (no signature required)
// Used by: CharityPage campaign images, profile images, etc.

import pinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const PINATA_GATEWAY = 'https://white-defensive-eel-240.mypinata.cloud/ipfs/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
        console.error('❌ PINATA_JWT not configured');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    let file = null;

    try {
        const form = new Formidable({
            maxFileSize: MAX_FILE_SIZE,
            uploadDir: '/tmp',
            keepExtensions: true,
            multiples: false,
            filter: ({ mimetype }) => ALLOWED_TYPES.includes(mimetype),
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

        file = (files.image && Array.isArray(files.image)) ? files.image[0] : files.image;
        if (!file) {
            file = (files.file && Array.isArray(files.file)) ? files.file[0] : files.file;
        }

        if (!file) {
            return res.status(400).json({ error: 'No image received.' });
        }

        const fileMime = file.mimetype || '';
        if (!ALLOWED_TYPES.includes(fileMime)) {
            return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WebP allowed.' });
        }

        const fileName = file.originalFilename || 'image';
        const fileSize = file.size;
        console.log(`📷 Image: ${fileName} | Size: ${(fileSize / 1024).toFixed(1)} KB | Type: ${fileMime}`);

        // Upload to IPFS via Pinata
        const stream = fs.createReadStream(file.filepath);
        const fileOptions = {
            pinataMetadata: {
                name: `Charity_${fileName}`,
                keyvalues: {
                    type: 'charity-image',
                    timestamp: new Date().toISOString(),
                    originalName: fileName,
                    mimeType: fileMime
                }
            },
            pinataOptions: { cidVersion: 1 }
        };

        const result = await pinata.pinFileToIPFS(stream, fileOptions);
        const imageUrl = `${PINATA_GATEWAY}${result.IpfsHash}`;

        console.log('✅ Image uploaded:', imageUrl);

        return res.status(200).json({
            success: true,
            imageUrl,
            ipfsHash: result.IpfsHash,
            fileName,
            fileSize
        });

    } catch (error) {
        console.error('❌ Image Upload Error:', error.message);

        if (error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'Image too large. Maximum 5MB.' });
        }

        return res.status(500).json({ error: 'Upload failed', details: error.message });

    } finally {
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try { fs.unlinkSync(file.filepath); } catch (e) {}
        }
    }
}
