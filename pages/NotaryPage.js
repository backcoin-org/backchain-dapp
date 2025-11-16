// pages/NotaryPage.js

import { addresses } from '../config.js'; 
import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderError, renderNoData, ipfsGateway } from '../utils.js';
// É CRÍTICO GARANTIR QUE loadPublicData E loadUserData TRAGAM AS INSTÂNCIAS DE CONTRATO PARA O ESTADO
import { safeContractCall, getHighestBoosterBoostFromAPI, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

let currentFileToUpload = null;
let currentUploadedIPFS_URI = null; // Este será o HASH DOS METADATOS
let notaryButtonState = 'initial'; 

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = [
    'image/jpeg', 'image/png', 'application/pdf', 'image/gif', 'image/webp', 'image/tiff',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'
];
const DANGEROUS_EXTENSIONS = ['.exe', '.js', '.bat', '.sh', '.vbs', '.scr', '.jar', '.dll', '.com', 'cmd', '.php'];


/**
 * Renderiza o layout (mantido)
 */
function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;

    container.innerHTML = `
        <h1 class="text-2xl md:text-3xl font-bold mb-6">Decentralized Notary</h1>
        <p class="text-zinc-400 max-w-3xl mb-8">
            Turn any file into undeniable proof of authorship — minted forever on the blockchain as a BKCN NFT.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div id="notary-main-box" class="lg:col-span-2 bg-sidebar border border-border-color rounded-xl p-6 shadow-xl">
                <h2 class="text-xl font-bold mb-5">Notarize Document</h2>

                <div class="space-y-6">
                    <div>
                        <label for="notary-file-upload" class="block text-sm font-medium text-zinc-300 mb-2 cursor-pointer">1. Select File (Image, PDF, or Audio)</label>
                        <div class="flex items-center justify-center w-full">
                            
                            <label id="notary-file-dropzone" for="notary-file-upload" class="flex flex-col items-center justify-center w-full h-48 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-main hover:bg-zinc-800 transition-colors">
                                <div id="notary-upload-prompt" class="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none"> <i class="fa-solid fa-cloud-arrow-up text-4xl text-zinc-500 mb-3"></i>
                                    <p class="mb-2 text-sm text-zinc-400"><span class="font-semibold">Click to upload</span> or drag & drop</p>
                                    <p class="text-xs text-zinc-500">Image, PDF, or Audio (Max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)</p>
                                </div>
                                <div id="notary-upload-status" class="hidden flex-col items-center justify-center text-center p-4 pointer-events-none">
                                    </div>
                            </label>
                        </div>
                        <input id="notary-file-upload" type="file" class="hidden" accept="image/*,.pdf,audio/*"/>
                        
                        <p id="notary-lib-error" class="text-xs text-red-400 mt-2 font-semibold hidden"></p>
                    
                    </div>

                    <div>
                        <label for="notary-user-description" class="block text-sm font-medium text-zinc-300 mb-2">2. Add a Public Description (Required for NFT Metadata)</label>
                        
<textarea id="notary-user-description" 
    rows="3" 
    class="w-full bg-main border border-border-color rounded-md p-3 text-sm text-zinc-200 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-zinc-500" 
    placeholder="e.g., This is my original song. / This is my own video. / This is a book I wrote. / This is a signed contract between the parties. Briefly describe what you’re registering on the blockchain (max 256 characters).">
</textarea>
                        
                        <p id="notary-description-counter" class="text-xs text-zinc-500 text-right">0 / 256</p>
                    </div>
                    <input type="hidden" id="notary-document-uri">

                    <a id="notarize-submit-btn" href="#" class="w-full block text-center bg-blue-600 text-white font-bold py-3 px-5 rounded-md transition-colors text-lg btn-disabled shadow-lg">
                        <i class="fa-solid fa-file-certificate mr-2"></i> Select File to Notarize
                    </a>
                </div>
            </div>

            <div class="lg:col-span-1 space-y-6">
                <div class="bg-sidebar border border-border-color rounded-xl p-6 shadow-xl">
                    <h2 class="text-xl font-bold mb-4">Service Requirements</h2>
                    <div id="notary-stats-container" class="space-y-4">
                        <div class="text-center p-4"><div class="loader inline-block"></div></div>
                    </div>
                </div>
                 <div class="bg-sidebar border border-border-color rounded-xl p-6 shadow-xl">
                    <h2 class="text-xl font-bold mb-4">My Status</h2>
                    <div id="notary-user-status" class="space-y-4">
                         <div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-16">
            <h2 class="text-2xl font-bold mb-6">My Notarized Documents</h2>
            <div id="my-notarized-documents" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 <div class="text-center p-4 text-zinc-500 italic col-span-full">Connect wallet to view your documents.</div>
            </div>
        </div>
    `;
}

