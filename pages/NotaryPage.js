// pages/NotaryPage.js
// ✅ VERSÃO FINAL V7.1: "Single Click Fix" + Legal Copy + UX Premium

import { addresses } from '../config.js'; 
import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderNoData } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

const ethers = window.ethers;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// --- ESTADO LOCAL ---
let currentFileToUpload = null;
let currentUploadedIPFS_URI = null; 
let notaryButtonState = 'initial'; 
let rpcErrorCount = 0; 

// --- CSS FX ---
const style = document.createElement('style');
style.innerHTML = `
    .drop-zone {
        border: 2px dashed rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.02);
    }
    .drop-zone:hover, .drop-zone.dragover {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.08);
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .glass-card {
        background: rgba(15, 15, 20, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    .step-active { color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .step-completed { color: #10b981; border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
    
    @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .btn-pulse { animation: pulse-border 2s infinite; }
`;
document.head.appendChild(style);

// =========================================================================
// FUNÇÕES AUXILIARES (DEFINIDAS ANTES DO USO)
// =========================================================================

function handleFiles(e) {
    // Suporte tanto para Drag&Drop (dataTransfer) quanto Input (target)
    const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
    
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast("File exceeds 50MB limit.", "error");
        return;
    }

    currentFileToUpload = file;
    updateNotaryStep(2);
}

function initNotaryListeners() {
    const dropArea = document.getElementById('drop-area');
    const input = document.getElementById('notary-file-input');
    
    if (!dropArea || !input) return;

    // 1. CORREÇÃO DO CLIQUE ÚNICO
    // Ao clicar na DIV, acionamos o input programaticamente
    dropArea.addEventListener('click', () => {
        input.click();
    });

    // 2. Drag & Drop Visuals
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });
    
    // 3. File Capture
    dropArea.addEventListener('drop', handleFiles); // Soltar arquivo
    input.addEventListener('change', handleFiles);  // Selecionar via janela
}

// =========================================================================
// RENDERIZAÇÃO
// =========================================================================

