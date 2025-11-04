// pages/NotaryPage.js

import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderError, renderNoData, ipfsGateway } from '../utils.js';
import { safeContractCall } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

let currentFileToUpload = null;
let currentUploadedIPFS_URI = null;


/**
 * Renderiza o layout (Esta função permanece a mesma)
 */
function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;

    container.innerHTML = `
        <h1 class="text-2xl md:text-3xl font-bold mb-6">Decentralized Notary</h1>
        <p class="text-zinc-400 max-w-3xl mb-8">
            Permanently register the existence of any document or file on the blockchain.
            The upload (image or PDF) is automatically uploaded to IPFS (InterPlanetary File System)
            and minted into an NFT (BKCN) proving your authorship and date of registration.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div class="lg:col-span-2 bg-sidebar border border-border-color rounded-xl p-6 shadow-xl">
                <h2 class="text-xl font-bold mb-5">1. Upload and Notarize Document</h2>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Select File (Image or PDF)</label>
                        <div class="flex items-center justify-center w-full">
                            <label id="notary-file-dropzone" for="notary-file-upload" class="flex flex-col items-center justify-center w-full h-48 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-main hover:bg-zinc-800 transition-colors">
                                <div id="notary-upload-prompt" class="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <i class="fa-solid fa-cloud-arrow-up text-4xl text-zinc-500 mb-3"></i>
                                    <p class="mb-2 text-sm text-zinc-400"><span class="font-semibold">Click to upload</span> or drag & drop</p>
                                    <p class="text-xs text-zinc-500">Any Image or PDF (Max 100MB)</p>
                                </div>
                                <div id="notary-upload-status" class="hidden flex-col items-center justify-center text-center p-4">
                                    </div>
                                <input id="notary-file-upload" type="file" class="hidden" accept="image/*,.pdf"/>
                            </label>
                        </div>
                        
                        <p id="notary-lib-error" class="text-xs text-red-400 mt-2 font-semibold hidden"></p>
                    
                    </div>

                    <input type="hidden" id="notary-document-uri">

                    <button id="notarize-submit-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-md transition-colors text-lg btn-disabled shadow-lg" disabled>
                        <i class="fa-solid fa-stamp mr-2"></i> Pay Fee & Notarize
                    </button>
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
                         <div class="text-center p-4 text-zinc-500 italic">Connect wallet...</div>
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
 * loadNotaryPublicData (Esta função permanece a mesma)
 */
async function loadNotaryPublicData() {
    const statsEl = document.getElementById('notary-stats-container');
    if (!statsEl) return false;
    statsEl.innerHTML = '<div class="text-center p-4"><div class="loader inline-block"></div> Loading Requirements...</div>';

    if (!State.ecosystemManagerContract) {
        console.error("loadNotaryPublicData: State.ecosystemManagerContract is not available.");
        renderError(statsEl, "Ecosystem Hub contract not found.");
        return false;
    }

    try {
        console.log("loadNotaryPublicData: Fetching data from EcosystemManager (Hub)...");
        
        const [baseFee, pStakeRequirement] = await safeContractCall(
            State.ecosystemManagerContract,
            'getServiceRequirements',
            ["NOTARY_SERVICE"], 
            [0n, 0n] 
        );

        console.log("loadNotaryPublicData: Data fetched from Hub:", { baseFee, pStakeRequirement });

        State.notaryMinPStake = pStakeRequirement;
        State.notaryFee = baseFee; // Esta é a Taxa Base

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
 * ==================================================================
 * ============== INÍCIO DA ATUALIZAÇÃO (FEATURE DESCONTO) =============
 * ==================================================================
 * Atualizado para calcular e mostrar o desconto e a taxa final.
 */
function updateNotaryUserStatus() {
    const userStatusEl = document.getElementById('notary-user-status');
    const submitBtn = document.getElementById('notarize-submit-btn');
    if (!userStatusEl || !submitBtn) return;

    if (!State.isConnected) {
        userStatusEl.innerHTML = renderNoData(userStatusEl, "Connect your wallet to see your status.", true);
        submitBtn.classList.add('btn-disabled');
        submitBtn.disabled = true;
        return;
    }

    if (typeof State.notaryMinPStake === 'undefined' || typeof State.notaryFee === 'undefined') {
        userStatusEl.innerHTML = renderError(userStatusEl, "Could not load requirements.", true);
        submitBtn.classList.add('btn-disabled');
        submitBtn.disabled = true;
        return;
    }

    const userPStake = State.userTotalPStake || 0n;
    const userBalance = State.currentUserBalance || 0n;
    const isFileUploaded = !!currentUploadedIPFS_URI;

    // --- LÓGICA DE CÁLCULO DE DESCONTO ---
    const baseFee = State.notaryFee;
    const boosterBips = State.userBoosterBips || 0n; // Pega o Bips do booster do usuário
    
    let discount = 0n;
    let finalFee = baseFee;
    let discountPercent = "0%";

    if (boosterBips > 0n && baseFee > 0n) {
        // BIPS é "basis points", 10000 = 100%
        discount = (baseFee * boosterBips) / 10000n;
        finalFee = baseFee - discount;
        discountPercent = `${(Number(boosterBips) / 100).toFixed(0)}%`; // Converte BIPS (ex: 500) para % (ex: 5%)
    }

    const hasEnoughPStake = State.notaryMinPStake === 0n || userPStake >= State.notaryMinPStake;
    const needsFee = finalFee > 0n;
    // Verifica se o usuário tem saldo para a TAXA FINAL
    const hasEnoughFee = !needsFee || userBalance >= finalFee; 
    // --- FIM DA LÓGICA DE DESCONTO ---


    // --- ATUALIZAÇÃO DO HTML ---
     let statusHTML = `
        <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-400 flex items-center">
                <i class="fa-solid ${hasEnoughPStake ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                Your pStake (${formatPStake(State.notaryMinPStake)} needed):
            </span>
            <span class="font-bold ${hasEnoughPStake ? 'text-green-400' : 'text-red-400'} text-base">
                ${formatPStake(userPStake)}
            </span>
        </div>
        
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
                <i class="fa-solid ${isFileUploaded ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                File Uploaded:
            </span>
            <span class="font-bold ${isFileUploaded ? 'text-green-400' : 'text-red-400'} text-base">
                ${isFileUploaded ? 'Ready' : 'No'}
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

    // A lógica do botão agora usa 'hasEnoughFee' (que já considera a taxa final)
    if (hasEnoughPStake && hasEnoughFee && isFileUploaded) {
        submitBtn.classList.remove('btn-disabled');
        submitBtn.disabled = false;
    } else {
        submitBtn.classList.add('btn-disabled');
        submitBtn.disabled = true;
    }
}
// ==================================================================
// =============== FIM DA ATUALIZAÇÃO (FEATURE DESCONTO) ==============
// ==================================================================


