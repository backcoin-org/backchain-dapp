// pages/NotaryPage.js
// ✅ CORRIGIDO: Bugs de listener duplicado e carregamento de documentos.
// ✅ MELHORADO: Indicadores de passo agora mostram estados 'completo' (verde) e 'ativo' (azul).

import { addresses } from '../config.js'; 
import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderError, renderNoData, ipfsGateway } from '../utils.js';
import { safeContractCall, getHighestBoosterBoostFromAPI, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

const BLOCKCHAIN_EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx/";

let currentFileToUpload = null;
let currentUploadedIPFS_URI = null; 
let notaryButtonState = 'initial'; // Controla o botão do Passo 3
let pageContainer = null; // ✅ Container para listeners (corrige bug do clique duplo)

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Renderiza o layout (com novos indicadores de passo)
 */
function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;
    pageContainer = container; // ✅ Armazena o container

    container.innerHTML = `
        <h1 class="text-2xl md:text-3xl font-bold mb-6">Decentralized Notary</h1>
        <p class="text-zinc-400 max-w-3xl mb-8">
            Certify any digital file on the blockchain. Create an immutable, time-stamped record of your ownership, minted as a permanent NFT.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div id="notary-main-box" class="lg:col-span-2 bg-sidebar border border-border-color rounded-xl p-6 shadow-xl space-y-6">
                
                <div class="flex items-center space-x-2 md:space-x-4">
                    <div id="step-indicator-1" class="step-indicator">
                        <i class="fa-solid fa-file-signature text-lg"></i>
                        <span class="hidden md:inline">Step 1: Details</span>
                    </div>
                    <div class="flex-1 h-px bg-border-color"></div>
                    <div id="step-indicator-2" class="step-indicator">
                        <i class="fa-solid fa-cloud-arrow-up text-lg"></i>
                        <span class="hidden md:inline">Step 2: Archive</span>
                    </div>
                    <div class="flex-1 h-px bg-border-color"></div>
                    <div id="step-indicator-3" class="step-indicator">
                        <i class="fa-solid fa-stamp text-lg"></i>
                        <span class="hidden md:inline">Step 3: Certify</span>
                    </div>
                </div>

                <div id="notary-step-1" class="hidden">
                    <h2 class="text-xl font-bold mb-1">Step 1: Document Details</h2>
                    <p class="text-sm text-zinc-400 mb-5">This description will be saved in the NFT metadata. (Max 256 chars)</p>
                    
                    <textarea id="notary-user-description" 
                        rows="4" 
                        class="w-full bg-main border border-border-color rounded-md p-3 text-sm text-zinc-200 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-zinc-500" 
                        placeholder="e.g., 'Last Will and Testament, v1.0' or 'Original manuscript for my novel.'"></textarea>
                    
                    <div class="flex justify-between items-center mt-2">
                         <p id="notary-lib-error" class="text-xs text-red-400 font-semibold hidden"></p>
                         <p id="notary-description-counter" class="text-xs text-zinc-500 text-right w-full">0 / 256</p>
                    </div>

                    <a id="notary-step-1-btn" href="#" class="w-full mt-4 block text-center bg-blue-600 text-white font-bold py-3 px-5 rounded-md transition-colors text-lg btn-disabled shadow-lg">
                        Next: Upload File
                    </a>
                </div>

                <div id="notary-step-2" class="hidden">
                    <div class="flex justify-between items-center mb-5">
                        <h2 class="text-xl font-bold">Step 2: Archive Your File</h2>
                        <button id="notary-step-back-1" class="text-sm text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-arrow-left mr-2"></i> Edit Description
                        </button>
                    </div>
                    
                    <div class="flex items-center justify-center w-full">
                        <label id="notary-file-dropzone" for="notary-file-upload" class="flex flex-col items-center justify-center w-full h-48 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-main hover:bg-zinc-800 transition-colors">
                            <div id="notary-upload-prompt" class="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
                                <i class="fa-solid fa-cloud-arrow-up text-4xl text-zinc-500 mb-3"></i>
                                <p class="mb-2 text-sm text-zinc-400"><span class="font-semibold">Click to upload</span> or drag & drop</p>
                                <p class="text-xs text-zinc-500">Any file type (Max 50MB)</p>
                            </div>
                            <div id="notary-upload-status" class="hidden flex-col items-center justify-center text-center p-4 pointer-events-none">
                            </div>
                        </label>
                    </div>
                    <input id="notary-file-upload" type="file" class="hidden" />
                </div>

                <div id="notary-step-3" class="hidden">
                    <div class="flex justify-between items-center mb-5">
                        <h2 class="text-xl font-bold">Step 3: Certify & Register</h2>
                        <button id="notary-step-back-2" class="text-sm text-zinc-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-arrow-left mr-2"></i> Change File
                        </button>
                    </div>
                    
                    <div class="bg-main border border-border-color rounded-xl p-4 mb-6">
                        <h3 class="text-base font-bold mb-2 text-zinc-200">Summary</h3>
                        <p class="text-sm text-zinc-400">
                            You are about to certify the file <strong id="notary-summary-filename" class="text-zinc-200">...</strong>
                            with the description "<em id="notary-summary-description" class="text-zinc-300">...</em>".
                        </p>
                    </div>

                    <input type="hidden" id="notary-document-uri">
                    <a id="notarize-submit-btn" href="#" class="w-full block text-center bg-blue-600 text-white font-bold py-3 px-5 rounded-md transition-colors text-lg btn-disabled shadow-lg">
                        <i class="fa-solid fa-file-certificate mr-2"></i> Authenticate & Archive
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
                 <div id="notary-user-status-box" class="bg-sidebar border border-border-color rounded-xl p-6 shadow-xl">
                    <h2 class="text-xl font-bold mb-4">My Status</h2>
                    <div id="notary-user-status" class="space-y-4">
                         <div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-16">
            <h2 class="text-2xl font-bold mb-6">My Registered Documents</h2>
            <div id="my-notarized-documents" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 <div class="text-center p-4 text-zinc-500 italic col-span-full">Connect wallet to view your documents.</div>
            </div>
        </div>
    `;
}

