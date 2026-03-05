// api/upload-media.js
// V4.0: Unified media upload via Irys/Arweave (devnet = free, mainnet = permanent)
// Uses @irys/upload SDK with dynamic imports for serverless compatibility.
// Used by: Agora posts, avatars, Charity campaigns, general media

import { Formidable } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const IRYS_GATEWAY = 'https://devnet.irys.xyz';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
    'video/webm', 'video/mp4', 'video/ogg',
    'audio/webm', 'audio/ogg', 'audio/mpeg',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/json', 'text/html', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed',
    'application/octet-stream'
];

// Dynamic import of Irys SDK (loaded only when needed, avoids bundle issues)
let _uploaderPromise = null;
function getIrysUploader() {
    if (!_uploaderPromise) {
        _uploaderPromise = (async () => {
            const { Uploader } = await import('@irys/upload');
            const { Ethereum } = await import('@irys/upload-ethereum');
            return Uploader(Ethereum)
                .withWallet(process.env.IRYS_PRIVATE_KEY.trim())
                .withRpc('https://ethereum-sepolia-rpc.publicnode.com')
                .devnet();
        })();
    }
    return _uploaderPromise;
}

async function uploadToIrys(fileBuffer, fileName, mimeType) {
    const uploader = await getIrysUploader();
    const tags = [
        { name: 'Content-Type', value: mimeType },
        { name: 'File-Name', value: fileName },
        { name: 'App-Name', value: 'Backchain' },
    ];
    const receipt = await uploader.upload(fileBuffer, { tags });
    console.log(`[Irys] Uploaded: ${IRYS_GATEWAY}/${receipt.id} (${(fileBuffer.length / 1024).toFixed(0)}KB)`);
    return { Hash: receipt.id };
}

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

    const IRYS_KEY = process.env.IRYS_PRIVATE_KEY;
    if (!IRYS_KEY) {
        console.error('IRYS_PRIVATE_KEY not configured');
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

        file = (files.file && Array.isArray(files.file)) ? files.file[0] : files.file;
        if (!file) file = (files.image && Array.isArray(files.image)) ? files.image[0] : files.image;
        if (!file) file = (files.video && Array.isArray(files.video)) ? files.video[0] : files.video;
        if (!file) file = (files.media && Array.isArray(files.media)) ? files.media[0] : files.media;

        if (!file) {
            return res.status(400).json({ error: 'No file received.' });
        }

        const fileMime = file.mimetype || '';
        if (!ALLOWED_TYPES.includes(fileMime)) {
            return res.status(400).json({ error: `Invalid file type: ${fileMime}` });
        }

        const fileName = file.originalFilename || 'media';
        const fileSize = file.size;
        const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
        console.log(`Media: ${fileName} | Size: ${sizeMB} MB | Type: ${fileMime}`);

        const fileBuffer = fs.readFileSync(file.filepath);
        const irysData = await uploadToIrys(fileBuffer, fileName, fileMime);
        const ipfsHash = irysData?.Hash;

        if (!ipfsHash) {
            throw new Error('Irys returned no hash: ' + JSON.stringify(irysData).slice(0, 200));
        }

        const mediaUrl = `${IRYS_GATEWAY}/${ipfsHash}`;
        console.log('Media uploaded (Irys):', mediaUrl);

        return res.status(200).json({
            success: true,
            mediaUrl,
            ipfsHash,
            fileName,
            fileSize,
            mimeType: fileMime
        });

    } catch (error) {
        console.error('Media Upload Error:', error.message);

        if (error.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'File too large. Maximum 100MB for media.' });
        }

        return res.status(500).json({ error: 'Upload failed: ' + error.message });

    } finally {
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try { fs.unlinkSync(file.filepath); } catch (e) {}
        }
    }
}
