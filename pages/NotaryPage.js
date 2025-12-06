// pages/NotaryPage.js
// ✅ VERSÃO FINAL TESTNET (V12.1): Fix Explorer Link (Sepolia) & Preserved Animation

import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderNoData } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

const ethers = window.ethers;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// --- ESTADO LOCAL ---
let currentFileToUpload = null;
let notaryButtonState = 'initial'; 
let lastNotaryDataFetch = 0; 

// --- CSS CUSTOMIZADO ---
const style = document.createElement('style');
style.innerHTML = `
    .notary-glass { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
    .drop-zone-active { border: 2px dashed #f59e0b; background: rgba(245, 158, 11, 0.05); transform: scale(1.01); }
    .step-dot { width: 12px; height: 12px; border-radius: 50%; background: #27272a; border: 2px solid #52525b; transition: all 0.3s ease; z-index: 10; }
    .step-dot.active { background: #f59e0b; border-color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
    .step-dot.completed { background: #10b981; border-color: #10b981; }
    
    /* Overlay Animation (Scanner) */
    .mining-overlay { background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px); }
    .scan-line { position: absolute; width: 100%; height: 2px; background: #f59e0b; animation: scan 2s ease-in-out infinite; box-shadow: 0 0 15px #f59e0b; }
    @keyframes scan { 0% {top: 0%; opacity: 0;} 50% {opacity: 1;} 100% {top: 100%; opacity: 0;} }
`;
document.head.appendChild(style);

// =========================================================================
// LÓGICA DE REQUISITOS
// =========================================================================

function checkNotaryRequirements() {
    if (!State.isConnected) return { allowed: false, reason: 'wallet' };
    const userPStake = State.userTotalPStake || 0n;
    const reqPStake = State.notaryMinPStake || 0n;
    const userBal = State.currentUserBalance || 0n;
    const reqFee = State.notaryFee || 0n;
    if (reqPStake === 0n && reqFee === 0n) return { allowed: false, reason: 'loading' };
    const hasPStake = userPStake >= reqPStake;
    const hasBalance = userBal >= reqFee;
    if (!hasPStake) return { allowed: false, reason: 'pstake', current: userPStake, required: reqPStake };
    if (!hasBalance) return { allowed: false, reason: 'balance', current: userBal, required: reqFee };
    return { allowed: true };
}

// =========================================================================
// HANDLERS
// =========================================================================

function handleFiles(e) {
    const status = checkNotaryRequirements();
    if (!status.allowed) return; 
    const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) { showToast(`File too large. Max: 10MB.`, "error"); return; }
    currentFileToUpload = file;
    updateNotaryStep(2); 
}

function initNotaryListeners() {
    const dropArea = document.getElementById('drop-area');
    const input = document.getElementById('notary-file-input');
    if (!dropArea || !input || dropArea.classList.contains('cursor-not-allowed')) return;
    dropArea.addEventListener('click', () => input.click());
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => { dropArea.addEventListener(eventName, () => dropArea.classList.add('drop-zone-active'), false); });
    ['dragleave', 'drop'].forEach(eventName => { dropArea.addEventListener(eventName, () => dropArea.classList.remove('drop-zone-active'), false); });
    dropArea.addEventListener('drop', handleFiles);
    input.addEventListener('change', handleFiles);
}

// =========================================================================
// UI & STEPS
// =========================================================================