/**
 * renderMyNotarizedDocuments (Esta função permanece a mesma)
 * (incluindo a lógica de detecção de imagem)
 */
async function renderMyNotarizedDocuments() {
    const docsEl = document.getElementById('my-notarized-documents');
    if (!docsEl) return;

    if (!State.isConnected) {
        return renderNoData(docsEl, "Connect your wallet to view your documents.");
    }
    if (!State.decentralizedNotaryContract) {
         console.error("renderMyNotarizedDocuments: Wallet connected but State.decentralizedNotaryContract is missing.");
        return renderError(docsEl, "Notary contract not loaded.");
    }

    renderLoading(docsEl);

    try {
        const balance = await safeContractCall(State.decentralizedNotaryContract, 'balanceOf', [State.userAddress], 0n);

        if (balance === 0n) {
            return renderNoData(docsEl, "You have not notarized any documents yet.");
        }

        let documentsHtml = [];
        for (let i = 0; i < Number(balance); i++) {
            const tokenId = await safeContractCall(State.decentralizedNotaryContract, 'tokenOfOwnerByIndex', [State.userAddress, i]);
            const docURI = await safeContractCall(State.decentralizedNotaryContract, 'tokenURI', [tokenId]);
            
            const gatewayLink = docURI.startsWith('ipfs://') ? docURI.replace('ipfs://', ipfsGateway) : docURI;

            let isImage = false;
            let isPdf = false;
            let fileType = 'IPFS File';
            let typeColor = 'text-blue-400';
            
            try {
                const response = await fetch(gatewayLink, { method: 'HEAD' });
                if (response.ok) {
                    const contentType = response.headers.get('Content-Type') || '';
                    if (contentType.startsWith('image/')) {
                        isImage = true;
                        fileType = 'Image';
                        typeColor = 'text-cyan-400';
                    } else if (contentType === 'application/pdf') {
                        isPdf = true;
                        fileType = 'PDF Document';
                        typeColor = 'text-red-400';
                    }
                } else {
                     console.warn(`Could not fetch HEAD for ${gatewayLink}. Status: ${response.status}`);
                }
            } catch (fetchError) {
                console.warn(`Could not fetch Content-Type for ${gatewayLink}: ${fetchError.message}. Defaulting to generic icon.`);
            }

            let displayHtml = '';
            if (isImage) {
                displayHtml = `<img src="${gatewayLink}" alt="Document ${tokenId}" class="w-full h-40 object-cover rounded-t-lg">`;
            } else if (isPdf) {
                displayHtml = `<div class="w-full h-40 flex items-center justify-center bg-zinc-800 rounded-t-lg">
                                   <i class="fa-solid fa-file-pdf text-5xl text-red-400"></i>
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
                        <p class="text-base font-bold text-white truncate mt-1">Document #${tokenId}</p>
                        <a href="${gatewayLink}" target="_blank" rel="noopener noreferrer" class="text-sm text-amber-400 hover:text-amber-300 mt-2 inline-block">
                            View on IPFS <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
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
 * handleFileUpload (Esta função permanece a mesma)
 */
async function handleFileUpload(file) {
    const uploadPromptEl = document.getElementById('notary-upload-prompt');
    const uploadStatusEl = document.getElementById('notary-upload-status');
    const uriInput = document.getElementById('notary-document-uri');
    const errorEl = document.getElementById('notary-lib-error');

    if (errorEl) errorEl.classList.add('hidden');

    currentFileToUpload = file;
    currentUploadedIPFS_URI = null;
    uploadPromptEl.classList.add('hidden');
    uploadStatusEl.classList.remove('hidden');
    uploadStatusEl.innerHTML = `
        <div class="loader inline-block"></div>
        <p class="text-sm text-zinc-300 mt-3">Sending file to server...</p>
        <p class="text-xs text-zinc-500">${file.name}</p>
    `;
    updateNotaryUserStatus();

    try {
        const formData = new FormData();
        formData.append('file', file); 

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Server failed: ${response.statusText}`);
        }

        const result = await response.json();
        const { ipfsUri, cid } = result;

        currentUploadedIPFS_URI = ipfsUri;
        console.log("Upload via backend successful. CID:", cid);
        console.log("IPFS URI:", currentUploadedIPFS_URI);

        uriInput.value = currentUploadedIPFS_URI;

        uploadStatusEl.innerHTML = `
            <i class="fa-solid fa-check-circle text-5xl text-green-400 mb-3"></i>
            <p class="text-sm font-bold text-green-400">Upload Successful!</p>
            <p class="text-xs text-zinc-500">${file.name}</p>
            <p class="text-xs text-zinc-400 mt-1">URI: ${currentUploadedIPFS_URI.substring(0, 15)}...</p>
        `;
        showToast("File uploaded to IPFS successfully!", "success");

    } catch (error) {
        console.error("IPFS Upload Error (via backend):", error);
        showToast(`Upload failed: ${error.message}`, "error");
        
        if (errorEl) {
            errorEl.innerText = error.message;
            errorEl.classList.remove('hidden');
        }

        uploadPromptEl.classList.remove('hidden');
        uploadStatusEl.classList.add('hidden');
        uploadStatusEl.innerHTML = '';
        currentFileToUpload = null;
    }

    updateNotaryUserStatus();
}


