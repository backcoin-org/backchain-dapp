// api/upload.js
// Vercel API Route para lidar com o upload e Piñata
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
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

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
        // Este erro só ocorre se a variável ENV for removida do Vercel
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
        // ### CORREÇÃO 1: Especifica o diretório de upload da Vercel ###
        const form = new Formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB limite
            uploadDir: '/tmp',             // Informa ao Formidable para usar o /tmp da Vercel
            keepExtensions: true,          // Mantém a extensão (ex: .jpg, .pdf)
        });
        // =================================================================

        console.log('📋 Parsing form data...');

        // 1. Processa o arquivo (multipart/form-data)
        const [fields, files] = await new Promise((resolve, reject) => {
            form.once('error', reject);
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        console.log('📁 Form parsed successfully');
        console.log('Files received:', Object.keys(files));
        console.log('Fields received:', Object.keys(fields));

        file = files.file ? files.file[0] : null;

        if (!file) {
            console.error('❌ No file received in request');
            return res.status(400).json({ 
                error: 'No file received.',
                receivedFields: Object.keys(fields),
                receivedFiles: Object.keys(files)
            });
        }

        console.log('📄 File details:', {
            originalName: file.originalFilename,
            size: file.size,
            mimetype: file.mimetype,
            filepath: file.filepath // Este caminho agora será /tmp/nome-aleatorio.ext
        });

        // =================================================================
        // ### CORREÇÃO 2: Usar createReadStream (Stream) em vez de readFileSync (Buffer) ###
        
        // 2. SOLUÇÃO SERVERLESS: Criando um Stream de Leitura
        // O SDK do Piñata espera um Stream, não um Buffer.
        console.log('📖 Creating file stream from:', file.filepath);
        const fileStream = fs.createReadStream(file.filepath); //
        console.log('✅ Stream created successfully.');


        // 3. Envia o Stream para o Piñata
        console.log('☁️  Uploading to Piñata IPFS...');
        const result = await pinata.pinFileToIPFS(fileStream, { // Passa o Stream
            pinataMetadata: {
                name: file.originalFilename || 'Notary File (Backchain)',
            },
            pinataOptions: {
                cidVersion: 1
            }
        });
        // =================================================================

        // 4. Retorna a URI
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
        console.error('❌ Vercel/Piñata Upload Error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return res.status(500).json({
            error: 'Vercel Internal Server Error during upload.',
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