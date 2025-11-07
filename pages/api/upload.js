// pages/api/upload.js
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // A chave PINATA_JWT está configurada no ambiente Vercel
    const PINATA_JWT = process.env.PINATA_JWT; 

    if (!PINATA_JWT) {
        // Este erro só ocorre se a variável ENV for removida do Vercel
        console.error("Vercel Error: PINATA_JWT key not found.");
        return res.status(500).json({ error: 'Piñata API Key not configured on server (Vercel ENV).' });
    }
    
    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });

    let file = null;

    try {
        const form = new Formidable();
        
        // 1. Processa o arquivo (multipart/form-data)
        const [fields, files] = await new Promise((resolve, reject) => {
            form.once('error', reject); 
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        file = files.file ? files.file[0] : null; 
        if (!file) {
            return res.status(400).json({ error: 'No file received.' });
        }

        // =================================================================
        // 2. SOLUÇÃO SERVERLESS: Lendo o Buffer do arquivo para a memória
        // O SERVERLESS Server não confia em caminhos temporários do disco.
        const fileBuffer = fs.readFileSync(file.filepath); 
        
        // 3. Envia o Buffer para o Piñata
        const result = await pinata.pinFileToIPFS(fileBuffer, {
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
        
        console.log("Vercel Upload successful. CID:", cid);
        return res.status(200).json({ cid: cid, ipfsUri: ipfsUri });

    } catch (error) {
        console.error("Vercel/Piñata Upload Error:", error);
        return res.status(500).json({ 
            error: `Vercel Internal Server Error during upload.`,
            details: error.message || 'Internal error processing Piñata upload.'
        });
    } finally {
        // Limpa o arquivo temporário (melhor prática Serverless)
        if (file && file.filepath) {
            try {
                fs.unlinkSync(file.filepath);
            } catch (e) {
                console.warn("Could not delete temporary file:", e);
            }
        }
    }
}