/**
 * ==================================================================
 * ================== INÍCIO DA CORREÇÃO (FUNÇÃO CHAVE) =================
 * ==================================================================
 * Manipulador para o clique no botão "Add to Wallet".
 * Usa o EIP-747 (wallet_watchAsset) para adicionar o NFT ao MetaMask.
 */
async function handleAddNFTToWallet(e) {
    const btn = e.target.closest('.add-to-wallet-btn');
    if (!btn) return; 

    const address = btn.dataset.address;
    const tokenId = btn.dataset.tokenid;

    // --- INÍCIO DA CORREÇÃO ---
    // A hipótese é que 'State.web3Provider' (definido em wallet.js)
    // é o provedor EIP-1193 raw (ex: window.ethereum)
    const rawProvider = State.web3Provider; 

    if (!rawProvider || typeof rawProvider.request !== 'function') { 
         console.error("Failed to find .request function on State.web3Provider.", { web3Provider: State.web3Provider });
         // Mostra a mensagem de erro que o usuário está vendo na imagem
         showToast("The connected wallet does not support 'wallet_watchAsset'.", "error");
         return;
    }
    // --- FIM DA CORREÇÃO ---

    try {
        // Pede ao MetaMask (ou outra carteira) para "assistir" (adicionar) este NFT
        const wasAdded = await rawProvider.request({ // <--- Chamada no provedor correto
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: {
                    address: address, // Endereço do contrato NFT
                    tokenId: tokenId, // ID do token específico
                },
            },
        });

        if (wasAdded) {
            showToast("NFT successfully added to your wallet!", "success");
        } else {
            showToast("NFT was not added (request rejected or failed).", "info");
        }
    } catch (error) {
        // Se a *própria* carteira rejeitar (ex: ela não suporta o método), o erro será pego aqui.
        console.error("Failed to add NFT to wallet:", error);
        showToast(`Failed to add NFT: ${error.message}`, "error");
    }
}
// ==================================================================
// ================== FIM DA CORREÇÃO (FUNÇÃO CHAVE) ==================
// ==================================================================


