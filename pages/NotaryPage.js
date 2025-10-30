// pages/NotaryPage.js

// --- IMPORTANTE: COLE SUA *NOVA* CHAVE DA API 'nft.storage' AQUI ---
const NFT_STORAGE_TOKEN = "01487537.1cb45575c4f646e984285c5d4d9f6bd2"; // <-- SUBSTITUA AQUI
// -----------------------------------------------------------------

// --- DEBUG: Verifica se a lib existe logo no início ---
console.log("NotaryPage.js loading. Checking window.NFTStorage:", window.NFTStorage);
// -----------------------------------------------------

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import { formatBigNumber, formatPStake, renderLoading, renderError, renderNoData, ipfsGateway } from '../utils.js';
import { safeContractCall } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

let clientNFTStorage = null;
let currentFileToUpload = null;
let currentUploadedIPFS_URI = null;
let isNFTStorageInitialized = false; // Flag agora indica se a INICIALIZAÇÃO foi BEM SUCEDIDA

/**
 * Renderiza o layout base da página do Cartório. (Sem alterações visuais)
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
                        <p id="notary-lib-error" class="text-xs text-red-400 mt-2 font-semibold hidden">
                           <i class="fa-solid fa-triangle-exclamation mr-1"></i> Upload service failed to load. Please refresh the page.
                        </p>
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
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 1 =======================
 * ==================================================================
 * * Carrega os dados públicos (taxa, pStake) do **EcosystemManager (Hub)**.
 * As funções 'minimumPStakeRequired' e 'notarizeFeeBKC' não existem mais no
 * 'DecentralizedNotary.sol', elas foram movidas para o Hub[cite: 345].
 */
