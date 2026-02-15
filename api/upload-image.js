// api/upload-image.js
// V3.0: Image upload via Pinata (IPFS permanent storage)
// Used by: Agora avatars, profile images

import PinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

    const JWT = process.env.PINATA_JWT;
    if (!JWT) {
        console.error('PINATA_JWT not configured');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

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
        console.log(`Image: ${fileName} | Size: ${(fileSize / 1024).toFixed(1)} KB | Type: ${fileMime}`);

        // Upload to IPFS via Pinata
        const pinata = new PinataSDK({ pinataJWTKey: JWT });
        const readStream = fs.createReadStream(file.filepath);
        const result = await pinata.pinFileToIPFS(readStream, {
            pinataMetadata: { name: `backchain-${fileName}` }
        });

        if (!result?.IpfsHash) {
            throw new Error('Pinata upload returned no hash');
        }

        const ipfsHash = result.IpfsHash;
        const imageUrl = `${IPFS_GATEWAY}${ipfsHash}`;

        console.log('Image uploaded (Pinata):', imageUrl);

        return res.status(200).json({
            success: true,
            imageUrl,
            ipfsHash,
            fileName,
            fileSize
        });

    } catch (error) {
        console.error('Image Upload Error:', error.message);

        if (error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'Image too large. Maximum 10MB.' });
        }

        return res.status(500).json({ error: 'Upload failed', details: error.message });

    } finally {
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try { fs.unlinkSync(file.filepath); } catch (e) {}
        }
    }
}