function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;
    if (container.querySelector('#notary-layout-base')) { updateNotaryInterface(); return; }

    container.innerHTML = `
        <div id="notary-layout-base" class="animate-fadeIn pb-12">
            
            <div id="mining-overlay" class="mining-overlay fixed inset-0 z-[100] hidden flex-col items-center justify-center">
                <div class="relative w-64 h-64 mb-8">
                    <div class="scan-line z-20"></div>
                    <img src="assets/bkc_logo_3d.png" class="w-full h-full object-contain opacity-80 animate-pulse" alt="Processing">
                </div>
                <h3 class="text-3xl font-black text-white mb-2 tracking-widest uppercase text-center">Notarizing Asset</h3>
                <p id="mining-status-text" class="text-amber-500 font-mono text-xs mb-6 uppercase tracking-wider">UPLOADING FILE...</p>
                <div class="w-80 h-1 bg-zinc-800 rounded-full overflow-hidden"><div id="mining-progress-bar" class="h-full bg-amber-500 w-0 transition-all duration-300"></div></div>
                <p class="mt-4 text-zinc-500 text-[10px] font-mono">DO NOT CLOSE THIS WINDOW</p>
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3"><i class="fa-solid fa-stamp text-amber-500"></i> Decentralized Notary</h1>
                    <p class="text-zinc-400 mt-2 text-sm max-w-2xl">Enterprise-grade document certification. Link, description, and cryptographic hash are permanently stored on-chain.</p>
                </div>
                <div id="service-status-badge" class="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-500 flex items-center gap-2">CHECKING...</div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-6">
                    <div class="notary-glass rounded-xl p-6 relative overflow-hidden">
                         <div class="absolute top-1/2 left-6 right-6 h-0.5 bg-zinc-800 -z-0"></div>
                         <div id="progress-line-fill" class="absolute top-1/2 left-6 h-0.5 bg-amber-500 -z-0 transition-all duration-500 w-0"></div>
                         <div class="flex justify-between relative z-10 px-4">
                            <div class="flex flex-col items-center gap-2"><div id="dot-1" class="step-dot active"></div><span class="text-[10px] uppercase font-bold text-zinc-400">File</span></div>
                            <div class="flex flex-col items-center gap-2"><div id="dot-2" class="step-dot"></div><span class="text-[10px] uppercase font-bold text-zinc-400">Details</span></div>
                            <div class="flex flex-col items-center gap-2"><div id="dot-3" class="step-dot"></div><span class="text-[10px] uppercase font-bold text-zinc-400">Mint</span></div>
                         </div>
                    </div>
                    <div id="notary-action-area" class="notary-glass rounded-xl p-8 min-h-[420px] flex flex-col justify-center items-center relative transition-all"><div class="loader"></div></div>
                </div>
                <div class="lg:col-span-1 space-y-6">
                    <div class="notary-glass rounded-xl p-6 border-l-2 border-amber-500">
                        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-zinc-700 pb-2">Requirements</h3>
                        <div id="requirements-list" class="space-y-4"></div>
                    </div>
                </div>
            </div>

            <div class="mt-16 border-t border-zinc-800 pt-10">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> On-Chain Registry</h2>
                    <button onclick="NotaryPage.refreshHistory()" class="text-xs text-amber-500 hover:text-white transition-colors"><i class="fa-solid fa-rotate"></i> Refresh</button>
                </div>
                <div id="history-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">${renderLoading("Reading blockchain structs...")}</div>
            </div>
        </div>
    `;
    updateNotaryInterface();
    fetchUserHistory();
}

function updateNotaryInterface() {
    const badge = document.getElementById('service-status-badge');
    const reqList = document.getElementById('requirements-list');
    const actionArea = document.getElementById('notary-action-area');
    if (!badge || !reqList || !actionArea) return;

    const check = checkNotaryRequirements();
    const isOnline = State.isConnected;

    badge.innerHTML = isOnline ? 
        `<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> SYSTEM ONLINE` : 
        `<div class="w-2 h-2 rounded-full bg-red-500"></div> WALLET DISCONNECTED`;
    
    const pStakeReq = State.notaryMinPStake || 0n;
    const feeReq = State.notaryFee || 0n;
    const userStake = State.userTotalPStake || 0n;
    const userBal = State.currentUserBalance || 0n;

    reqList.innerHTML = `
        <div class="flex justify-between items-center text-sm"><span class="text-zinc-400">Min. pStake</span><span class="${userStake >= pStakeReq ? 'text-green-500' : 'text-red-500'} font-mono font-bold">${formatPStake(userStake)} / ${formatPStake(pStakeReq)}</span></div>
        <div class="w-full bg-zinc-800 h-1 mt-1 mb-3 rounded-full overflow-hidden"><div class="bg-amber-500 h-full" style="width: ${pStakeReq > 0n ? Math.min(Number(userStake * 100n / pStakeReq), 100) : 0}%"></div></div>
        <div class="flex justify-between items-center text-sm"><span class="text-zinc-400">Fee</span><span class="${userBal >= feeReq ? 'text-green-500' : 'text-red-500'} font-mono font-bold">${formatBigNumber(feeReq)} BKC</span></div>
    `;

    if (!check.allowed) {
        if (check.reason === 'loading') {
            actionArea.innerHTML = `<div class="loader"></div>`;
        } else if (check.reason === 'wallet') {
            actionArea.innerHTML = `<div class="text-center"><i class="fa-solid fa-wallet text-3xl text-zinc-500 mb-4"></i><h3 class="text-white font-bold">Wallet Disconnected</h3><button id="connectButtonMobile" class="mt-4 bg-amber-500 text-black font-bold py-2 px-6 rounded-lg">Connect</button></div>`;
        } else {
            actionArea.innerHTML = `<div class="text-center"><i class="fa-solid fa-lock text-3xl text-red-500 mb-4"></i><h3 class="text-white font-bold">Access Denied</h3><p class="text-zinc-400 text-sm mt-2">Insufficient Balance or pStake.</p></div>`;
        }
    } else {
        if (!currentFileToUpload) updateNotaryStep(1);
        else if (!document.getElementById('step-content-active')) updateNotaryStep(2);
    }
}

