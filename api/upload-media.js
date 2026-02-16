// api/upload-media.js
// V3.1: Unified media upload via Lighthouse REST API (IPFS + Filecoin permanent storage)
// Uses direct REST API instead of SDK for reliable serverless operation.
// Used by: Agora posts, avatars, Charity campaigns, general media

import { Formidable } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const LIGHTHOUSE_UPLOAD_URL = 'https://node.lighthouse.storage/api/v0/add';
const IPFS_GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
    'video/webm', 'video/mp4', 'video/ogg',
    'audio/webm', 'audio/ogg', 'audio/mpeg',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
];

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

    const API_KEY = process.env.LIGHTHOUSE_API_KEY;
    if (!API_KEY) {
        console.error('LIGHTHOUSE_API_KEY not configured');
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

        // Read file buffer and upload via Lighthouse REST API
        const fileBuffer = fs.readFileSync(file.filepath);
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

        const mediaUrl = `${IPFS_GATEWAY}${ipfsHash}`;
        console.log('Media uploaded (Lighthouse):', mediaUrl);

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