/**
 * Carrega dados públicos (taxa e pStake)
 */
async function loadNotaryPublicData() {
    // CORREÇÃO 1: Garante que os contratos sejam carregados antes de qualquer chamada
    await loadPublicData(); 

    const statsEl = document.getElementById('notary-stats-container');
    if (!statsEl) return false;
    statsEl.innerHTML = '<div class="text-center p-4"><div class="loader inline-block"></div> Loading Requirements...</div>';

    if (!State.ecosystemManagerContract) {
        console.error("loadNotaryPublicData: State.ecosystemManagerContract is not available after loadPublicData.");
        renderError(statsEl, "Ecosystem Hub contract not found.");
        return false;
    }

    try {
        const [baseFee, pStakeRequirement] = await safeContractCall(
            State.ecosystemManagerContract,
            'getServiceRequirements',
            ["NOTARY_SERVICE"], 
            [0n, 0n] 
        );

        State.notaryMinPStake = pStakeRequirement;
        State.notaryFee = baseFee; 

        if (pStakeRequirement === 0n && baseFee === 0n) {
             statsEl.innerHTML = `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-zinc-400">Registration Fee (Base):</span>
                    <span class="font-bold text-amber-400 text-lg">0 $BKC <i title="Value is currently 0 on-chain" class="fa-solid fa-triangle-exclamation text-yellow-500 ml-1"></i></span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-zinc-400">Minimum pStake Required:</span>
                    <span class="font-bold text-purple-400 text-lg">0 <i title="Value is currently 0 on-chain" class="fa-solid fa-triangle-exclamation text-yellow-500 ml-1"></i></span>
                </div>
                 <p class="text-xs text-yellow-500 mt-2 text-center font-semibold">Warning: Requirements are currently set to zero on the contract. Please configure them.</p>
            `;
        } else {
             statsEl.innerHTML = `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-zinc-400">Registration Fee (Base):</span>
                    <span class="font-bold text-amber-400 text-lg">${formatBigNumber(baseFee)} $BKC</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-zinc-400">Minimum pStake Required:</span>
                    <span class="font-bold text-purple-400 text-lg">${formatPStake(pStakeRequirement)}</span>
                </div>
                <p class="text-xs text-zinc-400 mt-2 text-center font-semibold">Note: Your final fee will be calculated in the 'My Status' panel based on your Booster NFT discount.</p>
            `;
        }
        return true;

    } catch (e) {
        console.error("Error loading notary public data from Hub:", e);
        renderError(statsEl, "Failed to load notary requirements.");
        State.notaryMinPStake = undefined;
        State.notaryFee = undefined;
        return false;
    }
}


/**
 * Atualiza os textos dos botões (com ícones)
 */
function updateNotaryButtonUI() {
    const btn = document.getElementById('notarize-submit-btn');
    if (!btn) return;

    // Reset styles
    btn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-amber-500', 'bg-green-600', 'bg-purple-600', 'hover:bg-blue-700', 'hover:bg-amber-600', 'hover:bg-green-700', 'hover:bg-purple-700', 'opacity-50');
    btn.href = '#';
    btn.target = '';

    switch (notaryButtonState) {
        case 'file_ready':
            btn.innerHTML = '<i class="fa-solid fa-signature mr-2"></i> Sign to Authenticate File';
            btn.classList.add('bg-blue-600', 'hover:bg-blue-700'); 
            break;
        case 'signing':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Signing... Please check wallet';
            btn.classList.add('bg-blue-600', 'opacity-50', 'btn-disabled');
            break;
        case 'uploading':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Uploading to IPFS...';
            btn.classList.add('bg-amber-500', 'opacity-50', 'btn-disabled'); 
            break;
        case 'upload_ready':
            btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i> Notarize on Blockchain';
            btn.classList.add('bg-green-600', 'hover:bg-green-700'); 
            break;
        case 'notarizing':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Confirming Transaction...';
            btn.classList.add('bg-green-600', 'opacity-50', 'btn-disabled');
            break;
        case 'initial':
        default:
            btn.innerHTML = '<i class="fa-solid fa-file-certificate mr-2"></i> Select File to Notarize';
            btn.classList.add('btn-disabled');
            break;
    }
}


/**
 * Atualiza o status do usuário (pStake, saldo, taxas) e o botão principal.
 */