function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;

    if (container.querySelector('#notary-main-box')) return; 

    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeIn">
            <div>
                <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Decentralized Notary</h1>
                <p class="text-zinc-400 mt-2 max-w-xl text-sm leading-relaxed">
                    Immutable proof of existence. Certify documents on the blockchain with legal-grade timestamps.
                </p>
            </div>
            <div class="px-4 py-2 rounded-full bg-zinc-900 border border-green-500/30 text-xs font-mono text-green-400 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> SYSTEM ONLINE
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn animation-delay-200">
            <div class="lg:col-span-8 space-y-6">
                <div class="glass-card rounded-2xl p-6">
                    <div class="flex justify-between items-center relative px-4">
                        <div class="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10"></div>
                        <div id="progress-line" class="absolute top-1/2 left-0 h-0.5 bg-blue-600 -z-10 transition-all duration-500 w-0"></div>
                        
                        <div id="step-1" class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all bg-zinc-900 relative z-10 text-zinc-500 border-zinc-700">1</div>
                        <div id="step-2" class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all bg-zinc-900 relative z-10 text-zinc-500 border-zinc-700">2</div>
                        <div id="step-3" class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all bg-zinc-900 relative z-10 text-zinc-500 border-zinc-700">3</div>
                    </div>
                    <div class="flex justify-between mt-2 text-[10px] uppercase font-bold text-zinc-500 px-1">
                        <span>Upload</span><span>Details</span><span>Certify</span>
                    </div>
                </div>

                <div id="notary-main-box" class="glass-card rounded-2xl p-8 min-h-[400px] flex flex-col justify-between">
                    <div id="notary-step-content" class="flex-1"></div>
                    <div class="mt-8 pt-6 border-t border-white/5">
                        <button id="notarize-submit-btn" class="w-full bg-zinc-800 text-zinc-500 font-bold py-4 rounded-xl cursor-not-allowed transition-all flex items-center justify-center gap-3" disabled>
                            SELECT A FILE TO START
                        </button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-4 space-y-6">
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-shield-halved"></i> Requirements
                    </h3>
                    <div id="notary-user-status" class="space-y-3">
                         <div class="flex items-center justify-center py-4"><div class="loader-sm"></div></div>
                    </div>
                </div>
                <div class="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20">
                    <h4 class="text-blue-400 font-bold text-sm mb-2"><i class="fa-solid fa-circle-info mr-2"></i> How it works</h4>
                    <p class="text-xs text-zinc-400 leading-relaxed">
                        1. Your file is hashed (SHA-256) locally.<br>
                        2. The hash is stored on IPFS (Decentralized Storage).<br>
                        3. A unique NFT is minted on Backchain linking your wallet to the document hash.<br>
                        4. <strong>100% Privacy:</strong> Only the hash is on-chain.
                    </p>
                </div>
            </div>
        </div>

        <div class="mt-16 animate-fadeIn animation-delay-500">
            <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <i class="fa-solid fa-folder-open text-blue-500"></i> My Certificates
            </h2>
            <div id="my-notarized-documents" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${renderLoading("Syncing blockchain history...")}
            </div>
        </div>
    `;

    updateNotaryStep(1); 
}

// =========================================================================
// LÓGICA DE UI
// =========================================================================

function updateNotaryStep(step) {
    const content = document.getElementById('notary-step-content');
    if (!content) return;

    // Progress Bar
    const line = document.getElementById('progress-line');
    if (line) line.style.width = step === 1 ? '0%' : step === 2 ? '50%' : '100%';

    // Bubbles Styling
    [1,2,3].forEach(i => {
        const el = document.getElementById(`step-${i}`);
        if(el) {
            if (i < step) {
                el.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all relative z-10 step-completed`;
                el.innerHTML = '<i class="fa-solid fa-check"></i>';
            } else if (i === step) {
                el.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all relative z-10 step-active shadow-lg shadow-blue-500/20`;
                el.innerHTML = i;
            } else {
                el.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all relative z-10 bg-zinc-900 border-zinc-700 text-zinc-600`;
                el.innerHTML = i;
            }
        }
    });

    // Content Switching
    if (step === 1) {
        content.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-white mb-2">Upload Document</h3>
                <p class="text-zinc-400 text-sm">Supported: PDF, JPG, PNG, DOC (Max 50MB)</p>
            </div>
            
            <div id="drop-area" class="drop-zone h-64 flex flex-col items-center justify-center cursor-pointer relative group">
                <input type="file" id="notary-file-input" class="hidden" accept=".pdf,.doc,.docx,.jpg,.png,.txt,.zip">
                
                <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-zinc-700 transition-all shadow-xl">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-blue-500"></i>
                </div>
                <p class="text-white font-medium mb-1 text-lg">Click to Upload</p>
                <p class="text-xs text-zinc-500">or drag and drop file here</p>
            </div>
        `;
        initNotaryListeners(); // Attach events

    } else if (step === 2) {
        content.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-white mb-2">Document Details</h3>
                <p class="text-zinc-400 text-sm">Add metadata to your blockchain record.</p>
            </div>
            <div class="space-y-4">
                <div class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 text-xl"><i class="fa-solid fa-file-contract"></i></div>
                    <div class="overflow-hidden flex-1">
                        <p class="text-white font-bold truncate">${currentFileToUpload?.name}</p>
                        <p class="text-xs text-zinc-500">${(currentFileToUpload?.size / 1024 / 1024).toFixed(2)} MB • Ready to Hash</p>
                    </div>
                    <button class="text-zinc-500 hover:text-red-400 p-2 transition-colors" onclick="NotaryPage.reset()"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Legal Note / Description (Optional)</label>
                    <textarea id="notary-user-description" rows="4" class="w-full bg-black/30 border border-zinc-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors" placeholder="E.g. Property Deed #12345 registered on..."></textarea>
                </div>
            </div>
        `;
        const btn = document.getElementById('notarize-submit-btn');
        btn.disabled = false;
        btn.className = "w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg btn-pulse";
        btn.innerHTML = `Proceed to Review <i class="fa-solid fa-arrow-right ml-2"></i>`;
        btn.onclick = () => updateNotaryStep(3);

    } else if (step === 3) {
        content.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-white mb-2">Final Review</h3>
                <p class="text-zinc-400 text-sm">Confirm transaction details before signing.</p>
            </div>
            <div class="bg-zinc-900/50 rounded-xl border border-zinc-700 p-6 space-y-4">
                <div class="flex justify-between border-b border-zinc-800 pb-3">
                    <span class="text-zinc-400 text-sm">File Name</span>
                    <span class="text-white font-medium text-right truncate max-w-[200px] text-sm">${currentFileToUpload?.name}</span>
                </div>
                <div class="flex justify-between border-b border-zinc-800 pb-3">
                    <span class="text-zinc-400 text-sm">Service Fee</span>
                    <span class="text-green-400 font-mono font-bold">${State.notaryFee ? formatBigNumber(State.notaryFee) + ' BKC' : 'Loading...'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-400 text-sm">Network</span>
                    <span class="text-white flex items-center gap-2 text-sm"><div class="w-2 h-2 rounded-full bg-green-500"></div> Sepolia</span>
                </div>
            </div>
        `;
        const btn = document.getElementById('notarize-submit-btn');
        btn.disabled = false;
        btn.className = "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl";
        btn.innerHTML = `<i class="fa-solid fa-signature mr-2"></i> Sign & Certify`;
        btn.onclick = handleSignAndUpload;
    }
    updateNotaryUserStatus();
}

// =========================================================================
// DATA & TRANSACTIONS
// =========================================================================

function updateNotaryUserStatus() {
    const statusEl = document.getElementById('notary-user-status');
    if(!statusEl) return;

    if(!State.isConnected) {
        statusEl.innerHTML = `<div class="text-center text-zinc-500 py-4 bg-zinc-900/30 rounded-xl border border-zinc-800"><i class="fa-solid fa-wallet mb-2 text-xl"></i><br>Connect Wallet to View</div>`;
        return;
    }

    const userPStake = State.userTotalPStake || 0n;
    const reqPStake = State.notaryMinPStake || 0n;
    const fee = State.notaryFee || 0n;
    
    const isReady = reqPStake > 0n && fee > 0n;
    const hasPStake = userPStake >= reqPStake;
    const hasBal = (State.currentUserBalance || 0n) >= fee;

    statusEl.innerHTML = `
        <div class="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border ${hasPStake ? 'border-green-500/30' : 'border-red-500/30'}">
            <div>
                <div class="text-[10px] text-zinc-500 uppercase font-bold">Min. pStake</div>
                <div class="text-white font-mono text-sm">${isReady ? formatPStake(reqPStake) : '...'}</div>
            </div>
            ${hasPStake ? '<i class="fa-solid fa-check text-green-500"></i>' : '<i class="fa-solid fa-xmark text-red-500"></i>'}
        </div>
        
        <div class="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border ${hasBal ? 'border-green-500/30' : 'border-red-500/30'}">
            <div>
                <div class="text-[10px] text-zinc-500 uppercase font-bold">Service Cost</div>
                <div class="text-white font-mono text-sm">${isReady ? formatBigNumber(fee) + ' BKC' : '...'}</div>
            </div>
            ${hasBal ? '<i class="fa-solid fa-check text-green-500"></i>' : '<i class="fa-solid fa-xmark text-red-500"></i>'}
        </div>
    `;
}

async function loadNotaryPublicData() {
    const now = Date.now();
    if (rpcErrorCount > 5 && now - lastNotaryDataFetch < 30000) return;
    if (now - lastNotaryDataFetch < 60000 && State.notaryFee > 0n) { updateNotaryUserStatus(); return; }

    try {
        const hubContract = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        if (!hubContract) { await loadPublicData(); if(!State.ecosystemManagerContractPublic) return; }
        
        const key = ethers.id("NOTARY_SERVICE");
        const [fee, stake] = await safeContractCall(hubContract || State.ecosystemManagerContractPublic, 'getServiceRequirements', [key], [0n, 0n], 2, true);
        
        if (fee > 0n) {
            State.notaryFee = fee;
            State.notaryMinPStake = stake;
            rpcErrorCount = 0;
        }
    } catch(e) { rpcErrorCount++; }
    updateNotaryUserStatus();
}

// 🔴 COPY JURÍDICA PROFISSIONAL AQUI
async function handleSignAndUpload(event) {
    const btn = event.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `<div class="loader-sm inline-block mr-2"></div> Processing...`;

    try {
        const rawDesc = document.getElementById('notary-user-description')?.value;
        const desc = rawDesc && rawDesc.trim() !== "" ? rawDesc : "No description provided.";
        
        const signer = await State.provider.getSigner();
        const timestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
        
        // --- LEGAL TEXT BLOCK ---
        const message = `BACKCHAIN DECENTRALIZED NOTARY
--------------------------------
ACTION: Immutable Blockchain Registration
PROTOCOL: Proof-of-Existence

I hereby authorize the permanent hashing and timestamping of the following document on the Backchain network.

[DOCUMENT DETAILS]
• File Name: ${currentFileToUpload.name}
• User Note: ${desc}
• Date: ${timestamp}

By signing this message, I certify ownership and integrity of this data.
--------------------------------`;
        
        // 1. Signature
        const signature = await signer.signMessage(message);
        
        btn.innerHTML = `<div class="loader-sm inline-block mr-2"></div> Uploading to IPFS...`;

        // 2. Upload
        const formData = new FormData();
        formData.append('file', currentFileToUpload);
        formData.append('signature', signature);
        formData.append('address', State.userAddress);
        formData.append('description', desc);

        const res = await fetch(API_ENDPOINTS.uploadFileToIPFS, { method: 'POST', body: formData });
        if (!res.ok) throw new Error("Upload Failed");
        
        const data = await res.json();
        currentUploadedIPFS_URI = data.ipfsUri;

        // 3. Mint
        btn.innerHTML = `<div class="loader-sm inline-block mr-2"></div> Waiting for Wallet...`;
        await executeNotarizeDocument(currentUploadedIPFS_URI, 0n, btn);
        
        NotaryPage.reset();
        await loadUserData(true);
        renderMyNotarizedDocuments();

    } catch (e) {
        console.error(e);
        if (e.code === 'ACTION_REJECTED' || e.code === 4001) {
            showToast("Signature rejected.", "info");
        } else {
            showToast("Process Failed: " + e.message, "error");
        }
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-rotate-right mr-2"></i> Try Again`;
    }
}

function renderMyNotarizedDocuments() {
    const container = document.getElementById('my-notarized-documents');
    if (container) {
        container.innerHTML = renderNoData("No certificates found.");
    }
}

// =========================================================================
// EXPORTS
// =========================================================================

export const NotaryPage = {
    render: async (isActive) => {
        if (!isActive) return;
        renderNotaryPageLayout();
        await loadNotaryPublicData();
        if (State.isConnected) { await loadUserData(true); renderMyNotarizedDocuments(); }
        updateNotaryUserStatus();
    },
    reset: () => {
        currentFileToUpload = null;
        currentUploadedIPFS_URI = null;
        updateNotaryStep(1);
    },
    update: () => {
        loadNotaryPublicData();
        updateNotaryUserStatus();
    }
};