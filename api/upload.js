// api/upload.js
// Vercel API Route (Versão Híbrida Robusta)
import pinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';

// Essencial: Desativa o body-parser para que o Formidable possa processar a requisição
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Log para debug
    console.log(`[${new Date().toISOString()}] Upload request received`);

    // Apenas aceita POST
    if (req.method !== 'POST') {
        console.error('❌ Method not allowed:', req.method);
        return res.status(405).json({ 
            error: 'Method Not Allowed',
            allowedMethods: ['POST']
        });
    }

    // A chave PINATA_JWT está configurada no ambiente Vercel
    const PINATA_JWT = process.env.PINATA_JWT;

    if (!PINATA_JWT) {
        console.error('❌ Vercel Error: PINATA_JWT key not found.');
        return res.status(500).json({ 
            error: 'Piñata API Key not configured on server (Vercel ENV).',
            hint: 'Configure PINATA_JWT in Vercel Dashboard → Settings → Environment Variables'
        });
    }

    console.log('✅ PINATA_JWT found in environment');

    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    let file = null;

    try {
        // =================================================================
        // ### CORREÇÃO HÍBRIDA ###
        
        // 1. Configura o Formidable para o /tmp da Vercel
        const form = new Formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB
            uploadDir: '/tmp',
            keepExtensions: true,
        });

        // 2. Usa o "Promise wrapper" (do seu upload.js original)
        //    Isso é mais robusto para capturar erros de parse.
        console.log('📋 Parsing form data using Promise wrapper...');
        const [fields, files] = await new Promise((resolve, reject) => {
            form.once('error', (err) => {
                console.error('❌ Formidable parsing error (form.once):', err);
                reject(new Error('Error parsing form data: ' + err.message));
            });
            form.parse(req, (err, fields, files) => {
                if (err) {
                     console.error('❌ Formidable .parse() callback error:', err);
                     reject(new Error('Error in .parse() callback: ' + err.message));
                }
                resolve([fields, files]);
            });
        });
        // =================================================================

        console.log('📁 Form parsed successfully');
        file = files.file ? files.file[0] : null;

        if (!file) {
            console.error('❌ No file received in request');
            return res.status(400).json({ 
                error: 'No file received.'
            });
        }

        console.log('📄 File details:', {
            originalName: file.originalFilename,
            size: file.size,
            mimetype: file.mimetype,
            filepath: file.filepath 
        });

        // =================================================================
        // 3. Usa o createReadStream (do seu 'upload que funcionava.js')
        console.log('📖 Creating file stream from:', file.filepath);
        const stream = fs.createReadStream(file.filepath);
        
        const options = {
            pinataMetadata: {
                name: file.originalFilename || 'Notary File (Backchain)',
            },
            pinataOptions: {
                cidVersion: 1 
            }
        };
        // =================================================================

        // 4. Envia o Stream para o Piñata
        console.log('☁️  Uploading to Piñata IPFS...');
        const result = await pinata.pinFileToIPFS(stream, options);

        // 5. Retorna a URI
        const cid = result.IpfsHash;
        const ipfsUri = `ipfs://${cid}`;

        console.log('✅ Vercel Upload successful!');
        console.log('CID:', cid);
        console.log('IPFS URI:', ipfsUri);

        return res.status(200).json({ 
            success: true,
            cid: cid, 
            ipfsUri: ipfsUri,
            fileName: file.originalFilename,
            fileSize: file.size,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Vercel/Piñata Upload Error (Main Catch):', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return res.status(500).json({
            error: 'Vercel Internal Server Error during upload.',
            // O frontend está recebendo esta mensagem:
            details: error.message || 'Internal error processing Piñata upload.',
            errorType: error.name || 'UnknownError'
        });

    } finally {
        // Limpa o arquivo temporário (melhor prática Serverless)
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