function updateNotaryUserStatus() {
    const userStatusEl = document.getElementById('notary-user-status');
    const submitBtn = document.getElementById('notarize-submit-btn'); 
    
    if (!userStatusEl || !submitBtn) return;

    if (!State.isConnected) {
        userStatusEl.innerHTML = `<div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>`;
        
        notaryButtonState = 'initial'; 
        updateNotaryButtonUI(); 
        return;
    }

    if (typeof State.notaryMinPStake === 'undefined' || typeof State.notaryFee === 'undefined') {
        userStatusEl.innerHTML = renderError(userStatusEl, "Could not load requirements.", true);
        notaryButtonState = 'initial';
        updateNotaryButtonUI();
        return;
    }

    // CORREÇÃO DE FORMATO: Garante que os valores BigInt de pStake sejam processados
    const userPStake = State.userTotalPStake || 0n;
    const minPStakeFormatted = formatPStake(State.notaryMinPStake || 0n);
    const userPStakeFormatted = formatPStake(userPStake);


    const userBalance = State.currentUserBalance || 0n;
    const isFileUploaded = (notaryButtonState === 'upload_ready'); 

    // AJUSTADO: Usando addresses.bkcDexPoolAddress para o link de compra (swap)
    const swapLink = addresses.bkcDexPoolAddress || '#';

    const baseFee = State.notaryFee;
    const boosterBips = State.userBoosterBips || 0n; 
    
    let discount = 0n;
    let finalFee = baseFee;
    let discountPercent = "0%";

    if (boosterBips > 0n && baseFee > 0n) {
        // Simulação do desconto (Para UI, usando a lógica simplificada)
        const discountBipsSimulated = boosterBips; 
        discount = (baseFee * discountBipsSimulated) / 10000n; 
        finalFee = (baseFee > discount) ? baseFee - discount : 0n;
        discountPercent = `${(Number(discountBipsSimulated) / 100).toFixed(0)}%`; 
    }

    const hasEnoughPStake = State.notaryMinPStake === 0n || userPStake >= State.notaryMinPStake;
    const needsFee = finalFee > 0n;
    const hasEnoughFee = !needsFee || userBalance >= finalFee; 
    
     let statusHTML = `
        <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-400 flex items-center">
                <i class="fa-solid ${hasEnoughPStake ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                Your pStake (${minPStakeFormatted} needed):
            </span>
            <span class="font-bold ${hasEnoughPStake ? 'text-green-400' : 'text-red-400'} text-base">
                ${userPStakeFormatted}
            </span>
        </div>
        
        ${!hasEnoughPStake && State.notaryMinPStake > 0n ? `
            <div class="mt-2 text-center flex gap-3">
                <button id="delegate-now-btn" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                    <i class="fa-solid fa-arrow-right-from-bracket mr-2"></i> Delegate Now
                </button>
                <button id="pstake-help-btn" class="flex-shrink-0 bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm" title="What is pStake and how to earn it?">
                    <i class="fa-solid fa-question-circle"></i> 
                </button>
            </div>
        ` : ''}

        <div class="border-t border-border-color my-3"></div>

        <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400">Base Fee:</span>
            <span class="font-bold text-zinc-400">${formatBigNumber(baseFee)} $BKC</span>
        </div>
        <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-400 flex items-center">
                <i class="fa-solid fa-sparkle w-4 mr-1 text-cyan-400"></i>
                Booster Discount (${discountPercent}):
            </span>
            <span class="font-bold text-cyan-400">
                - ${formatBigNumber(discount)} $BKC
            </span>
        </div>
        <div class="flex items-center justify-between text-sm font-bold mt-2">
            <span class="text-zinc-200 flex items-center">
                <i class="fa-solid ${hasEnoughFee ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                Final Fee:
            </span>
            <span class="${hasEnoughFee ? 'text-green-400' : 'text-red-400'} text-lg">
                ${formatBigNumber(finalFee)} $BKC
            </span>
        </div>

        <div class="flex items-center justify-between text-xs mt-1">
            <span class="text-zinc-400">Your $BKC Balance:</span>
            <span class="font-bold ${hasEnoughFee ? 'text-zinc-300' : 'text-red-400'}">
                ${formatBigNumber(userBalance).toFixed(2)}
            </span>
        </div>

        <div class="border-t border-border-color my-3"></div>

         <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-400 flex items-center">
                <i class="fa-solid ${isFileUploaded || notaryButtonState === 'file_ready' ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                File Status:
            </span>
            <span class="font-bold ${isFileUploaded || notaryButtonState === 'file_ready' ? 'text-green-400' : 'text-red-400'} text-base">
                ${isFileUploaded ? 'Uploaded' : (notaryButtonState === 'file_ready' ? 'Ready to Sign' : 'No File')}
            </span>
        </div>
    `;
    
     if (needsFee && !hasEnoughFee) {
          statusHTML += `
               <p class="text-xs text-red-400 mt-2 font-semibold text-center">
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i> You need at least ${formatBigNumber(finalFee)} $BKC (final fee) to pay.
               </p>
          `;
     }
    userStatusEl.innerHTML = statusHTML;

    // --- Lógica de Habilitação do Botão Principal ---
    const isReadyForBlockchain = hasEnoughPStake && hasEnoughFee && isFileUploaded;
    
    if (!hasEnoughPStake) {
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket mr-2"></i> Delegate to Start';
        submitBtn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-green-600', 'bg-amber-500');
        submitBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        submitBtn.href = '#'; 
        submitBtn.target = '';
        submitBtn.dataset.delegate = 'true'; 
        notaryButtonState = 'initial'; // Reinicia o estado do botão
    }
    else if (needsFee && !hasEnoughFee) {
        submitBtn.innerHTML = '<i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC to Start';
        submitBtn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-green-600', 'bg-purple-600');
        submitBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
        submitBtn.href = swapLink;
        submitBtn.target = '_blank';
        submitBtn.dataset.delegate = 'false';
        notaryButtonState = 'initial'; // Reinicia o estado do botão
    }
    else if (notaryButtonState === 'file_ready') {
         submitBtn.dataset.delegate = 'false';
         updateNotaryButtonUI(); // Deve cair em file_ready
    }
    else if (isReadyForBlockchain) {
         notaryButtonState = 'upload_ready';
         submitBtn.dataset.delegate = 'false';
         updateNotaryButtonUI(); // Deve cair em upload_ready
    }
    else if (notaryButtonState !== 'uploading' && notaryButtonState !== 'signing' && notaryButtonState !== 'notarizing') {
         // Se não está pronto, mas o arquivo foi selecionado, retorna ao estado inicial ou file_ready
         notaryButtonState = currentFileToUpload ? 'file_ready' : 'initial';
         updateNotaryButtonUI();
         submitBtn.dataset.delegate = 'false';
    }
}


