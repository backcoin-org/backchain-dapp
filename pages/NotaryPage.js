// pages/NotaryPage.js
// 🛠️ MODO DE DIAGNÓSTICO SIMPLIFICADO
// Use este arquivo APENAS para testar se a API de Upload/Pinata está funcionando.

import { State } from '../state.js';
import { API_ENDPOINTS } from '../modules/data.js'; 

const ethers = window.ethers;

export const NotaryPage = {
    render: async (isActive) => {
        if (!isActive) return;
        const container = document.getElementById('notary');
        
        container.innerHTML = `
            <div class="max-w-xl mx-auto mt-10 p-8 bg-zinc-900 border border-yellow-500 rounded-2xl shadow-2xl">
                <h1 class="text-3xl font-bold text-white mb-4">🔧 Teste de Upload Pinata</h1>
                <p class="text-zinc-400 text-sm mb-6">Esta é uma ferramenta de debug para verificar a conexão Vercel <-> Pinata.</p>

                <div class="space-y-4">
                    <input type="file" id="debug-file" class="block w-full text-sm text-zinc-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700 mb-4"/>

                    <button id="btn-debug-upload" class="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-all">
                        TESTAR UPLOAD AGORA
                    </button>
                </div>

                <div class="mt-8">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase mb-2">Logs do Sistema:</h3>
                    <div id="debug-console" class="bg-black font-mono text-xs text-green-400 p-4 rounded-lg h-64 overflow-y-auto border border-zinc-800">
                        Aguaradando ação...
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-debug-upload').onclick = runDebugUpload;
    },
    update: () => {} // Sem atualizações automáticas neste modo
};

// Função de Log na Tela
function log(msg, type = 'info') {
    const consoleDiv = document.getElementById('debug-console');
    const color = type === 'error' ? 'text-red-500' : type === 'success' ? 'text-green-400' : 'text-zinc-300';
    const timestamp = new Date().toLocaleTimeString();
    consoleDiv.innerHTML += `<div class="${color} mb-1">[${timestamp}] ${msg}</div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

async function runDebugUpload() {
    const fileInput = document.getElementById('debug-file');
    const file = fileInput.files[0];

    if (!file) {
        log("❌ Nenhum arquivo selecionado.", 'error');
        return;
    }

    if (!State.isConnected) {
        log("❌ Carteira não conectada. Conecte primeiro no menu.", 'error');
        return;
    }

    try {
        log(`🚀 Iniciando teste para: ${file.name} (${(file.size/1024).toFixed(2)} KB)`);

        // 1. Assinatura (Obrigatória pelo seu upload.js)
        log("1. Solicitando assinatura da carteira...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // A MENSAGEM DEVE SER IDÊNTICA À DO ARQUIVO UPLOAD.JS
        // Verifiquei no seu código anterior:
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        
        const signature = await signer.signMessage(message);
        log("✅ Assinatura gerada com sucesso.");

        // 2. Preparar Dados
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('address', address);
        formData.append('description', "Debug Upload Test");

        log("2. Enviando dados para Vercel API (/api/upload)...");
        log("⏳ Aguarde... (Isso pode levar até 60s)");

        const startTime = Date.now();

        // 3. Enviar
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`⏱️ Tempo de resposta: ${duration} segundos.`);

        // 4. Analisar Resposta
        const text = await res.text(); // Pega texto puro caso não seja JSON
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            log("❌ A resposta não é um JSON válido:", 'error');
            log(text.substring(0, 200) + "...", 'error'); // Mostra o erro HTML se houver (ex: 504 Gateway Time-out)
            return;
        }

        if (!res.ok) {
            log(`❌ Erro do Servidor (Status ${res.status}):`, 'error');
            log(`Detalhes: ${JSON.stringify(data, null, 2)}`, 'error');
        } else {
            log("✅ UPLOAD BEM SUCEDIDO!", 'success');
            log(`CID IPFS: ${data.cid}`);
            log(`Link: ${data.ipfsUri}`);
            log("🎉 O sistema Pinata está funcionando perfeitamente.");
        }

    } catch (error) {
        log(`❌ Erro Crítico no Cliente: ${error.message}`, 'error');
        console.error(error);
    }
}