/**
 * ✅ MELHORADO: Controla a visibilidade dos painéis e indicadores (ativo/completo)
 */
function updateNotaryStep(targetStep) {
    const steps = [1, 2, 3];
    const indicators = {};
    const panels = {};

    for (const step of steps) {
        indicators[`step${step}`] = document.getElementById(`step-indicator-${step}`);
        panels[`step${step}`] = document.getElementById(`notary-step-${step}`);
    }

    if (!panels.step1 || !indicators.step1) return; // Aborta se o layout não foi renderizado

    for (const step of steps) {
        // Oculta todos os painéis
        panels[`step${step}`].classList.add('hidden');
        
        // Reseta todos os indicadores
        indicators[`step${step}`].classList.remove('active', 'complete');
    }

    // Mostra o painel alvo
    if (panels[`step${targetStep}`]) {
        panels[`step${targetStep}`].classList.remove('hidden');
    }

    // Ativa os indicadores
    for (let i = 1; i <= steps.length; i++) {
        if (indicators[`step${i}`]) {
            if (i < targetStep) {
                // Passos anteriores ficam 'completos' (verdes)
                indicators[`step${i}`].classList.add('complete');
            } else if (i === targetStep) {
                // Passo atual fica 'ativo' (azul)
                indicators[`step${i}`].classList.add('active');
            }
        }
    }
}


/**
 * Carrega dados públicos (taxa e pStake) - Sem alterações
 */