/**
 * Renderiza os documentos já notarizados
 */
async function renderMyNotarizedDocuments() {
    const docsEl = document.getElementById('my-notarized-documents');
    if (!docsEl) return;

    if (!State.isConnected) {
        return renderNoData(docsEl, "Connect your wallet to view your documents.");
    }
    if (!State.decentralizedNotaryContract) {
        return renderError(docsEl, "Notary contract not loaded.");
    }

    renderLoading(docsEl);

    try {
        const balance = await safeContractCall(State.decentralizedNotaryContract, 'balanceOf', [State.userAddress], 0n);

        if (balance === 0n) {
            return renderNoData(docsEl, "You have not notarized any documents yet.");
        }

        let documentsHtml = [];
        // Loop de trás para frente para mostrar os mais novos primeiro
        for (let i = Number(balance) - 1; i >= 0; i--) {
            const tokenId = await safeContractCall(State.decentralizedNotaryContract, 'tokenOfOwnerByIndex', [State.userAddress, i]);
            
            // ✅ CORRIGIDO: O contrato agora retorna a URI dos METADATOS
            const metadataURI = await safeContractCall(State.decentralizedNotaryContract, 'tokenURI', [tokenId]);
            
            let metadataGatewayLink = metadataURI;
            if (metadataGatewayLink.startsWith('ipfs://')) {
                 metadataGatewayLink = metadataGatewayLink.replace('ipfs://', ipfsGateway);
            }
            
            let fileType = 'File', typeColor = 'text-blue-400';
            let isImage = false, isPdf = false, isAudio = false; 
            let description = 'Loading description...';
            let fileGatewayLink = '#';
            let name = `Document #${tokenId}`;

            try {
                // Busca os metadados do IPFS
                const response = await fetch(metadataGatewayLink);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const metadata = await response.json();
                
                name = metadata.name || name;
                // ✅ CORRIGIDO: 'description' agora contém seu texto personalizado
                description = metadata.description || 'No description provided.';
                
                // Pega o link do arquivo (imagem ou áudio) de dentro dos metadados
                const fileLink = metadata.image || metadata.animation_url || metadata.external_url;
                
                if (fileLink) {
                    fileGatewayLink = fileLink.startsWith('ipfs://') ? fileLink.replace('ipfs://', ipfsGateway) : fileLink;
                }
                
                // ✅ CORRIGIDO: Tenta adivinhar o tipo pelo MIME type nos atributos
                if (metadata.attributes) {
                    const mimeTypeAttr = metadata.attributes.find(a => a.trait_type === "MIME Type");
                    if (mimeTypeAttr) {
                        const mimeType = mimeTypeAttr.value;
                        if (mimeType.startsWith('image/')) {
                            isImage = true; fileType = 'Image'; typeColor = 'text-cyan-400';
                        } else if (mimeType === 'application/pdf') {
                            isPdf = true; fileType = 'PDF Document'; typeColor = 'text-red-400';
                        } else if (mimeType.startsWith('audio/')) { 
                            isAudio = true; fileType = 'Audio Track'; typeColor = 'text-green-400'; 
                        }
                    }
                }
                
            } catch (e) {
                 console.error(`Failed to parse metadata from ${metadataGatewayLink}:`, e);
                 description = 'Failed to load metadata.';
            }

            let displayHtml = '';
            if (isImage) {
                displayHtml = `<img src="${fileGatewayLink}" alt="${name}" class="w-full h-40 object-cover rounded-t-lg">`;
            } else if (isPdf) {
                displayHtml = `<div class="w-full h-40 flex items-center justify-center bg-zinc-800 rounded-t-lg">
                                   <i class="fa-solid fa-file-pdf text-5xl text-red-400"></i>
                               </div>`;
            } else if (isAudio) { 
                 displayHtml = `<div class="w-full h-40 flex flex-col items-center justify-center bg-zinc-800 rounded-t-lg">
                                    <i class="fa-solid fa-music text-5xl text-green-400 mb-2"></i>
                                    <audio controls src="${fileGatewayLink}" class="mt-2 w-11/12"></audio>
                                </div>`;
            } else {
                 displayHtml = `<div class="w-full h-40 flex items-center justify-center bg-zinc-800 rounded-t-lg">
                                    <i class="fa-solid fa-cube text-5xl text-blue-400"></i>
                                </div>`;
            }

            documentsHtml.push(`
                <div class="bg-sidebar border border-border-color rounded-lg overflow-hidden transition-transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10">
                    ${displayHtml}
                    <div class="p-4">
                        <p class="text-xs ${typeColor} font-bold uppercase">${fileType}</p>
                        <p class="text-base font-bold text-white truncate mt-1" title="${name}">${name}</p>
                        
                        <p class="text-xs text-zinc-400 mt-1 whitespace-pre-wrap break-words" title="${description}">${description}</p>
                        
                        <a href="${fileGatewayLink}" target="_blank" rel="noopener noreferrer" class="text-sm text-amber-400 hover:text-amber-300 mt-2 inline-block">
                            View Original File <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
                        </a>
                        
                        <button class="add-to-wallet-btn text-xs text-zinc-400 hover:text-white mt-3 w-full text-left transition-colors" data-address="${State.decentralizedNotaryContract.target}" data-tokenid="${tokenId}">
                            <i class="fa-solid fa-wallet w-4 mr-1"></i> Add to Wallet
                        </button>
                    </div>
                </div>
            `);
        }
        docsEl.innerHTML = documentsHtml.join('');

    } catch (e) {
        console.error("Error loading notarized documents:", e);
        renderError(docsEl, "Failed to load your documents.");
    }
}