async function loadNotaryPublicData() {
    const statsEl = document.getElementById('notary-stats-container');
    if (!statsEl) return false;
    statsEl.innerHTML = '<div class="text-center p-4"><div class="loader inline-block"></div> Loading Requirements...</div>';

    // MUDANÇA: Agora precisamos verificar o 'ecosystemManagerContract'
    if (!State.ecosystemManagerContract) {
        console.error("loadNotaryPublicData: State.ecosystemManagerContract is not available.");
        renderError(statsEl, "Ecosystem Hub contract not found.");
        return false;
    }

    try {
        console.log("loadNotaryPublicData: Fetching data from EcosystemManager (Hub)...");

        // MUDANÇA: Chamamos 'getServiceRequirements' do Hub usando a chave de serviço.
        // Esta chave "NOTARY_SERVICE" é a mesma usada em 'notarizeDocument' no Solidity[cite: 360].
        const [fee, minPStake] = await Promise.all([
            safeContractCall(State.ecosystemManagerContract, 'getFee', ["NOTARY_SERVICE"], 0n), // [cite: 101, 162]
            safeContractCall(State.ecosystemManagerContract, 'getServiceRequirements', ["NOTARY_SERVICE"], [0n, 0n]) // [cite: 99, 159]
                .then(result => [result[0], result[1]]) // Ajusta para Promise.all
        ]);

        // Nota: O safeContractCall para 'getServiceRequirements' retorna um array [fee, pStake]
        // Estamos usando 'getFee' e 'getServiceRequirements' para compatibilidade,
        // mas 'getServiceRequirements' sozinho já resolveria. Vamos simplificar:

        const [baseFee, pStakeRequirement] = await safeContractCall(
            State.ecosystemManagerContract,
            'getServiceRequirements',
            ["NOTARY_SERVICE"], // Chave do serviço [cite: 360]
            [0n, 0n] // Valor de fallback caso a chamada falhe
        );

        console.log("loadNotaryPublicData: Data fetched from Hub:", { baseFee, pStakeRequirement });

        State.notaryMinPStake = pStakeRequirement;
        State.notaryFee = baseFee; // Esta é a TAXA BASE (antes de descontos)

        if (pStakeRequirement === 0n && baseFee === 0n) {
             console.warn("loadNotaryPublicData: Both fee and minimum pStake are 0.");
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
                <p class="text-xs text-zinc-400 mt-2 text-center font-semibold">Note: Fee is the base price. Booster NFT discounts will be applied at transaction time.</p>
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
 * ======================== FIM DA CORREÇÃO 1 =========================
 * ==================================================================
 */


/**
 * Atualiza o status do usuário E habilita/desabilita o botão.
 * (Sem alterações lógicas, pois 'State.notaryFee' agora é
 * preenchido corretamente pela função 'loadNotaryPublicData' corrigida).
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

    const meetsPStakeRequirement = userPStake >= State.notaryMinPStake;
    const hasEnoughPStake = State.notaryMinPStake === 0n || meetsPStakeRequirement;
    const needsFee = State.notaryFee > 0n;
    // Checa se o usuário tem saldo para a TAXA BASE.
    // O contrato vai cobrar o valor com desconto, mas isso é uma boa checagem de UI.
    const hasEnoughFee = !needsFee || userBalance >= State.notaryFee;
    const isFileUploaded = !!currentUploadedIPFS_URI;

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
        <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-400 flex items-center">
                <i class="fa-solid ${hasEnoughFee ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} w-5 mr-2"></i>
                Your $BKC (${needsFee ? formatBigNumber(State.notaryFee) : '0'} base needed):
            </span>
            <span class="font-bold ${hasEnoughFee ? 'text-green-400' : 'text-red-400'} text-base">
                ${formatBigNumber(userBalance).toFixed(2)}
            </span>
        </div>
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
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i> You need at least ${formatBigNumber(State.notaryFee)} $BKC (base fee) to pay the registration fee. Acquire more $BKC.
               </p>
          `;
     }

    userStatusEl.innerHTML = statusHTML;

    // Habilita o botão
    if (hasEnoughPStake && hasEnoughFee && isFileUploaded && isNFTStorageInitialized) {
        submitBtn.classList.remove('btn-disabled');
        submitBtn.disabled = false;
    } else {
        submitBtn.classList.add('btn-disabled');
        submitBtn.disabled = true;
    }
}


/**
 * Carrega e renderiza os NFTs de cartório que o usuário possui. (Sem alterações)
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

            const isImage = docURI.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
            const isPdf = docURI.match(/\.(pdf)$/i) != null;

            let displayHtml = '';
            let fileType = 'File';
            let typeColor = 'text-zinc-400';
            const gatewayLink = docURI.startsWith('ipfs://') ? docURI.replace('ipfs://', ipfsGateway) : docURI;

            if (isImage) {
                fileType = 'Image';
                typeColor = 'text-cyan-400';
                displayHtml = `<img src="${gatewayLink}" alt="Document ${tokenId}" class="w-full h-40 object-cover rounded-t-lg">`;
            } else if (isPdf) {
                fileType = 'PDF Document';
                typeColor = 'text-red-400';
                displayHtml = `<div class="w-full h-40 flex items-center justify-center bg-zinc-800 rounded-t-lg">
                                   <i class="fa-solid fa-file-pdf text-5xl text-red-400"></i>
                               </div>`;
            } else {
                 fileType = 'IPFS File';
                 typeColor = 'text-blue-400';
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
 * Tenta inicializar o cliente NFTStorage **SE** a biblioteca global estiver disponível. (Sem alterações)
 */
function attemptNFTStorageInitialization() {
    // Só tenta se a lib parece existir E ainda não inicializamos
    if (!isNFTStorageInitialized && window.NFTStorage && window.NFTStorage.NFTStorage) {
        console.log("Attempting NFT.storage client initialization...");
        const NftStorageLib = window.NFTStorage;

        if (NFT_STORAGE_TOKEN && NFT_STORAGE_TOKEN !== "COLE_SUA_NOVA_API_KEY_AQUI") {
            try {
                clientNFTStorage = new NftStorageLib.NFTStorage({ token: NFT_STORAGE_TOKEN });
                isNFTStorageInitialized = true; // Marca como sucesso!
                console.log("NFT.storage client initialized successfully.");
                // Garante que a UI de erro/desabilitado seja removida
                document.getElementById('notary-lib-error')?.classList.add('hidden');
                const dropzone = document.getElementById('notary-file-dropzone');
                if (dropzone) {
                    dropzone.classList.remove('cursor-not-allowed', 'opacity-50');
                    dropzone.title = "";
                }
                const fileInput = document.getElementById('notary-file-upload');
                if (fileInput) fileInput.disabled = false;
            } catch (error) {
                console.error("Error initializing NFT.storage client:", error);
                showToast("Failed to initialize upload service.", "error");
                isNFTStorageInitialized = false;
            }
        } else {
            console.error("NFT.storage API Key is missing or invalid.");
            showToast("NFT.storage API Key not configured. Upload disabled.", "error");
            isNFTStorageInitialized = false;
        }
    } else if (!isNFTStorageInitialized) {
         console.warn("NFT.storage library (window.NFTStorage) not found during initialization attempt.");
         isNFTStorageInitialized = false;
         // Não mostra toast aqui, pois pode ser chamado no carregamento
    }

    // Se falhou (ou a lib não existe), garante que a UI mostre o erro
    if (!isNFTStorageInitialized) {
         const libErrorEl = document.getElementById('notary-lib-error');
         const dropzone = document.getElementById('notary-file-dropzone');
         const fileInput = document.getElementById('notary-file-upload');
         if (libErrorEl) libErrorEl.classList.remove('hidden');
         if (dropzone) dropzone.classList.add('cursor-not-allowed', 'opacity-50');
         if (fileInput) fileInput.disabled = true;
    }
}


/**
 * Função que lida com o upload do arquivo para o IPFS via nft.storage. (Sem alterações)
 */
async function handleFileUpload(file) {
    // Adiciona verificação explícita no início da função
    if (!isNFTStorageInitialized || !clientNFTStorage) {
         console.error("handleFileUpload called but NFT Storage is not initialized or client is null.");
         showToast("Upload service is not ready. Please refresh.", "error");
         // Mostra erro na UI de upload
         document.getElementById('notary-lib-error')?.classList.remove('hidden');
         document.getElementById('notary-file-dropzone')?.classList.add('cursor-not-allowed', 'opacity-50');
         return;
    }

    const uploadPromptEl = document.getElementById('notary-upload-prompt');
    const uploadStatusEl = document.getElementById('notary-upload-status');
    const uriInput = document.getElementById('notary-document-uri');

    currentFileToUpload = file;
    currentUploadedIPFS_URI = null;
    uploadPromptEl.classList.add('hidden');
    uploadStatusEl.classList.remove('hidden');
    uploadStatusEl.innerHTML = `
        <div class="loader inline-block"></div>
        <p class="text-sm text-zinc-300 mt-3">Uploading to IPFS...</p>
        <p class="text-xs text-zinc-500">${file.name}</p>
    `;
    updateNotaryUserStatus();

    try {
        const blob = new Blob([file], { type: file.type });
        const cid = await clientNFTStorage.storeBlob(blob);

        currentUploadedIPFS_URI = `ipfs://${cid}`;
        console.log("Uploaded CID:", cid);
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
        console.error("IPFS Upload Error:", error);
        showToast("File upload failed. Please try again.", "error");

        uploadPromptEl.classList.remove('hidden');
        uploadStatusEl.classList.add('hidden');
        uploadStatusEl.innerHTML = '';
        currentFileToUpload = null;
    }

    updateNotaryUserStatus();
}


/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 2 =======================
 * ==================================================================
 * * Adiciona listeners para a página de Cartório.
 * A função de contrato 'notarizeDocument' agora espera o '_boosterTokenId'
 * em vez da taxa[cite: 358].
 */
function initNotaryListeners() {
    const fileInput = document.getElementById('notary-file-upload');
    const submitBtn = document.getElementById('notarize-submit-btn');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            try {
                if (e.target.files && e.target.files.length > 0) {
                     if (!isNFTStorageInitialized) {
                          console.warn("File selected, but NFT Storage not ready.");
                          showToast("Upload service is not ready yet. Please refresh.", "warning");
                          return;
                     }
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
             if (!isNFTStorageInitialized) return showToast("Upload service not ready.", "error");
            if (!currentUploadedIPFS_URI) return showToast("Please upload a file first.", "error");
            if (typeof State.notaryMinPStake === 'undefined' || typeof State.notaryFee === 'undefined') return showToast("Cannot submit: Notary requirements not loaded.", "error");

            const userPStake = State.userTotalPStake || 0n;
            const userBalance = State.currentUserBalance || 0n;
            const hasEnoughPStake = State.notaryMinPStake === 0n || userPStake >= State.notaryMinPStake;
            // Checa contra a taxa BASE. Se o usuário tiver, ele tem o suficiente (pois o desconto só diminui a taxa)
            const hasEnoughFee = State.notaryFee === 0n || userBalance >= State.notaryFee;

            if (!hasEnoughPStake) return showToast("Insufficient pStake.", "error");
            if (!hasEnoughFee) return showToast("Insufficient $BKC balance for base fee.", "error");

            // MUDANÇA: Obter o Booster ID do Estado Global.
            // (Você deve garantir que 'State.userBoosterId' seja carregado quando
            // o usuário conecta a carteira, lendo o contrato RewardBoosterNFT).
            const boosterId = State.userBoosterId || 0n; // Use 0n se nenhum booster for encontrado

            // MUDANÇA: A função 'executeNotarizeDocument' (do seu arquivo transactions.js)
            // deve ser atualizada para aceitar 'boosterId' como segundo argumento,
            // em vez de 'State.notaryFee'.
            const success = await executeNotarizeDocument(
                currentUploadedIPFS_URI,
                boosterId, // <-- NOVO PARÂMETRO (em vez de State.notaryFee) [cite: 358]
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

                // Recarrega os documentos do usuário e atualiza o status
                await renderMyNotarizedDocuments();
                // Opcional: Recarregar dados do usuário (saldo)
                // await loadUserData(); 
                updateNotaryUserStatus();
            }
        });
    }
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 2 =========================
 * ==================================================================
 */


export const NotaryPage = {
    async render() {
        console.log("Rendering Notary Page...");
        renderNotaryPageLayout();

        // Tenta inicializar a lib AGORA, antes de carregar dados
        attemptNFTStorageInitialization();

        // MUDANÇA: Esta função agora consulta o Hub
        const loadedPublicData = await loadNotaryPublicData();

        if (State.isConnected && loadedPublicData) {
            updateNotaryUserStatus();
            await renderMyNotarizedDocuments();
        } else {
             // Se os dados públicos não carregaram, atualiza o status para refletir isso
             this.update(State.isConnected);
        }

        // MUDANÇA: Esta função agora passa o boosterId
        initNotaryListeners();

        // Mostra erro da lib se necessário APÓS renderizar tudo E se a tentativa falhou
        if (!isNFTStorageInitialized) {
             const libErrorEl = document.getElementById('notary-lib-error');
             const dropzone = document.getElementById('notary-file-dropzone');
             const fileInput = document.getElementById('notary-file-upload');
             if (libErrorEl) libErrorEl.classList.remove('hidden');
             if (dropzone) dropzone.classList.add('cursor-not-allowed', 'opacity-50');
             if (fileInput) fileInput.disabled = true;
             console.log("render: NFT Storage failed to initialize, UI disabled.");
        }
    },

    init() {
        // A inicialização é tentada no render()
        console.log("NotaryPage init called.");
        // Podemos adicionar um listener para 'load' para garantir que tentamos de novo
        // se o script carregar depois
        window.addEventListener('load', () => {
            console.log("Window load event fired. Retrying NFT Storage init if needed.");
            if (!isNFTStorageInitialized) {
                attemptNFTStorageInitialization();
                // Atualiza a UI caso a inicialização tardia funcione
                 const libErrorEl = document.getElementById('notary-lib-error');
                 const dropzone = document.getElementById('notary-file-dropzone');
                 const fileInput = document.getElementById('notary-file-upload');
                if (isNFTStorageInitialized && libErrorEl && dropzone && fileInput){
                     libErrorEl.classList.add('hidden');
                     dropzone.classList.remove('cursor-not-allowed', 'opacity-50');
                     fileInput.disabled = false;
                }
            }
        });
    },

    async update(isConnected) {
        console.log("Updating Notary Page, isConnected:", isConnected);

        // Tenta inicializar a lib se ainda não foi
        if (!isNFTStorageInitialized) attemptNFTStorageInitialization();

        // MUDANÇA: Esta função agora consulta o Hub
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

             // Limpa o estado de upload se desconectado
             currentFileToUpload = null; currentUploadedIPFS_URI = null;
              const uploadPromptEl = document.getElementById('notary-upload-prompt');
              const uploadStatusEl = document.getElementById('notary-upload-status');
              if(uploadPromptEl) uploadPromptEl.classList.remove('hidden');
              if(uploadStatusEl) { uploadStatusEl.classList.add('hidden'); uploadStatusEl.innerHTML = ''; }
        }

         // Garante que a UI de erro/desabilitado do upload seja atualizada
         const libErrorEl = document.getElementById('notary-lib-error');
         const dropzone = document.getElementById('notary-file-dropzone');
         const fileInput = document.getElementById('notary-file-upload');
         if (!isNFTStorageInitialized && libErrorEl && dropzone && fileInput) {
             libErrorEl.classList.remove('hidden');
             dropzone.classList.add('cursor-not-allowed', 'opacity-50');
             fileInput.disabled = true;
         } else if (isNFTStorageInitialized && libErrorEl && dropzone && fileInput) {
             // Se foi inicializado com sucesso, garante que o erro está escondido
             libErrorEl.classList.add('hidden');
             dropzone.classList.remove('cursor-not-allowed', 'opacity-50');
             fileInput.disabled = false;
         }
    }
};