/**
 * initNotaryListeners (Corrigido o erro de sintaxe)
 */
function initNotaryListeners() {
    const fileInput = document.getElementById('notary-file-upload');
    const submitBtn = document.getElementById('notarize-submit-btn');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            try {
                if (e.target.files && e.target.files.length > 0) {
                     handleFileUpload(e.target.files[0]);
                }
            } catch (error) {
                 console.error("Error in file input change handler:", error);
                 showToast("An unexpected error occurred selecting the file.", "error");
                 document.getElementById('notary-upload-prompt')?.classList.remove('hidden');
                 const statusEl = document.getElementById('notary-upload-status');
                 if(statusEl) { statusEl.classList.add('hidden'); statusEl.innerHTML = ''; }
                 currentFileToUpload = null; currentUploadedIPFS_URI = null;
                 updateNotaryUserStatus();
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
             if (!currentUploadedIPFS_URI) return showToast("Please upload a file first.", "error");
            
            if (typeof State.notaryMinPStake === 'undefined' || typeof State.notaryFee === 'undefined') return showToast("Cannot submit: Notary requirements not loaded.", "error");

            // Recalcula as taxas no momento do clique (garantia)
            const baseFee = State.notaryFee || 0n;
            const boosterBips = State.userBoosterBips || 0n;
            let finalFee = baseFee;
            if (boosterBips > 0n && baseFee > 0n) {
                 finalFee = baseFee - ((baseFee * boosterBips) / 10000n);
            }

            const userPStake = State.userTotalPStake || 0n;
            const userBalance = State.currentUserBalance || 0n;
            const hasEnoughPStake = State.notaryMinPStake === 0n || userPStake >= State.notaryMinPStake;
            const hasEnoughFee = finalFee === 0n || userBalance >= finalFee;

            if (!hasEnoughPStake) return showToast("Insufficient pStake.", "error");
            if (!hasEnoughFee) return showToast("Insufficient $BKC balance for final fee.", "error");

            const boosterId = State.userBoosterId || 0n; 

            const success = await executeNotarizeDocument(
                currentUploadedIPFS_URI,
                boosterId, 
                submitBtn
            );

            if (success) {
                currentFileToUpload = null;
                currentUploadedIPFS_URI = null;
                document.getElementById('notary-document-uri').value = '';
                if(fileInput) fileInput.value = '';

                document.getElementById('notary-upload-prompt').classList.remove('hidden');
                const statusEl = document.getElementById('notary-upload-status');
                statusEl.classList.add('hidden');
                statusEl.innerHTML = '';

                await renderMyNotarizedDocuments();
                
                // ==================================================================
                // ================== INÍCIO DA CORREÇÃO (SINTAXE) =================
                // ==================================================================
                // Corrigido: 'updateNotaryUserS tatus()' -> 'updateNotaryUserStatus()'
                updateNotaryUserStatus();
                // ==================================================================
                // =================== FIM DA CORREÇÃO (SINTAXE) ==================
                // ==================================================================
            }
        });
    }
    
    const docsEl = document.getElementById('my-notarized-documents');
    if (docsEl) {
        docsEl.removeEventListener('click', handleAddNFTToWallet); 
        docsEl.addEventListener('click', handleAddNFTToWallet);
    }
}