function updateNotaryStep(step) {
    const actionArea = document.getElementById('notary-action-area');
    if (!actionArea) return;
    const line = document.getElementById('progress-line-fill');
    if (line) line.style.width = step === 1 ? '0%' : step === 2 ? '50%' : '100%';
    [1,2,3].forEach(i => { const dot = document.getElementById(`dot-${i}`); if(dot) dot.className = `step-dot ${i < step ? 'completed' : (i === step ? 'active' : '')}`; });

    if (step === 1) {
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn text-center">
                <h3 class="text-2xl font-bold text-white mb-2">Select File</h3>
                <div id="drop-area" class="border-2 border-dashed border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/50 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <input type="file" id="notary-file-input" class="hidden" accept="*">
                    <i class="fa-solid fa-cloud-arrow-up text-4xl text-amber-500 mb-4 group-hover:scale-110 transition-transform"></i>
                    <p class="text-zinc-300 font-medium">Click or Drag File</p>
                </div>
            </div>`;
        initNotaryListeners();
    } else if (step === 2) {
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn">
                <h3 class="text-xl font-bold text-white mb-4 text-center">Add Details</h3>
                <div class="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 mb-4 flex items-center gap-4">
                    <i class="fa-regular fa-file text-amber-500 text-xl"></i>
                    <div class="overflow-hidden flex-1"><p class="text-white font-bold text-sm truncate">${currentFileToUpload?.name}</p></div>
                    <button class="text-zinc-500 hover:text-red-500" onclick="NotaryPage.reset()"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="mb-6">
                    <label class="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Description / Public Note</label>
                    <textarea id="notary-user-description" rows="3" class="w-full bg-black/40 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-zinc-700" placeholder="E.g. Property Deed #123 registered..."></textarea>
                </div>
                <button onclick="updateNotaryStep(3)" class="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl">Next <i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>`;
    } else if (step === 3) {
        actionArea.innerHTML = `
            <div id="step-content-active" class="w-full max-w-lg animate-fadeIn text-center">
                <h3 class="text-xl font-bold text-white mb-4">Confirm & Mint</h3>
                <p class="text-zinc-500 text-sm mb-6">File link, description, and cryptographic hash will be permanently stored on the Blockchain.</p>
                <div class="flex gap-3">
                    <button onclick="updateNotaryStep(2)" class="w-1/3 border border-zinc-700 text-zinc-400 font-bold py-3 rounded-xl">Back</button>
                    <button id="btn-confirm-sign" onclick="handleSignAndUpload(this)" class="w-2/3 bg-amber-500 text-black font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20">Sign & Mint</button>
                </div>
            </div>`;
    }
    window.updateNotaryStep = updateNotaryStep;
    window.handleSignAndUpload = handleSignAndUpload;
}

// =========================================================================
// ACTION: UPLOAD & MINT
// =========================================================================

async function handleSignAndUpload(btn) {
    if(btn) { btn.disabled = true; btn.innerHTML = `<div class="loader-sm inline-block mr-2"></div> Signing...`; }

    let progressTimer;
    try {
        const rawDesc = document.getElementById('notary-user-description')?.value;
        const desc = rawDesc && rawDesc.trim() !== "" ? rawDesc : "No description provided.";

        const signer = await State.provider.getSigner();
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        const signature = await signer.signMessage(message);
        
        // --- ATIVA ANIMAÇÃO DO SCANNER ---
        const overlay = document.getElementById('mining-overlay');
        const progressBar = document.getElementById('mining-progress-bar');
        const statusText = document.getElementById('mining-status-text');
        if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('flex'); }

        let progress = 0;
        progressTimer = setInterval(() => { progress = Math.min(progress + 0.5, 95); if (progressBar) progressBar.style.width = `${progress}%`; }, 500);

        const formData = new FormData();
        formData.append('file', currentFileToUpload);
        formData.append('signature', signature);
        formData.append('address', State.userAddress);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); 

        if(statusText) statusText.innerText = "UPLOADING & HASHING...";
        const res = await fetch(API_ENDPOINTS.uploadFileToIPFS, { method: 'POST', body: formData, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Upload Failed");
        const data = await res.json();
        
        if(statusText) statusText.innerText = "MINTING ON BLOCKCHAIN...";
        
        // Chama a função atualizada no transactions.js que aceita (URI, Desc, Hash)
        await executeNotarizeDocument(
            data.ipfsUri, 
            desc, 
            data.contentHash, 
            0n, // Booster ID (Opcional)
            btn
        );
        
        clearInterval(progressTimer);
        if (progressBar) progressBar.style.width = `100%`;
        if(statusText) statusText.innerText = "SUCCESS!";
        
        setTimeout(() => {
            if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
            NotaryPage.reset(); 
            fetchUserHistory(); 
            loadUserData(true);
        }, 2000);

    } catch (e) {
        clearInterval(progressTimer); 
        const overlay = document.getElementById('mining-overlay');
        if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
        showToast("Error: " + e.message, "error");
        if(btn) { btn.disabled = false; btn.innerHTML = `Try Again`; }
    }
}