/**
 * Lida com o upload do arquivo
 */
async function handleFileUpload(file) {
    const uploadPromptEl = document.getElementById('notary-upload-prompt');
    const uploadStatusEl = document.getElementById('notary-upload-status');
    const errorEl = document.getElementById('notary-lib-error');
    
    if (errorEl) errorEl.classList.add('hidden');

    const fileName = file.name || "";
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    // CORREÇÃO: Verifica se a descrição está vazia (pois agora é essencial para o metadado)
    const descriptionInput = document.getElementById('notary-user-description');
    if (descriptionInput && (!descriptionInput.value.trim() || descriptionInput.value.length > 256)) {
        const msg = "Error: Please fix the public description (1-256 chars) before selecting a file.";
        if (errorEl) { errorEl.innerText = msg; errorEl.classList.remove('hidden'); }
        // Força a revalidação da descrição
        if(descriptionInput.value.length > 256) descriptionInput.focus();
        return; 
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
         const msg = `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit.`;
         if (errorEl) { errorEl.innerText = msg; errorEl.classList.remove('hidden'); }
         return; 
    }
    if (!ALLOWED_MIMES.includes(file.type) && file.type !== '') {
        const msg = `File type '${file.type}' not allowed. Only images, PDFs, and Audio files are accepted.`;
        if (errorEl) { errorEl.innerText = msg; errorEl.classList.remove('hidden'); }
        return;
    }
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
         const msg = `File extension '${fileExtension}' is considered dangerous and blocked.`;
         if (errorEl) { errorEl.innerText = msg; errorEl.classList.remove('hidden'); }
         return;
    }

    currentFileToUpload = file;
    currentUploadedIPFS_URI = null; 
    
    uploadPromptEl.classList.add('hidden');
    uploadStatusEl.classList.remove('hidden');
    uploadStatusEl.innerHTML = `
        <i class="fa-solid fa-file-circle-check text-5xl text-blue-400 mb-3"></i>
        <p class="text-sm font-bold text-blue-400">File Selected</p>
        <p class="text-xs text-zinc-400">${file.name}</p>
        <p class="text-xs text-zinc-500 mt-1">Ready to be signed for upload.</p>
    `;

    notaryButtonState = 'file_ready';
    updateNotaryButtonUI();
    updateNotaryUserStatus();
}