export const NotaryPage = {
    async render() {
        console.log("Rendering Notary Page...");
        renderNotaryPageLayout();

        const libErrorEl = document.getElementById('notary-lib-error');
        if (libErrorEl) libErrorEl.classList.add('hidden');
        
        const dropzone = document.getElementById('notary-file-dropzone');
        if (dropzone) {
            dropzone.classList.remove('cursor-not-allowed', 'opacity-50');
            dropzone.title = "";
        }
        const fileInput = document.getElementById('notary-file-upload');
        if (fileInput) fileInput.disabled = false;

        const loadedPublicData = await loadNotaryPublicData();

        if (State.isConnected && loadedPublicData) {
            updateNotaryUserStatus();
            await renderMyNotarizedDocuments();
        } else {
             this.update(State.isConnected);
        }

        initNotaryListeners();
    },

    init() {
        console.log("NotaryPage init called.");
    },

    async update(isConnected) {
        console.log("Updating Notary Page, isConnected:", isConnected);

        const loadedPublicData = await loadNotaryPublicData();

        if (isConnected && loadedPublicData) {
            updateNotaryUserStatus();
            await renderMyNotarizedDocuments();
        } else {
             const userStatusEl = document.getElementById('notary-user-status');
             const docsEl = document.getElementById('my-notarized-documents');
             const submitBtn = document.getElementById('notarize-submit-btn');

             if(userStatusEl) renderNoData(userStatusEl, "Connect your wallet to see your status.");
             if(docsEl) renderNoData(docsEl, "Connect your wallet to view your documents.");
             if(submitBtn) { submitBtn.classList.add('btn-disabled'); submitBtn.disabled = true; }

             currentFileToUpload = null; currentUploadedIPFS_URI = null;
              const uploadPromptEl = document.getElementById('notary-upload-prompt');
              const uploadStatusEl = document.getElementById('notary-upload-status');
              if(uploadPromptEl) uploadPromptEl.classList.remove('hidden');
              if(uploadStatusEl) { uploadStatusEl.classList.add('hidden'); uploadStatusEl.innerHTML = ''; }
        }
    }
};