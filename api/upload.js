// api/upload.js
import pinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';
import { ethers } from 'ethers'; 

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    console.log(`[${new Date().toISOString()}] Upload request received`);

    if (req.method !== 'POST') {
        console.error('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
        console.error('❌ Vercel Error: PINATA_JWT key not found.');
        return res.status(500).json({ error: 'Piñata API Key not configured on server.' });
    }

    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    let file = null;

    try {
        const form = new Formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB
            uploadDir: '/tmp',
            keepExtensions: true,
        });

        console.log('📋 Parsing form data...');
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('❌ Formidable .parse() callback error:', err);
                    reject(new Error('Error in .parse() callback: ' + err.message));
                }
                resolve([fields, files]);
            });
        });

        file = files.file ? files.file[0] : null;
        if (!file) {
            console.error('❌ No file received in request');
            return res.status(400).json({ error: 'No file received.' });
        }

        // =======================================================
        // ### 1. VERIFICAÇÃO DE ASSINATURA ###
        // =======================================================
        console.log('🔑 Verifying wallet signature...');
        const signature = fields.signature ? fields.signature[0] : null;
        const address = fields.address ? fields.address[0] : null; // A carteira do usuário
        
        const message = "I am signing to authenticate my file for notarization on Backchain."; 

        if (!signature || !address) {
            console.error('❌ Signature or address missing from request');
            return res.status(401).json({ error: 'Unauthorized', details: 'Signature and address are required.' });
        }

        let recoveredAddress;
        try {
            recoveredAddress = ethers.verifyMessage(message, signature);
        } catch (e) {
            console.error('❌ Signature verification failed:', e.message);
            return res.status(401).json({ error: 'Unauthorized', details: 'Invalid signature format.' });
        }

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.error(`❌ Signature mismatch. Expected: ${address}, Got: ${recoveredAddress}`);
            return res.status(401).json({ error: 'Unauthorized', details: 'Signature does not match address.' });
        }

        console.log('✅ Signature verified for address:', recoveredAddress);
        // =======================================================
        // ### 2. UPLOAD DO ARQUIVO (ETAPA 1 de 2) ###
        // =======================================================

        console.log('📖 Creating file stream from:', file.filepath);
        const stream = fs.createReadStream(file.filepath);
        
        const fileOptions = {
            pinataMetadata: {
                name: file.originalFilename || 'Notary File (Backchain)',
            },
            pinataOptions: {
                cidVersion: 1 
            }
        };

        console.log('☁️  [ETAPA 1/2] Uploading FILE to Piñata IPFS...');
        const fileResult = await pinata.pinFileToIPFS(stream, fileOptions);
        const fileHash = `ipfs://${fileResult.IpfsHash}`;
        console.log('✅ File uploaded:', fileHash);

        // =======================================================
        // ### 3. UPLOAD DOS METADADOS (ETAPA 2 de 2) ###
        // =======================================================
        
        // --- CONSTRUINDO A DESCRIÇÃO COMBINADA ---
        const userDescription = fields.description ? fields.description[0] : 'No description provided.';
        const notarizationTimestamp = new Date().toISOString();
        const notarizerWallet = address;
        const finalDescription = `Notarized By Backcoin.Org Decentralized Notary On ${notarizationTimestamp}, Wallet ${notarizerWallet}. Description: "${userDescription}"`;
        
        const mimeType = file.mimetype || '';
        let contentField = 'image';
        if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            contentField = 'animation_url';
        }

        // Cria o objeto JSON de metadados
        const metadata = {
            name: `Notary Certificate - ${file.originalFilename || 'File'}`,
            description: finalDescription, 
            [contentField]: fileHash, 
            external_url: fileHash, 
            
            // ✅ BLOCO 'attributes' ADICIONADO PARA CONSISTÊNCIA
            attributes: [
                { trait_type: "MIME Type", value: mimeType },
                { trait_type: "Notarized By", value: notarizerWallet },
                { trait_type: "Timestamp", value: notarizationTimestamp }
            ]
        };
        
        const metadataOptions = {
            pinataMetadata: {
                name: `${file.originalFilename || 'Notary'}_Metadata.json`,
            },
            pinataOptions: {
                cidVersion: 1 
            }
        };

        console.log('☁️  [ETAPA 2/2] Uploading METADATA JSON to Piñata IPFS...');
        const metadataResult = await pinata.pinJSONToIPFS(metadata, metadataOptions);
        const metadataHash = `ipfs://${metadataResult.IpfsHash}`;
        console.log('✅ Metadata uploaded:', metadataHash);


        // =======================================================
        // ### 4. RETORNO (Envia o hash dos metadados) ###
        // =======================================================

        console.log('✅ Vercel Upload successful!');
        console.log('Returning METADATA URI:', metadataHash);

        return res.status(200).json({ 
            success: true,
            cid: metadataResult.IpfsHash, 
            ipfsUri: metadataHash, 
        });

    } catch (error) {
        console.error('❌ Vercel/Piñata Upload Error (Main Catch):', error);
        return res.status(500).json({
            error: 'Vercel Internal Server Error during upload.',
            details: error.message || 'Internal error processing Piñata upload.',
        });

    } finally {
        // Limpa o arquivo temporário
        if (file && file.filepath) {
            try {
                fs.unlinkSync(file.filepath);
                console.log('🗑️  Temporary file deleted:', file.filepath);
            } catch (e) {
                console.warn('⚠️  Could not delete temporary file:', e.message);
            }
        }
    }
}