/**
 * Lida com o clique em "Add to Wallet"
 */
async function handleAddNFTToWallet(e) {
    const btn = e.target.closest('.add-to-wallet-btn');
    if (!btn) return; 

    const address = btn.dataset.address;
    const tokenId = btn.dataset.tokenid;

    let rawProvider = State.web3Provider; 
    if (!rawProvider && State.provider && typeof State.provider.provider === 'object') {
        rawProvider = State.provider.provider;
    }
    if (!rawProvider && typeof window.ethereum === 'object') {
         rawProvider = window.ethereum;
    }

    if (!rawProvider || typeof rawProvider.request !== 'function') { 
         console.error("Failed to find .request function on any provider.", { 
            stateWeb3Provider: State.web3Provider, 
            stateProvider: State.provider,
            windowEthereum: (typeof window.ethereum)
         });
         showToast("The connected wallet does not support 'wallet_watchAsset'.", "error");
         return;
    }

    try {
        const wasAdded = await rawProvider.request({ 
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: { address: address, tokenId: tokenId },
            },
        });
        if (wasAdded) {
            showToast("NFT successfully added to your wallet!", "success");
        } else {
            showToast("NFT was not added (request rejected or failed).", "info");
        }
    } catch (error) {
        console.error("Failed to add NFT to wallet:", error);
        showToast(`Failed to add NFT: ${error.message}`, "error");
    }
}

/**
 * Adiciona os listeners da página
 */
