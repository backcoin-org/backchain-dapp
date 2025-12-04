// pages/NotaryPage.js
// ✅ VERSÃO REDESENHADA (V9.0): Bloqueio por Requisitos + Histórico On-Chain + UI Premium

import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderNoData } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

const ethers = window.ethers;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// --- ESTADO LOCAL ---
let currentFileToUpload = null;
let currentUploadedIPFS_URI = null; 
let notaryButtonState = 'initial'; 
let rpcErrorCount = 0; 
let lastNotaryDataFetch = 0; 
let userHistoryCache = null;

// --- CSS CUSTOMIZADO ---
const style = document.createElement('style');
style.innerHTML = `
    .notary-glass {
        background: rgba(24, 24, 27, 0.6);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
    
    .drop-zone-active {
        border: 2px dashed #f59e0b; /* Amber-500 */
        background: rgba(245, 158, 11, 0.05);
        transform: scale(1.01);
    }

    .step-dot {
        width: 12px; height: 12px; border-radius: 50%;
        background: #27272a; border: 2px solid #52525b;
        transition: all 0.3s ease; z-index: 10;
    }
    .step-dot.active { background: #f59e0b; border-color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
    .step-dot.completed { background: #10b981; border-color: #10b981; }

    /* Overlay Animation */
    .mining-overlay { background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px); }
    .scan-line {
        position: absolute; width: 100%; height: 2px; background: #f59e0b;
        animation: scan 2s ease-in-out infinite; box-shadow: 0 0 15px #f59e0b;
    }
    @keyframes scan { 0% {top: 0%; opacity: 0;} 50% {opacity: 1;} 100% {top: 100%; opacity: 0;} }
`;
document.head.appendChild(style);

// =========================================================================
// LÓGICA DE REQUISITOS (GUARD)
// =========================================================================

function checkNotaryRequirements() {
    if (!State.isConnected) return { allowed: false, reason: 'wallet' };
    
    const userPStake = State.userTotalPStake || 0n;
    const reqPStake = State.notaryMinPStake || 0n;
    const userBal = State.currentUserBalance || 0n;
    const reqFee = State.notaryFee || 0n;

    // Se os dados ainda não carregaram (são 0 e não deveriam ser), consideramos "loading" mas bloqueamos preventivamente
    if (reqPStake === 0n && reqFee === 0n) return { allowed: false, reason: 'loading' };

    const hasPStake = userPStake >= reqPStake;
    const hasBalance = userBal >= reqFee;

    if (!hasPStake) return { allowed: false, reason: 'pstake', current: userPStake, required: reqPStake };
    if (!hasBalance) return { allowed: false, reason: 'balance', current: userBal, required: reqFee };

    return { allowed: true };
}

// =========================================================================
// MANIPULAÇÃO DE ARQUIVOS
// =========================================================================

function handleFiles(e) {
    const status = checkNotaryRequirements();
    if (!status.allowed) return; // Bloqueia drag/drop se não tiver requisitos

    const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast(`File too large (${(file.size/1024/1024).toFixed(2)}MB). Max: 10MB.`, "error");
        return;
    }
    
    currentFileToUpload = file;
    updateNotaryStep(2); // Avança para detalhes
}

function initNotaryListeners() {
    const dropArea = document.getElementById('drop-area');
    const input = document.getElementById('notary-file-input');
    
    // Só adiciona listeners se o elemento existir e o usuário tiver permissão
    if (!dropArea || !input || dropArea.classList.contains('cursor-not-allowed')) return;

    dropArea.addEventListener('click', () => input.click());
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('drop-zone-active'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('drop-zone-active'), false);
    });
    
    dropArea.addEventListener('drop', handleFiles);
    input.addEventListener('change', handleFiles);
}

// =========================================================================
// CORE RENDER
// =========================================================================