// =========================================================================
// HISTORY (ENTERPRISE STRUCT READING)
// =========================================================================

async function fetchUserHistory() {
    const container = document.getElementById('history-container');
    if (!container || !State.isConnected) return;
    
    try {
        if (!State.decentralizedNotaryContract) await loadPublicData();
        const contract = State.decentralizedNotaryContract;
        if (!contract) { container.innerHTML = renderNoData("Contract not available."); return; }

        // Filtra eventos para pegar os IDs
        const filter = contract.filters.NotarizationEvent(null, State.userAddress); 
        const events = await contract.queryFilter(filter, -50000);

        // Para cada ID, lê a STRUCT completa do contrato
        const docs = await Promise.all(events.map(async (e) => {
            const tokenId = e.args[0]; 
            let docInfo = { ipfsCid: "", description: "Loading...", contentHash: "" };
            
            try {
                docInfo = await contract.getDocumentInfo(tokenId);
            } catch (err) {
                console.warn("Could not read struct for token", tokenId);
            }

            return {
                image: docInfo.ipfsCid,
                description: docInfo.description,
                hash: docInfo.contentHash,
                txHash: e.transactionHash
            };
        }));

        const reversedDocs = docs.reverse();

        if (reversedDocs.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-10 opacity-50"><p>No files found.</p></div>`;
            return;
        }

        container.innerHTML = reversedDocs.map(doc => {
            const ipfsLink = doc.image.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${doc.image.replace('ipfs://', '')}` : doc.image;
            
            return `
                <div class="notary-glass rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors group flex flex-col">
                    <div class="h-32 bg-zinc-900/50 relative flex items-center justify-center overflow-hidden border-b border-zinc-800">
                        <img src="${ipfsLink}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                             onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-file-contract text-4xl text-zinc-600\\'></i>'">
                    </div>
                    <div class="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Description</p>
                            <p class="text-xs text-zinc-300 italic mb-3 line-clamp-2" title="${doc.description || ''}">"${doc.description || 'No description'}"</p>
                            
                            <p class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Content Hash</p>
                            <p class="text-[10px] font-mono text-zinc-600 truncate" title="${doc.hash}">${doc.hash}</p>
                        </div>
                        <div class="flex justify-between items-center mt-2 border-t border-zinc-800 pt-3">
                            <a href="${ipfsLink}" target="_blank" class="text-xs text-amber-500 hover:text-white font-bold">Open File</a>
                            
                            <a href="https://sepolia.arbiscan.io/tx/${doc.txHash}" target="_blank" class="text-zinc-600 hover:text-white"><i class="fa-solid fa-cube"></i></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("History Error:", e);
        container.innerHTML = renderNoData("Failed to load history.");
    }
}

async function loadNotaryPublicData() {
    const now = Date.now();
    if (now - lastNotaryDataFetch < 30000 && State.notaryFee > 0n) return;
    try {
        const hubContract = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        if (!hubContract) await loadPublicData();
        const key = ethers.id("NOTARY_SERVICE");
        const [fee, stake] = await safeContractCall(hubContract || State.ecosystemManagerContractPublic, 'getServiceRequirements', [key], [0n, 0n]);
        if (fee > 0n || stake > 0n) { State.notaryFee = fee; State.notaryMinPStake = stake; lastNotaryDataFetch = now; }
    } catch(e) {}
}

export const NotaryPage = {
    render: async (isActive) => {
        if (!isActive) return;
        renderNotaryPageLayout(); 
        await loadNotaryPublicData(); 
        if (State.isConnected) await loadUserData(); 
        updateNotaryInterface(); 
    },
    reset: () => { currentFileToUpload = null; updateNotaryStep(1); },
    refreshHistory: () => { fetchUserHistory(); },
    update: () => { updateNotaryInterface(); }
};

window.NotaryPage = NotaryPage;