function initNotaryListeners() {
    const fileInput = document.getElementById('notary-file-upload');
    const submitBtn = document.getElementById('notarize-submit-btn');
    const errorEl = document.getElementById('notary-lib-error');

    // --- Listener do contador de caracteres ---
    const descriptionInput = document.getElementById('notary-user-description');
    const descriptionCounter = document.getElementById('notary-description-counter');
    
    if (descriptionInput && descriptionCounter) {
        descriptionInput.addEventListener('input', () => {
            const length = descriptionInput.value.length;
            descriptionCounter.innerText = `${length} / 256`;
            if (length > 256) {
                descriptionCounter.classList.add('text-red-400');
                descriptionCounter.classList.remove('text-zinc-500');
            } else {
                descriptionCounter.classList.remove('text-red-400');
                descriptionCounter.classList.add('text-zinc-500');
            }
            // Atualiza o estado do botão se o arquivo já estiver selecionado
            if (currentFileToUpload) {
                if (length > 0 && length <= 256) {
                    notaryButtonState = 'file_ready';
                } else {
                    // Desabilita o fluxo se a descrição for inválida
                    notaryButtonState = 'initial'; 
                }
                updateNotaryButtonUI();
                updateNotaryUserStatus();
            }
        });
    }
    
    // --- Listener de Seleção de Arquivo ---
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (!e.target.files || e.target.files.length === 0) {
                return; 
            }
            try {
                 handleFileUpload(e.target.files[0]);
            } catch (error) {
                 console.error("Error in file input change handler:", error);
                 showToast("An unexpected error occurred selecting the file.", "error");
                 document.getElementById('notary-upload-prompt')?.classList.remove('hidden');
                 const statusEl = document.getElementById('notary-upload-status');
                 if(statusEl) { statusEl.classList.add('hidden'); statusEl.innerHTML = ''; }
                 currentFileToUpload = null; currentUploadedIPFS_URI = null;
                 if(errorEl) { errorEl.innerText = error.message; errorEl.classList.remove('hidden'); }
                 notaryButtonState = 'initial';
                 updateNotaryButtonUI();
                 updateNotaryUserStatus();
            }
        });
    }
    
    // Listener do botão de Delegar
    document.addEventListener('click', (e) => {
        const delegateBtn = e.target.closest('#delegate-now-btn') || 
                            (e.target.closest('#notarize-submit-btn') && e.target.closest('#notarize-submit-btn').dataset.delegate === 'true');
        
        if (delegateBtn) {
            e.preventDefault();
            // CORREÇÃO: O data-target para a página de mineração agora é 'mine'
            document.querySelector('.sidebar-link[data-target="mine"]')?.click();
            showToast("Redirecting to the Mining page to Delegate and acquire pStake.", "info");
        }

        // NOVO: Listener para o botão de ajuda do pStake
        if (e.target.closest('#pstake-help-btn')) {
            e.preventDefault();
            showToast("pStake is your Power Stake—your overall influence in the Backchain ecosystem, calculated by your delegated $BKC amount multiplied by the lock duration.", "info", 10000);
        }
    });

    // --- Listener do Botão Principal (CORRIGIDO) ---
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Verifica estado de desabilitação e links de terceiros
            if (submitBtn.classList.contains('btn-disabled')) return;
            if (submitBtn.href !== '#' && submitBtn.target === '_blank') return;
            if (submitBtn.dataset.delegate === 'true') return;

            if (!State.isConnected || !State.provider) {
                return showToast("Please connect your wallet first.", "error");
            }
            
            const signer = await State.provider.getSigner();
            const userAddress = State.userAddress;
            const descriptionInput = document.getElementById('notary-user-description');
            const description = descriptionInput ? descriptionInput.value : '';

            if (description.length === 0 || description.length > 256) {
                 showToast("Error: Public description must be between 1 and 256 characters.", "error");
                 descriptionInput.focus();
                 return;
            }


            // --- ESTADO 1: Ficheiro pronto, precisa de Assinatura ---
            if (notaryButtonState === 'file_ready') {
                
                const baseFee = State.notaryFee || 0n;
                const boosterBips = State.userBoosterBips || 0n;
                let finalFee = baseFee;
                if (boosterBips > 0n && baseFee > 0n) {
                    // Cálculo da taxa final
                    const maxDiscountBips = await safeContractCall(State.ecosystemManagerContract, 'getBoosterDiscount', [boosterBips], 0n);
                    finalFee = baseFee - ((baseFee * maxDiscountBips) / 10000n);
                }
                const userBalance = State.currentUserBalance || 0n;
                if (finalFee > 0n && userBalance < finalFee) {
                     return showToast(`Insufficient $BKC balance. You need ${formatBigNumber(finalFee)} $BKC.`, "error");
                }

                const message = "I am signing to authenticate my file for notarization on Backchain.";
                
                try {
                    notaryButtonState = 'signing';
                    updateNotaryButtonUI();

                    const signature = await signer.signMessage(message);

                    // --- ESTADO 2: Assinado, precisa de Upload ---
                    notaryButtonState = 'uploading';
                    updateNotaryButtonUI();

                    const formData = new FormData();
                    formData.append('file', currentFileToUpload);
                    formData.append('signature', signature); 
                    formData.append('address', userAddress);
                    formData.append('description', description); // Envia a descrição para a API

                    // ✅ CORREÇÃO: Usando API_ENDPOINTS
                    const response = await fetch(API_ENDPOINTS.uploadFileToIPFS, { 
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
                        throw new Error(errorResult.details || errorResult.error || `Server failed: ${response.statusText}`);
                    }

                    const result = await response.json();
                    currentUploadedIPFS_URI = result.ipfsUri; // Este é o HASH DOS METADATOS
                    document.getElementById('notary-document-uri').value = currentUploadedIPFS_URI;

                    // --- ESTADO 3: Upload feito, pronto para Notarizar ---
                    notaryButtonState = 'upload_ready';
                    updateNotaryButtonUI();
                    updateNotaryUserStatus();
                    showToast("Upload Successful! Ready to Notarize.", "success");

                } catch (error) {
                    console.error("Sign or Upload Error:", error);
                    showToast(`Error: ${error.message}`, "error");
                    notaryButtonState = 'file_ready'; 
                    updateNotaryButtonUI();
                }
                return; 
            }

            // --- ESTADO 4: Pronto para Notarizar ---
            if (notaryButtonState === 'upload_ready') {
                
                if (!currentUploadedIPFS_URI) return showToast("Error: File URI is missing.", "error");
                
                notaryButtonState = 'notarizing';
                updateNotaryButtonUI();

                const boosterId = State.userBoosterId || 0n; 
                
                // ✅ CHAMADA CORRIGIDA: A função notarize do contrato espera apenas URI e ID do Booster
                const success = await executeNotarizeDocument(
                    currentUploadedIPFS_URI, // Arg 1: documentMetadataURI
                    boosterId,               // Arg 2: _boosterTokenId
                    submitBtn                // Arg 3: O elemento do botão
                );

                if (success) {
                    // Limpar Estado
                    currentFileToUpload = null;
                    currentUploadedIPFS_URI = null;
                    notaryButtonState = 'initial';
                    document.getElementById('notary-document-uri').value = '';
                    if(fileInput) fileInput.value = '';
                    if(descriptionInput) descriptionInput.value = '';
                    
                    const descriptionCounter = document.getElementById('notary-description-counter');
                    if(descriptionCounter) {
                        descriptionCounter.innerText = '0 / 256';
                        descriptionCounter.classList.remove('text-red-400');
                        descriptionCounter.classList.add('text-zinc-500');
                    }

                    document.getElementById('notary-upload-prompt')?.classList.remove('hidden');
                    const statusEl = document.getElementById('notary-upload-status');
                    if(statusEl) { statusEl.classList.add('hidden'); statusEl.innerHTML = ''; }
                    
                    updateNotaryButtonUI(); 

                    showToast("Transaction Confirmed! Refreshing list...", "info");

                    setTimeout(async () => {
                        await renderMyNotarizedDocuments();
                        updateNotaryUserStatus();
                        showToast("Document list refreshed!", "success");
                    }, 3000);
                } else {
                    notaryButtonState = 'upload_ready';
                    updateNotaryButtonUI();
                }
                return;
            }
        });
    }
    
    // Listener do botão "Add to Wallet"
    const docsEl = document.getElementById('my-notarized-documents');
    if (docsEl) {
        docsEl.removeEventListener('click', handleAddNFTToWallet); 
        docsEl.addEventListener('click', handleAddNFTToWallet);
    }
}