function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;
    
    // Evita re-renderizar o layout base se já existe
    if (container.querySelector('#notary-layout-base')) {
        updateNotaryInterface(); // Apenas atualiza estados
        return;
    }

    container.innerHTML = `
        <div id="notary-layout-base" class="animate-fadeIn pb-12">
            
            <div id="mining-overlay" class="mining-overlay fixed inset-0 z-[100] hidden flex-col items-center justify-center">
                <div class="relative w-64 h-64 mb-8">
                    <div class="scan-line z-20"></div>
                    <img src="assets/bkc_logo_3d.png" class="w-full h-full object-contain opacity-80 animate-pulse" alt="Processing">
                </div>
                <h3 class="text-3xl font-black text-white mb-2 tracking-widest uppercase text-center">Notarizing Asset</h3>
                <p id="mining-status-text" class="text-amber-500 font-mono text-xs mb-6 uppercase tracking-wider">INITIALIZING PROTOCOL...</p>
                <div class="w-80 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="mining-progress-bar" class="h-full bg-amber-500 w-0 transition-all duration-300"></div>
                </div>
                <p class="mt-4 text-zinc-500 text-[10px] font-mono">DO NOT CLOSE THIS WINDOW</p>
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <i class="fa-solid fa-stamp text-amber-500"></i> Decentralized Notary
                    </h1>
                    <p class="text-zinc-400 mt-2 text-sm max-w-2xl">
                        Create immutable, timestamped proofs of existence for any digital file using the Backcoin Protocol.
                    </p>
                </div>
                <div id="service-status-badge" class="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-500 flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-zinc-600"></div> CHECKING STATUS...
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="lg:col-span-2 space-y-6">
                    
                    <div class="notary-glass rounded-xl p-6 relative overflow-hidden">
                         <div class="absolute top-1/2 left-6 right-6 h-0.5 bg-zinc-800 -z-0"></div>
                         <div id="progress-line-fill" class="absolute top-1/2 left-6 h-0.5 bg-amber-500 -z-0 transition-all duration-500 w-0"></div>
                         
                         <div class="flex justify-between relative z-10 px-4">
                            <div class="flex flex-col items-center gap-2">
                                <div id="dot-1" class="step-dot active"></div>
                                <span class="text-[10px] uppercase font-bold text-zinc-400">Upload</span>
                            </div>
                            <div class="flex flex-col items-center gap-2">
                                <div id="dot-2" class="step-dot"></div>
                                <span class="text-[10px] uppercase font-bold text-zinc-400">Details</span>
                            </div>
                            <div class="flex flex-col items-center gap-2">
                                <div id="dot-3" class="step-dot"></div>
                                <span class="text-[10px] uppercase font-bold text-zinc-400">Sign & Mint</span>
                            </div>
                         </div>
                    </div>

                    <div id="notary-action-area" class="notary-glass rounded-xl p-8 min-h-[420px] flex flex-col justify-center items-center relative transition-all">
                        <div class="loader"></div> </div>

                </div>

                <div class="lg:col-span-1 space-y-6">
                    <div class="notary-glass rounded-xl p-6 border-l-2 border-amber-500">
                        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-zinc-700 pb-2">
                            Service Requirements
                        </h3>
                        <div id="requirements-list" class="space-y-4">
                            <div class="space-y-2 opacity-50">
                                <div class="h-4 bg-zinc-800 rounded w-3/4"></div>
                                <div class="h-4 bg-zinc-800 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800">
                        <h4 class="text-amber-500 font-bold text-xs mb-3 uppercase"><i class="fa-solid fa-lightbulb mr-1"></i> Did you know?</h4>
                        <p class="text-xs text-zinc-500 leading-relaxed text-justify">
                            Files are not stored directly on the Blockchain to save gas. Instead, we generate a SHA-256 cryptographic hash and upload the file to IPFS. The hash is then permanently minted as an NFT event in your wallet history.
                        </p>
                    </div>
                </div>
            </div>

            <div class="mt-16 border-t border-zinc-800 pt-10">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> My Notarized Documents
                    </h2>
                    <button onclick="NotaryPage.refreshHistory()" class="text-xs text-amber-500 hover:text-white transition-colors">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                
                <div id="history-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    ${renderLoading("Syncing blockchain events...")}
                </div>
            </div>
        </div>
    `;

    // Inicia lógica
    updateNotaryInterface();
    fetchUserHistory();
}