async function loadNotaryPublicData() {
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
 * Atualiza os textos dos botões (com ícones) - Sem alterações
 */
function updateNotaryButtonUI() {
    const btn = document.getElementById('notarize-submit-btn');
    if (!btn) return;

    btn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-amber-500', 'bg-green-600', 'bg-purple-600', 'hover:bg-blue-700', 'hover:bg-amber-600', 'hover:bg-green-700', 'hover:bg-purple-700', 'opacity-50');
    btn.href = '#';
    btn.target = '';

    switch (notaryButtonState) {
        case 'file_ready':
            btn.innerHTML = '<i class="fa-solid fa-signature mr-2"></i> Authenticate & Archive';
            btn.classList.add('bg-blue-600', 'hover:bg-blue-700'); 
            break;
        case 'signing':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Authenticating... Please check wallet';
            btn.classList.add('bg-blue-600', 'opacity-50', 'btn-disabled');
            break;
        case 'uploading':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Archiving File to IPFS...';
            btn.classList.add('bg-amber-500', 'opacity-50', 'btn-disabled'); 
            break;
        case 'upload_ready':
            btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i> Certify on Blockchain';
            btn.classList.add('bg-green-600', 'hover:bg-green-700'); 
            break;
        case 'notarizing':
            btn.innerHTML = '<div class="loader-sm inline-block mr-2"></div> Confirming Transaction...';
            btn.classList.add('bg-green-600', 'opacity-50', 'btn-disabled');
            break;
        case 'initial':
        default:
            btn.innerHTML = '<i class="fa-solid fa-file-certificate mr-2"></i> Complete Previous Steps';
            btn.classList.add('btn-disabled');
            break;
    }
}


/**
 * Atualiza o status do usuário (Sidebar) - Sem alterações
 */
function updateNotaryUserStatus() {
    const userStatusEl = document.getElementById('notary-user-status');
    const userStatusBoxEl = document.getElementById('notary-user-status-box');
    const submitBtn = document.getElementById('notarize-submit-btn'); 
    
    if (!userStatusEl || !submitBtn || !userStatusBoxEl) return;

    if (!State.isConnected) {
        userStatusEl.innerHTML = `<div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>`;
        userStatusBoxEl.classList.remove('border-green-500/30');
        userStatusBoxEl.classList.add('border-border-color');
        
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

    const userPStake = State.userTotalPStake || 0n;
    const minPStakeFormatted = formatPStake(State.notaryMinPStake || 0n);
    const userPStakeFormatted = formatPStake(userPStake);

    const userBalance = State.currentUserBalance || 0n;
    const isFileUploaded = (notaryButtonState === 'upload_ready'); 

    const swapLink = addresses.bkcDexPoolAddress || '#';
    const baseFee = State.notaryFee;
    const boosterBips = State.userBoosterBips || 0n; 
    
    let discount = 0n;
    let finalFee = baseFee;
    let discountPercent = "0%";

    if (boosterBips > 0n && baseFee > 0n) {
        const discountBipsSimulated = boosterBips; 
        discount = (baseFee * discountBipsSimulated) / 10000n; 
        finalFee = (baseFee > discount) ? baseFee - discount : 0n;
        discountPercent = `${(Number(discountBipsSimulated) / 100).toFixed(0)}%`; 
    }

    const hasEnoughPStake = State.notaryMinPStake === 0n || userPStake >= State.notaryMinPStake;
    const needsFee = finalFee > 0n;
    const hasEnoughFee = !needsFee || userBalance >= finalFee; 
    
    if (hasEnoughPStake && hasEnoughFee) {
        userStatusBoxEl.classList.add('border-green-500/30');
        userStatusBoxEl.classList.remove('border-border-color');
    } else {
        userStatusBoxEl.classList.remove('border-green-500/30');
        userStatusBoxEl.classList.add('border-border-color');
    }

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
    `;
    
     if (needsFee && !hasEnoughFee) {
          statusHTML += `
               <p class="text-xs text-red-400 mt-2 font-semibold text-center">
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i> You need at least ${formatBigNumber(finalFee)} $BKC (final fee) to pay.
               </p>
          `;
     }
    userStatusEl.innerHTML = statusHTML;

    // --- Lógica de Habilitação do Botão Principal (Passo 3) ---
    const isReadyForBlockchain = hasEnoughPStake && hasEnoughFee && isFileUploaded;
    
    if (!hasEnoughPStake) {
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket mr-2"></i> Delegate to Start';
        submitBtn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-green-600', 'bg-amber-500');
        submitBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        submitBtn.href = '#'; 
        submitBtn.target = '';
        submitBtn.dataset.delegate = 'true'; 
    }
    else if (needsFee && !hasEnoughFee) {
        submitBtn.innerHTML = '<i class="fa-solid fa-shopping-cart mr-2"></i> Buy $BKC to Start';
        submitBtn.classList.remove('btn-disabled', 'bg-blue-600', 'bg-green-600', 'bg-purple-600');
        submitBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
        submitBtn.href = swapLink;
        submitBtn.target = '_blank';
        submitBtn.dataset.delegate = 'false';
    }
    else if (notaryButtonState === 'file_ready') {
         submitBtn.dataset.delegate = 'false';
         updateNotaryButtonUI();
    }
    else if (isReadyForBlockchain) {
         notaryButtonState = 'upload_ready';
         submitBtn.dataset.delegate = 'false';
         updateNotaryButtonUI();
    }
    else if (notaryButtonState !== 'uploading' && notaryButtonState !== 'signing' && notaryButtonState !== 'notarizing') {
         notaryButtonState = currentFileToUpload ? 'file_ready' : 'initial';
         updateNotaryButtonUI();
         submitBtn.dataset.delegate = 'false';
    }
}


/**
 * ✅ CORREÇÃO BUG 2: Função agora remove a checagem 'State.isConnected'
 */
async function renderMyNotarizedDocuments() {
    const docsEl = document.getElementById('my-notarized-documents');
    if (!docsEl) return;
    
    // A verificação 'isConnected' foi removida.
    // A função 'update()' agora é responsável por chamar isso apenas quando conectado.
    
    if (!State.decentralizedNotaryContract) {
         return renderError(docsEl, "Notary contract not loaded.");
    }

    renderLoading(docsEl);

    try {
        const response = await fetch(`${API_ENDPOINTS.getNotaryHistory}/${State.userAddress}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText} (${response.status})`);
        }
        const documents = await response.json();

        if (documents.length === 0) {
            return renderNoData(docsEl, "You have not notarized any documents yet.");
        }

        let documentsHtml = [];
        
        for (const doc of documents) {
            const tokenId = doc.tokenId;
            const metadataURI = doc.metadataURI;
            const txHash = doc.txHash; 

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
                const metaResponse = await fetch(metadataGatewayLink);
                if (!metaResponse.ok) throw new Error(`HTTP error! status: ${metaResponse.status}`);
                const metadata = await metaResponse.json();
                
                name = metadata.name || name;
                description = metadata.description || 'No description provided.';
                
                const fileLink = metadata.image || metadata.animation_url || metadata.external_url;
                
                if (fileLink) {
                    fileGatewayLink = fileLink.startsWith('ipfs://') ? fileLink.replace('ipfs://', ipfsGateway) : fileLink;
                }
                
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
                                    <i class="fa-solid fa-file-zipper text-5xl text-zinc-400"></i>
                                </div>`;
            }

            const explorerLink = `${BLOCKCHAIN_EXPLORER_TX_URL}${txHash}`;

            documentsHtml.push(`
                <div class="bg-sidebar border border-border-color rounded-lg overflow-hidden transition-transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10">
                    ${displayHtml}
                    <div class="p-4">
                        <p class="text-xs ${typeColor} font-bold uppercase">${fileType}</p>
                        <p class="text-base font-bold text-white truncate mt-1" title="${name}">${name}</p>
                        
                        <p class="text-xs text-zinc-400 mt-1 whitespace-pre-wrap break-words" title="${description}">${description}</p>
                        
                        <div class="flex justify-between items-center mt-3">
                            <a href="${fileGatewayLink}" target="_blank" rel="noopener noreferrer" class="text-sm text-amber-400 hover:text-amber-300">
                                View Original File <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
                            </a>
                            
                            <a href="${explorerLink}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-400 hover:text-blue-300" title="View notarization transaction on the blockchain">
                                <i class="fa-solid fa-cube text-lg"></i>
                            </a>
                        </div>

                        <button class="add-to-wallet-btn text-xs text-zinc-400 hover:text-white mt-3 w-full text-left transition-colors" data-address="${State.decentralizedNotaryContract.target}" data-tokenid="${tokenId}">
                            <i class="fa-solid fa-wallet w-4 mr-1"></i> Add to Wallet
                        </button>
                    </div>
                </div>
            `);
        }
        docsEl.innerHTML = documentsHtml.join('');

    } catch (e) {
        console.error("Error loading notarized documents from API:", e);
        renderError(docsEl, "Failed to load your documents from the API.");
    }
}