// --- Objeto da Página ---
export const NotaryPage = {
    async render() {
        renderNotaryPageLayout();

        const libErrorEl = document.getElementById('notary-lib-error');
        if (libErrorEl) libErrorEl.classList.add('hidden');
        
        const fileInput = document.getElementById('notary-file-upload');
        if (fileInput) fileInput.disabled = false;
        
        // Garante que os contratos sejam carregados antes de tentar carregar dados públicos
        await loadPublicData(); 

        const loadedPublicData = await loadNotaryPublicData();

        if (State.isConnected && loadedPublicData) {
            // Garante que os dados do usuário estejam carregados
            await loadUserData();

            const boosterData = await getHighestBoosterBoostFromAPI();
            State.userBoosterBips = BigInt(boosterData.highestBoost || 0);
            State.userBoosterId = boosterData.tokenId ? BigInt(boosterData.tokenId) : 0n;

            updateNotaryUserStatus();
            await renderMyNotarizedDocuments();
        } else {
             this.update(State.isConnected); 
        }

        initNotaryListeners();
    },

    init() {
        // initNotaryListeners() é chamado no final do render()
    },

    async update(isConnected) {
        console.log("Updating Notary Page, isConnected:", isConnected);
        
        // CORREÇÃO: Garante que os contratos estejam prontos em 'update'
        await loadPublicData(); 

        const loadedPublicData = await loadNotaryPublicData();

        if (isConnected && loadedPublicData) {
            await loadUserData(); // Garante que State.userTotalPStake esteja atualizado

            const boosterData = await getHighestBoosterBoostFromAPI();
            State.userBoosterBips = BigInt(boosterData.highestBoost || 0);
            State.userBoosterId = boosterData.tokenId ? BigInt(boosterData.tokenId) : 0n;
            
            updateNotaryUserStatus();
            await renderMyNotarizedDocuments();
        } else {
             const userStatusEl = document.getElementById('notary-user-status');
             const docsEl = document.getElementById('my-notarized-documents');
             
             if(userStatusEl) userStatusEl.innerHTML = `<div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>`;
             if(docsEl) renderNoData(docsEl, "Connect your wallet to view your documents.");

             notaryButtonState = 'initial';
             updateNotaryUserStatus(); 

             currentFileToUpload = null; currentUploadedIPFS_URI = null;
              const uploadPromptEl = document.getElementById('notary-upload-prompt');
              const uploadStatusEl = document.getElementById('notary-upload-status');
              if(uploadPromptEl) uploadPromptEl.classList.remove('hidden');
              if(uploadStatusEl) { uploadStatusEl.classList.add('hidden'); uploadStatusEl.innerHTML = ''; }
              
              const descriptionInput = document.getElementById('notary-user-description');
              const descriptionCounter = document.getElementById('notary-description-counter');
              if(descriptionInput) descriptionInput.value = '';
              if(descriptionCounter) {
                  descriptionCounter.innerText = '0 / 256';
                  descriptionCounter.classList.remove('text-red-400');
                  descriptionCounter.classList.add('text-zinc-500');
              }
        }
    }
};