function updateNotaryInterface() {
    // 1. Atualiza Status Badge e Lista de Requisitos
    const badge = document.getElementById('service-status-badge');
    const reqList = document.getElementById('requirements-list');
    const actionArea = document.getElementById('notary-action-area');
    
    if (!badge || !reqList || !actionArea) return;

    const check = checkNotaryRequirements();
    const isOnline = State.isConnected;

    // Badge Logic
    if (isOnline) {
        badge.innerHTML = `<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> SYSTEM ONLINE`;
        badge.className = "px-4 py-2 rounded-lg bg-green-900/10 border border-green-500/20 text-xs font-mono text-green-500 flex items-center gap-2";
    } else {
        badge.innerHTML = `<div class="w-2 h-2 rounded-full bg-red-500"></div> WALLET DISCONNECTED`;
        badge.className = "px-4 py-2 rounded-lg bg-red-900/10 border border-red-500/20 text-xs font-mono text-red-500 flex items-center gap-2";
    }

    // Requirements List Logic
    const pStakeReq = State.notaryMinPStake || 0n;
    const feeReq = State.notaryFee || 0n;
    const userStake = State.userTotalPStake || 0n;
    const userBal = State.currentUserBalance || 0n;

    reqList.innerHTML = `
        <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-400">Min. pStake</span>
            <span class="${userStake >= pStakeReq ? 'text-green-500' : 'text-red-500'} font-mono font-bold">
                ${formatPStake(userStake)} / ${formatPStake(pStakeReq)}
            </span>
        </div>
        <div class="w-full bg-zinc-800 h-1 mt-1 mb-3 rounded-full overflow-hidden">
            <div class="bg-amber-500 h-full" style="width: ${pStakeReq > 0n ? Math.min(Number(userStake * 100n / pStakeReq), 100) : 0}%"></div>
        </div>

        <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-400">Service Fee</span>
            <span class="${userBal >= feeReq ? 'text-green-500' : 'text-red-500'} font-mono font-bold">
                ${formatBigNumber(feeReq)} BKC
            </span>
        </div>
        <div class="flex justify-between items-center text-[10px] text-zinc-600 mt-1">
            <span>Your Balance: ${formatBigNumber(userBal)} BKC</span>
        </div>
    `;

    // Action Area Logic (The Guard)
    if (!check.allowed) {
        // RENDERIZA TELA DE BLOQUEIO
        if (check.reason === 'loading') {
            actionArea.innerHTML = `<div class="loader"></div><p class="mt-4 text-zinc-500 text-xs">Loading protocols...</p>`;
        } else if (check.reason === 'wallet') {
            actionArea.innerHTML = `
                <div class="text-center p-6">
                    <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                        <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Wallet Disconnected</h3>
                    <p class="text-zinc-400 mb-6 max-w-xs mx-auto text-sm">Please connect your wallet to access the Notary Service.</p>
                    <button id="connectButtonMobile" class="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg transition-colors">Connect Wallet</button>
                </div>
            `;
        } else {
            // Requisitos não atendidos (pStake ou Saldo)
            actionArea.innerHTML = `
                <div class="text-center p-6 max-w-md">
                    <div class="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                        <i class="fa-solid fa-lock text-3xl text-red-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Access Denied</h3>
                    <p class="text-zinc-400 mb-6 text-sm">
                        You do not meet the requirements to use this service. 
                        ${check.reason === 'pstake' ? 'Insufficient <b>pStake</b> level.' : 'Insufficient <b>BKC</b> balance for fees.'}
                    </p>
                    <a href="#" onclick="document.querySelector('[data-target=${check.reason === 'pstake' ? 'mine' : 'dex'}]').click()" 
                       class="inline-flex items-center gap-2 text-amber-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                        GET ${check.reason === 'pstake' ? 'PSTAKE' : 'BKC'} <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;
        }
    } else {
        // PERMITIDO: Se não tiver arquivo, mostra step 1, senão mantém o step atual
        if (!currentFileToUpload) {
            updateNotaryStep(1);
        } else {
            // Se já tem arquivo, re-renderiza o step atual para garantir que o DOM esteja lá
            // (Mas cuidado para não resetar input de texto se estiver no step 2)
            const contentExists = document.getElementById('step-content-active');
            if(!contentExists) updateNotaryStep(2);
        }
    }
}

function updateNotaryStep(step) {
    const actionArea = document.getElementById('notary-action-area');
    if (!actionArea) return;

    // Atualiza Barra de Progresso
    const line = document.getElementById('progress-line-fill');
    if (line) line.style.width = step === 1 ? '0%' : step === 2 ? '50%' : '100%';

    [1,2,3].forEach(i => {
        const dot = document.getElementById(`dot-${i}`);
        if(dot) {
            dot.className = `step-dot ${i < step ? 'completed' : (i === step ? 'active' : '')}`;
        }
    });

    if (step === 1) {
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn">
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-white mb-2">Upload Document</h3>
                    <p class="text-zinc-500 text-sm">Supported: PDF, JPG, PNG, DOC (Max 10MB)</p>
                </div>
                <div id="drop-area" class="border-2 border-dashed border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/50 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <input type="file" id="notary-file-input" class="hidden" accept="*">
                    <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-zinc-700 transition-all shadow-lg">
                        <i class="fa-solid fa-cloud-arrow-up text-2xl text-amber-500"></i>
                    </div>
                    <p class="text-zinc-300 font-medium mb-1">Click to Upload</p>
                    <p class="text-xs text-zinc-600">or drag and drop file here</p>
                </div>
            </div>
        `;
        initNotaryListeners();
    } 
    else if (step === 2) {
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn">
                <div class="text-center mb-6">
                    <h3 class="text-xl font-bold text-white">Document Details</h3>
                    <p class="text-zinc-500 text-xs">Add metadata to your blockchain record.</p>
                </div>
                
                <div class="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 mb-4 flex items-center gap-4">
                    <div class="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 text-xl border border-amber-500/20">
                        <i class="fa-regular fa-file"></i>
                    </div>
                    <div class="overflow-hidden flex-1">
                        <p class="text-white font-bold text-sm truncate">${currentFileToUpload?.name}</p>
                        <p class="text-[10px] text-zinc-500 font-mono">${(currentFileToUpload?.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                    </div>
                    <button class="text-zinc-500 hover:text-red-500 p-2 transition-colors" onclick="NotaryPage.reset()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>

                <div class="mb-6">
                    <label class="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Description / Public Note (Optional)</label>
                    <textarea id="notary-user-description" rows="3" 
                        class="w-full bg-black/40 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors placeholder-zinc-700" 
                        placeholder="E.g. Property Deed #12345 registered on..."></textarea>
                </div>

                <button id="notarize-submit-btn" onclick="updateNotaryStep(3)" 
                    class="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-white/10 flex items-center justify-center gap-2">
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
    } 
    else if (step === 3) {
        const fee = State.notaryFee || 0n;
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn">
                <div class="text-center mb-6">
                    <h3 class="text-xl font-bold text-white">Final Review</h3>
                    <p class="text-zinc-500 text-xs">Confirm details before signing.</p>
                </div>

                <div class="bg-zinc-900/50 rounded-xl border border-zinc-700 p-5 space-y-3 mb-6 font-mono text-sm">
                    <div class="flex justify-between border-b border-zinc-800 pb-2">
                        <span class="text-zinc-500">File</span>
                        <span class="text-white truncate max-w-[150px]">${currentFileToUpload?.name}</span>
                    </div>
                    <div class="flex justify-between border-b border-zinc-800 pb-2">
                        <span class="text-zinc-500">Service Fee</span>
                        <span class="text-amber-500 font-bold">${formatBigNumber(fee)} BKC</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-zinc-500">Network</span>
                        <span class="text-zinc-400 flex items-center gap-1"><i class="fa-solid fa-circle text-[6px] text-green-500"></i> Arbitrum</span>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button onclick="updateNotaryStep(2)" class="w-1/3 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-bold py-3 rounded-xl transition-all">
                        Back
                    </button>
                    <button id="btn-confirm-sign" onclick="handleSignAndUpload(this)" class="w-2/3 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                        <i class="fa-solid fa-fingerprint mr-2"></i> Sign & Mint
                    </button>
                </div>
            </div>
        `;
    }
    // Necessário expor a função globalmente para o onclick funcionar dentro do innerHTML modular
    window.updateNotaryStep = updateNotaryStep;
    window.handleSignAndUpload = handleSignAndUpload;
}

// =========================================================================
// TRANSAÇÃO & UPLOAD (LÓGICA MANTIDA E MELHORADA)
// =========================================================================

async function handleSignAndUpload(btn) {
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = `<div class="loader-sm inline-block mr-2"></div> Waiting Signature...`;
    }

    let progressTimer, textTimer;

    try {
        const rawDesc = document.getElementById('notary-user-description')?.value;
        const desc = rawDesc && rawDesc.trim() !== "" ? rawDesc : "No description provided.";
        
        // 1. Assinatura Off-chain
        const signer = await State.provider.getSigner();
        const message = `I authorize the notarization of file: ${currentFileToUpload.name}\nTimestamp: ${Date.now()}`;
        const signature = await signer.signMessage(message);
        
        // 2. Animação de Overlay
        const overlay = document.getElementById('mining-overlay');
        const progressBar = document.getElementById('mining-progress-bar');
        const statusText = document.getElementById('mining-status-text');
        
        if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('flex'); }

        // Simulador de progresso (3 min max)
        let progress = 0;
        progressTimer = setInterval(() => {
            progress += 0.5;
            if (progress >= 95) progress = 95;
            if (progressBar) progressBar.style.width = `${progress}%`;
        }, 500);

        textTimer = setInterval(() => {
            const texts = ["ENCRYPTING DATA...", "UPLOADING TO DECENTRALIZED STORAGE...", "VERIFYING HASH...", "INTERACTING WITH SMART CONTRACT...", "WAITING BLOCK CONFIRMATION..."];
            const current = statusText ? statusText.innerText : "";
            const next = texts[(texts.indexOf(current) + 1) % texts.length];
            if (statusText) statusText.innerText = next;
        }, 4000);

        // 3. Upload IPFS (Com timeout)
        const formData = new FormData();
        formData.append('file', currentFileToUpload);
        formData.append('signature', signature);
        formData.append('address', State.userAddress);
        formData.append('description', desc);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min

        const res = await fetch(API_ENDPOINTS.uploadFileToIPFS, { method: 'POST', body: formData, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Upload Failed");
        const data = await res.json();
        currentUploadedIPFS_URI = data.ipfsUri;

        // 4. Transação Blockchain
        if(statusText) statusText.innerText = "CONFIRMING ON WALLET...";
        await executeNotarizeDocument(currentUploadedIPFS_URI, 0n, btn);
        
        // 5. Sucesso
        clearInterval(progressTimer); clearInterval(textTimer);
        if (progressBar) progressBar.style.width = `100%`;
        if (statusText) {
            statusText.classList.remove('text-amber-500');
            statusText.classList.add('text-green-500');
            statusText.innerText = "SUCCESSFULLY NOTARIZED!";
        }
        
        setTimeout(() => {
            if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
            NotaryPage.reset(); 
            fetchUserHistory(); 
            loadUserData(true);
        }, 2000);

    } catch (e) {
        clearInterval(progressTimer); clearInterval(textTimer);
        console.error(e);
        const overlay = document.getElementById('mining-overlay');
        if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
        
        showToast(e.message.includes('rejected') ? "Signature rejected." : "Error: " + e.message, "error");
        
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = `Try Again`;
        }
    }
}

// =========================================================================
// HISTÓRICO (DATA FETCHING)
// =========================================================================

async function fetchUserHistory() {
    const container = document.getElementById('history-container');
    if (!container || !State.isConnected) return;
    
    try {
        // Usa o contrato do Notary ou EcosystemManager para buscar logs
        // Supondo evento: DocumentNotarized(address indexed user, string ipfsHash, uint256 timestamp)
        
        // *Em produção, ideal usar The Graph ou Indexer. Aqui faremos queryFilter simples.*
        // Mock se não tiver contrato instanciado ainda, tenta carregar
        if (!State.ecosystemManagerContract) await loadPublicData();
        const contract = State.ecosystemManagerContract;

        if (!contract) {
            container.innerHTML = renderNoData("Contract not available.");
            return;
        }

        // Tenta buscar eventos dos ultimos blocos (limitado para não quebrar RPC)
        // Nota: Isso depende da implementação exata do contrato. 
        // Se o contrato não tiver evento exposto, não funcionará. 
        // Vamos assumir que existe uma função getViewUserDocuments ou eventos.
        
        // OPÇÃO A: Ler de array (mais comum em contratos simples)
        // const docs = await contract.getUserDocuments(State.userAddress);
        
        // OPÇÃO B: Ler eventos (mais robusto para histórico)
        const filter = contract.filters.DocumentNotarized ? contract.filters.DocumentNotarized(State.userAddress) : null;
        
        let docs = [];
        if (filter) {
            const events = await contract.queryFilter(filter, -10000); // Ultimos 10k blocos (exemplo)
            docs = events.map(e => ({
                hash: e.args[1], // ipfsHash
                timestamp: Number(e.args[2] || 0), // timestamp (se existir)
                txHash: e.transactionHash
            })).reverse();
        } else {
             // Fallback para teste/mock se o evento não existir na ABI atual
             console.warn("Event DocumentNotarized not found in ABI. History may be empty.");
        }

        if (docs.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-10 opacity-50">
                    <i class="fa-solid fa-folder-open text-4xl mb-3 text-zinc-700"></i>
                    <p class="text-sm">No notarized documents found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = docs.map(doc => {
            const date = new Date(doc.timestamp * 1000).toLocaleDateString();
            const isImage = doc.hash.match(/\.(jpg|jpeg|png|gif)$/i) || !doc.hash.includes('.'); // Simples heurística
            
            // IPFS Gateway (usando um público robusto)
            const ipfsLink = `https://ipfs.io/ipfs/${doc.hash.replace('ipfs://', '')}`;

            return `
                <div class="notary-glass rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors group">
                    <div class="h-32 bg-zinc-900/50 relative flex items-center justify-center overflow-hidden">
                        ${isImage ? 
                            `<img src="${ipfsLink}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" onerror="this.src='assets/file_icon.png'">` : 
                            `<i class="fa-solid fa-file-contract text-4xl text-zinc-700 group-hover:text-amber-500 transition-colors"></i>`
                        }
                        <div class="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">
                            ${date}
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono text-zinc-500 truncate max-w-[120px]">${doc.hash.substring(0, 10)}...</span>
                            <a href="https://arbiscan.io/tx/${doc.txHash}" target="_blank" class="text-zinc-600 hover:text-white"><i class="fa-solid fa-external-link-alt"></i></a>
                        </div>
                        <a href="${ipfsLink}" target="_blank" class="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-xs text-white py-2 rounded-lg transition-colors">
                            View on IPFS
                        </a>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("History Error:", e);
        container.innerHTML = renderNoData("Failed to load history.");
    }
}

// =========================================================================
// PUBLIC API
// =========================================================================

async function loadNotaryPublicData() {
    const now = Date.now();
    // Cache de 30s
    if (now - lastNotaryDataFetch < 30000 && State.notaryFee > 0n) return;

    try {
        const hubContract = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        if (!hubContract) await loadPublicData();

        const key = ethers.id("NOTARY_SERVICE");
        const [fee, stake] = await safeContractCall(
            hubContract || State.ecosystemManagerContractPublic, 
            'getServiceRequirements', 
            [key], 
            [0n, 0n]
        );
        
        if (fee > 0n || stake > 0n) { 
            State.notaryFee = fee; 
            State.notaryMinPStake = stake; 
            lastNotaryDataFetch = now;
        }
    } catch(e) {
        console.error("Failed to fetch notary reqs", e);
    }
}

export const NotaryPage = {
    render: async (isActive) => {
        if (!isActive) return;
        renderNotaryPageLayout(); // Renderiza esqueleto
        await loadNotaryPublicData(); // Busca dados
        if (State.isConnected) {
            await loadUserData(); // Garante saldo/stake atualizados
        }
        updateNotaryInterface(); // Atualiza UI com dados reais (ou bloqueia)
    },
    reset: () => {
        currentFileToUpload = null;
        currentUploadedIPFS_URI = null;
        updateNotaryStep(1);
    },
    refreshHistory: () => {
        fetchUserHistory();
    },
    update: () => {
        updateNotaryInterface();
    }
};