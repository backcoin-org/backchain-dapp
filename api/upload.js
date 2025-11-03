// /api/upload.js
import { NFTStorage } from 'nft.storage';
import { Formidable } from 'formidable';
import fs from 'fs';

// Pega a chave secreta das variáveis de ambiente da Vercel
const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN;

// Função helper para lidar com a request (necessária na Vercel)
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!NFT_STORAGE_TOKEN) {
        console.error("Erro de servidor: Chave NFT_STORAGE_TOKEN não encontrada nas variáveis de ambiente.");
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }

    try {
        // 1. Processa o arquivo enviado pelo frontend
        const form = new Formidable();
        const [fields, files] = await form.parse(req);

        const file = files.file[0]; // Assumindo que o nome do campo é 'file'
        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo recebido.' });
        }

        // 2. Prepara o arquivo para o nft.storage
        const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

        // Lê o arquivo do disco temporário para a memória
        const fileData = await fs.promises.readFile(file.filepath);
        const blob = new Blob([fileData], { type: file.mimetype });

        // 3. Envia para o nft.storage (do servidor!)
        const cid = await client.storeBlob(blob);
        const ipfsUri = `ipfs://${cid}`;

        console.log("Upload do servidor com sucesso. CID:", cid);

        // 4. Retorna *apenas* o CID para o frontend
        return res.status(200).json({ cid: cid, ipfsUri: ipfsUri });

    } catch (error) {
        console.error("Erro no backend de upload:", error);
        return res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
    }
}