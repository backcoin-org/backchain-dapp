import pinataSDK from '@pinata/sdk';
import { Formidable } from 'formidable';
import fs from 'fs';
import { ethers } from 'ethers';
import crypto from 'crypto'; // Necessário para calcular o Hash SHA-256

export const config = {
    api: {
        bodyParser: false,
    },
};

// --- FUNÇÃO AUXILIAR PARA CORS ---
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
    // 1. Configurar CORS
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log(`[${new Date().toISOString()}] Upload request received (Enterprise Mode)`);

    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
        console.error('❌ Server Error: PINATA_JWT key not found.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    let file = null;

    try {
        // 2. Processar o Formulário
        const form = new Formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB Limite
            uploadDir: '/tmp',
            keepExtensions: true,
            multiples: true,
        });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(new Error('Form parsing failed: ' + err.message));
                resolve([fields, files]);
            });
        });

        file = (files.file && Array.isArray(files.file)) ? files.file[0] : files.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file received.' });
        }

        // 3. Validar Assinatura (Segurança)
        const signature = (Array.isArray(fields.signature)) ? fields.signature[0] : fields.signature;
        const address = (Array.isArray(fields.address)) ? fields.address[0] : fields.address;
        
        // Mensagem Exata que o Frontend assina
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

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Signature mismatch.' });
        }

        console.log('✅ Signature verified.');

        // =======================================================
        // ### 4. CALCULAR HASH SHA-256 (PROVA MATEMÁTICA) ###
        // =======================================================
        console.log('🔒 Calculating SHA-256 Content Hash...');
        
        // Lê o buffer do arquivo para calcular o hash
        const fileBuffer = fs.readFileSync(file.filepath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        
        // Formata para string Hexadecimal com prefixo 0x (Para o tipo bytes32 do Solidity)
        const contentHash = '0x' + hashSum.digest('hex');
        
        console.log('🔹 Generated Hash:', contentHash);

        // =======================================================
        // ### 5. UPLOAD DO ARQUIVO PARA O IPFS ###
        // =======================================================
        console.log('☁️ Uploading Raw File to Piñata IPFS...');
        
        const stream = fs.createReadStream(file.filepath);
        const fileOptions = {
            pinataMetadata: {
                name: `Notary_Asset_${file.originalFilename || 'Unknown'}`,
                keyvalues: {
                    owner: address,
                    timestamp: new Date().toISOString()
                }
            },
            pinataOptions: { cidVersion: 1 }
        };

        const fileResult = await pinata.pinFileToIPFS(stream, fileOptions);
        const ipfsUri = `ipfs://${fileResult.IpfsHash}`;
        
        console.log('✅ File Uploaded:', ipfsUri);

        // =======================================================
        // ### 6. RETORNO PARA O FRONTEND ###
        // =======================================================
        // O Frontend pegará esses dados e enviará para a Blockchain
        return res.status(200).json({ 
            success: true,
            ipfsUri: ipfsUri,       // Vai para o campo string ipfsCid
            contentHash: contentHash, // Vai para o campo bytes32 contentHash
            fileName: file.originalFilename
        });

    } catch (error) {
        console.error('❌ Upload API Error:', error);
        return res.status(500).json({
            error: 'Server Error during upload.',
            details: error.message
        });

    } finally {
        // Limpeza do arquivo temporário do servidor
        if (file && file.filepath && fs.existsSync(file.filepath)) {
            try {
                fs.unlinkSync(file.filepath);
            } catch (e) {
                console.warn('Could not delete temp file:', e.message);
            }
        }
    }
}