/**
 * Lida com o upload do arquivo (sem restrições de tipo)
 */
async function handleFileUpload(file) {
    const uploadPromptEl = document.getElementById('notary-upload-prompt');
    const uploadStatusEl = document.getElementById('notary-upload-status');
    const errorEl = document.getElementById('notary-lib-error');
    
    if (errorEl) errorEl.classList.add('hidden');

    const fileName = file.name || "";
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
         const msg = `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit.`;
         uploadPromptEl.classList.add('hidden');
         uploadStatusEl.classList.remove('hidden');
         uploadStatusEl.innerHTML = `
            <i class="fa-solid fa-file-circle-exclamation text-5xl text-red-400 mb-3"></i>
            <p class="text-sm font-bold text-red-400">File Too Large</p>
            <p class="text-xs text-zinc-400">${fileName}</p>
            <p class="text-xs text-zinc-500 mt-1">${msg}</p>
         `;
         const fileInput = document.getElementById('notary-file-upload');
         if(fileInput) fileInput.value = '';
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
        <p class="text-xs text-zinc-500 mt-1">Ready to be certified.</p>
    `;

    document.getElementById('notary-summary-filename').innerText = file.name;
    const description = document.getElementById('notary-user-description')?.value || "N/A";
    document.getElementById('notary-summary-description').innerText = description;

    notaryButtonState = 'file_ready';
    updateNotaryStep(3); // Avança para o painel de status/pagamento
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
 * ✅ CORREÇÃO BUG 1: Anexa listeners ao 'pageContainer' para evitar duplicatas.
 */
function initNotaryListeners() {
    const fileInput = document.getElementById('notary-file-upload');
    const submitBtn = document.getElementById('notarize-submit-btn');
    const errorEl = document.getElementById('notary-lib-error');

    // --- Listeners dos Passos ---
    const step1Btn = document.getElementById('notary-step-1-btn');
    const stepBack1Btn = document.getElementById('notary-step-back-1');
    const stepBack2Btn = document.getElementById('notary-step-back-2');

    if (step1Btn) {
        step1Btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (step1Btn.classList.contains('btn-disabled')) {
                showToast("Please provide a valid description (1-256 chars).", "error");
                document.getElementById('notary-user-description')?.focus();
                return;
            }
            updateNotaryStep(2);
        });
    }

    if (stepBack1Btn) {
        stepBack1Btn.addEventListener('click', (e) => {
            e.preventDefault();
            updateNotaryStep(1);
        });
    }

    if (stepBack2Btn) {
        stepBack2Btn.addEventListener('click', (e) => {
            e.preventDefault();
            currentFileToUpload = null;
            currentUploadedIPFS_URI = null;
            notaryButtonState = 'initial';
            updateNotaryStep(2);
            const uploadPromptEl = document.getElementById('notary-upload-prompt');
            const uploadStatusEl = document.getElementById('notary-upload-status');
            if(uploadPromptEl) uploadPromptEl.classList.remove('hidden');
            if(uploadStatusEl) { uploadStatusEl.classList.add('hidden'); uploadStatusEl.innerHTML = ''; }
            if(fileInput) fileInput.value = '';
        });
    }


    // --- Listener do contador de caracteres (Passo 1) ---
    const descriptionInput = document.getElementById('notary-user-description');
    const descriptionCounter = document.getElementById('notary-description-counter');
    
    if (descriptionInput && descriptionCounter && step1Btn) {
        descriptionInput.addEventListener('input', () => {
            const length = descriptionInput.value.length;
            descriptionCounter.innerText = `${length} / 256`;
            
            if (length > 0 && length <= 256) {
                descriptionCounter.classList.remove('text-red-400');
                descriptionCounter.classList.add('text-zinc-500');
                step1Btn.classList.remove('btn-disabled');
                if (errorEl) errorEl.classList.add('hidden');
            } else {
                descriptionCounter.classList.add('text-red-400');
                descriptionCounter.classList.remove('text-zinc-500');
                step1Btn.classList.add('btn-disabled');
                if (errorEl) errorEl.classList.add('hidden'); 
            }
        });
    }
    
    // --- Listener de Seleção de Arquivo (Passo 2) ---
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
                 const uploadPromptEl = document.getElementById('notary-upload-prompt');
                 const uploadStatusEl = document.getElementById('notary-upload-status');
                 if(uploadPromptEl) uploadPromptEl.classList.remove('hidden');
                 if(uploadStatusEl) { uploadStatusEl.classList.add('hidden'); uploadStatusEl.innerHTML = ''; }
                 currentFileToUpload = null; currentUploadedIPFS_URI = null;
                 if(errorEl) { errorEl.innerText = error.message; errorEl.classList.remove('hidden'); }
                 notaryButtonState = 'initial';
                 updateNotaryButtonUI();
                 updateNotaryUserStatus();
            }
        });
    }
    
    // ✅ CORREÇÃO BUG 1: Listener de clique agora está anexado ao container da página (pageContainer)
    if (pageContainer) {
        // Remove qualquer listener antigo para evitar duplicatas (medida de segurança)
        pageContainer.replaceWith(pageContainer.cloneNode(true));
        pageContainer = document.getElementById('notary'); // Re-seleciona o novo nó
        
        if (!pageContainer) return; // Segurança

        pageContainer.addEventListener('click', async (e) => {
            // Listener para o botão de Delegar (na caixa de Status)
            const delegateBtn = e.target.closest('#delegate-now-btn') || 
                                (e.target.closest('#notarize-submit-btn') && e.target.closest('#notarize-submit-btn').dataset.delegate === 'true');
            if (delegateBtn) {
                e.preventDefault();
                document.querySelector('.sidebar-link[data-target="mine"]')?.click();
                showToast("Redirecting to the Mining page to Delegate and acquire pStake.", "info");
                return;
            }

            // Listener para o botão de Ajuda (na caixa de Status)
            if (e.target.closest('#pstake-help-btn')) {
                e.preventDefault();
                showToast("pStake is your Power Stake—your overall influence in the Backchain ecosystem, calculated by your delegated $BKC amount multiplied by the lock duration.", "info", 10000);
                return;
            }

            // Listener "Add to Wallet" (lista de documentos)
            if (e.target.closest('.add-to-wallet-btn')) {
                e.preventDefault();
                await handleAddNFTToWallet(e);
                return;
            }
        });
    }

    // --- Listener do Botão Principal (Passo 3) ---
    // (Anexado separadamente pois está dentro do 'pageContainer' e não precisa de delegação)
    const finalSubmitBtn = document.getElementById('notarize-submit-btn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (finalSubmitBtn.classList.contains('btn-disabled')) return;
            if (finalSubmitBtn.href !== '#' && finalSubmitBtn.target === '_blank') return;
            if (finalSubmitBtn.dataset.delegate === 'true') return;

            if (!State.isConnected || !State.provider) {
                return showToast("Please connect your wallet first.", "error");
            }
            
            const signer = await State.provider.getSigner();
            const userAddress = State.userAddress;
            const description = document.getElementById('notary-user-description')?.value || '';

            if (description.length === 0 || description.length > 256) {
                 showToast("Error: Public description is invalid.", "error");
                 updateNotaryStep(1); 
                 document.getElementById('notary-user-description')?.focus();
                 return;
            }

            // --- ESTADO 1: (File Ready) Autenticar ---
            if (notaryButtonState === 'file_ready') {
                
                const baseFee = State.notaryFee || 0n;
                const boosterBips = State.userBoosterBips || 0n;
                let finalFee = baseFee;
                if (boosterBips > 0n && baseFee > 0n) {
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

                    notaryButtonState = 'uploading';
                    updateNotaryButtonUI();

                    const formData = new FormData();
                    formData.append('file', currentFileToUpload);
                    formData.append('signature', signature); 
                    formData.append('address', userAddress);
                    formData.append('description', description); 

                    const response = await fetch(API_ENDPOINTS.uploadFileToIPFS, { 
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
                        throw new Error(errorResult.details || errorResult.error || `Server failed: ${response.statusText}`);
                    }

                    const result = await response.json();
                    currentUploadedIPFS_URI = result.ipfsUri; 
                    document.getElementById('notary-document-uri').value = currentUploadedIPFS_URI;

                    notaryButtonState = 'upload_ready';
                    updateNotaryButtonUI();
                    updateNotaryUserStatus();
                    showToast("Archive Successful! Ready to Certify.", "success");

                } catch (error) {
                    console.error("Sign or Upload Error:", error);
                    showToast(`Error: ${error.message}`, "error");
                    notaryButtonState = 'file_ready'; 
                    updateNotaryButtonUI();
                }
                return; 
            }

            // --- ESTADO 4: (Upload Ready) Notarizar ---
            if (notaryButtonState === 'upload_ready') {
                
                if (!currentUploadedIPFS_URI) return showToast("Error: File URI is missing.", "error");
                
                notaryButtonState = 'notarizing';
                updateNotaryButtonUI();

                const boosterId = State.userBoosterId || 0n; 
                
                const success = await executeNotarizeDocument(
                    currentUploadedIPFS_URI, 
                    boosterId,               
                    finalSubmitBtn                
                );

                if (success) {
                    // Limpar Estado e voltar ao Passo 1
                    currentFileToUpload = null;
                    currentUploadedIPFS_URI = null;
                    notaryButtonState = 'initial';
                    if(fileInput) fileInput.value = '';
                    const descInput = document.getElementById('notary-user-description');
                    const descCounter = document.getElementById('notary-description-counter');
                    if(descInput) descInput.value = '';
                    if(descCounter) descCounter.innerText = '0 / 256';
                    
                    updateNotaryStep(1); // Volta ao início

                    showToast("Transaction Confirmed! Refreshing list...", "info");

                    setTimeout(async () => {
                        await renderMyNotarizedDocuments(); // Atualiza a lista
                        showToast("Document list refreshed!", "success");
                    }, 3000);
                } else {
                    notaryButtonState = 'upload_ready'; // Permite tentar a tx novamente
                    updateNotaryButtonUI();
                }
                return;
            }
        });
    }
}

// --- Objeto da Página ---
export const NotaryPage = {
    async render() {
        renderNotaryPageLayout();
        
        const fileInput = document.getElementById('notary-file-upload');
        if (fileInput) fileInput.disabled = false;
        
        await loadPublicData(); 
        const loadedPublicData = await loadNotaryPublicData();

        if (State.isConnected && loadedPublicData) {
            await loadUserData();
            const boosterData = await getHighestBoosterBoostFromAPI();
            State.userBoosterBips = BigInt(boosterData.highestBoost || 0);
            State.userBoosterId = boosterData.tokenId ? BigInt(boosterData.tokenId) : 0n;

            updateNotaryUserStatus(); 
            // ✅ CORREÇÃO BUG 2: Documentos são carregados aqui
            await renderMyNotarizedDocuments(); 
        } else {
             this.update(State.isConnected); 
        }

        // ✅ CORREÇÃO BUG 1: Listeners agora são anexados APENAS UMA VEZ
        initNotaryListeners();
        
        // Inicia no Passo 1
        updateNotaryStep(1);
    },

    init() {
        // initNotaryListeners() é chamado no final do render()
    },

    async update(isConnected) {
        console.log("Updating Notary Page, isConnected:", isConnected);
        
        const loadedPublicData = await loadNotaryPublicData();

        if (isConnected && loadedPublicData) {
            await loadUserData(); 
            const boosterData = await getHighestBoosterBoostFromAPI();
            State.userBoosterBips = BigInt(boosterData.highestBoost || 0);
            State.userBoosterId = boosterData.tokenId ? BigInt(boosterData.tokenId) : 0n;
            
            updateNotaryUserStatus();
            // ✅ CORREÇÃO BUG 2: Garante que os documentos sejam carregados APÓS a conexão
            await renderMyNotarizedDocuments(); 
        } else {
             const userStatusEl = document.getElementById('notary-user-status');
             const docsEl = document.getElementById('my-notarized-documents');
             
             if(userStatusEl) userStatusEl.innerHTML = `<div class="text-center p-4 text-zinc-500 italic">Please connect your wallet to see your status.</div>`;
             
             // ✅ CORREÇÃO BUG 2: Mostra a mensagem correta se não estiver conectado
             if(docsEl) renderNoData(docsEl, "Connect your wallet to view your documents.");

             notaryButtonState = 'initial';
             updateNotaryUserStatus(); 

             currentFileToUpload = null; currentUploadedIPFS_URI = null;
              
              const descriptionInput = document.getElementById('notary-user-description');
              const descriptionCounter = document.getElementById('notary-description-counter');
              if(descriptionInput) descriptionInput.value = '';
              if(descriptionCounter) {
                  descriptionCounter.innerText = '0 / 256';
                  descriptionCounter.classList.remove('text-red-400');
                  descriptionCounter.classList.add('text-zinc-500');
              }
              
              // Garante que o estado visual seja redefinido para o Passo 1
              updateNotaryStep(1);
        }
    }
};