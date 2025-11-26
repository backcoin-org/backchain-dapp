// pages/NotaryPage.js
// ✅ VERSÃO FINAL REDESENHADA: UX Intuitiva + Upload Robusto + Feedback Visual

import { addresses } from '../config.js'; 
import { State } from '../state.js';
import { formatBigNumber, formatPStake, renderLoading, renderError, renderNoData, ipfsGateway } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js'; 
import { showToast } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

// --- Constantes ---
const BLOCKCHAIN_EXPLORER_TX_URL = "https://sepolia.etherscan.io/tx/";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// --- Estado Local ---
let currentFileToUpload = null;
let currentUploadedIPFS_URI = null; 
let notaryButtonState = 'initial'; 
let pageContainer = null; 
let lastNotaryDataFetch = 0;

// =========================================================================
// 1. RENDERIZAÇÃO VISUAL (NOVO LAYOUT)
// =========================================================================

function renderNotaryPageLayout() {
    const container = document.getElementById('notary');
    if (!container) return;
    pageContainer = container; 

    if (container.querySelector('#notary-main-box')) return;

    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeIn">
            <div>
                <h1 class="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 font-display">
                    Decentralized Notary
                </h1>
                <p class="text-zinc-400 mt-2 max-w-xl text-sm leading-relaxed">
                    Certify documents permanently on the blockchain. Generate immutable proof of existence timestamped by the network.
                </p>
            </div>
            <div class="px-4 py-2 rounded-full bg-zinc-900 border border-green-500/30 text-xs font-mono text-green-400 flex items-center gap-2 shadow-lg shadow-green-900/10">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Service Active
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn animation-delay-200">

            <div class="lg:col-span-8 space-y-6">
                
                <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <div class="relative flex justify-between items-center z-10">
                        <div class="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -z-10 rounded-full"></div>
                        <div id="progress-line" class="absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500 w-0"></div>

                        <div id="step-indicator-1" class="step-bubble active relative group cursor-pointer" onclick="updateNotaryStep(1)">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-blue-500 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 group-hover:scale-110">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </div>
                            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap">Details</span>
                        </div>

                        <div id="step-indicator-2" class="step-bubble relative group cursor-not-allowed">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-zinc-700 text-zinc-500 font-bold transition-all duration-300 group-hover:border-zinc-600">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider whitespace-nowrap">Upload</span>
                        </div>

                        <div id="step-indicator-3" class="step-bubble relative group cursor-not-allowed">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-zinc-700 text-zinc-500 font-bold transition-all duration-300 group-hover:border-zinc-600">
                                <i class="fa-solid fa-fingerprint"></i>
                            </div>
                            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider whitespace-nowrap">Mint</span>
                        </div>
                    </div>
                </div>

                <div id="notary-main-box" class="bg-zinc-900/40 border border-zinc-700/50 rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[400px] flex flex-col">
                    
                    <div id="notary-step-1" class="step-content flex-1 flex flex-col">
                        <h2 class="text-2xl font-bold text-white mb-2">1. Describe your Document</h2>
                        <p class="text-sm text-zinc-400 mb-6">This description will be permanently engraved in the NFT metadata.</p>
                        
                        <div class="relative flex-1">
                            <textarea id="notary-user-description" 
                                class="w-full h-48 bg-black/30 border border-zinc-700 rounded-xl p-5 text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-zinc-600 resize-none" 
                                placeholder="E.g., 'Copyright registration for Project Alpha v1.0 source code' or 'Scan of property deed #12345'."
                            ></textarea>
                            <div class="absolute bottom-4 right-4 text-xs font-mono text-zinc-500 bg-black/50 px-2 py-1 rounded">
                                <span id="notary-description-counter">0</span> / 256
                            </div>
                        </div>
                        
                        <button id="notary-step-1-btn" class="w-full mt-6 py-4 bg-zinc-800 text-zinc-500 font-bold rounded-xl cursor-not-allowed transition-all flex items-center justify-center gap-2" disabled>
                            Next Step <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>

                    <div id="notary-step-2" class="hidden step-content flex-1 flex flex-col">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-white">2. Attach File</h2>
                            <button id="notary-step-back-1" class="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-zinc-800">
                                <i class="fa-solid fa-arrow-left"></i> Back
                            </button>
                        </div>
                        
                        <div class="flex-1 flex items-center justify-center">
                            <label id="notary-file-dropzone" for="notary-file-upload" 
                                class="relative w-full h-64 border-2 border-zinc-700 border-dashed rounded-2xl cursor-pointer bg-black/20 hover:bg-blue-900/10 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center justify-center group">
                                
                                <div id="notary-upload-prompt" class="text-center z-10 pointer-events-none">
                                    <div class="w-20 h-20 rounded-full bg-zinc-800 group-hover:bg-blue-600/20 flex items-center justify-center mb-4 mx-auto transition-colors">
                                        <i class="fa-solid fa-cloud-arrow-up text-3xl text-zinc-400 group-hover:text-blue-400 transition-colors"></i>
                                    </div>
                                    <p class="text-lg text-zinc-300 font-medium group-hover:text-white transition-colors">Click to upload or drag file</p>
                                    <p class="text-xs text-zinc-500 mt-2">PDF, PNG, JPG, ZIP (Max 50MB)</p>
                                </div>

                                <div id="notary-upload-status" class="hidden absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center rounded-2xl z-20">
                                    </div>
                            </label>
                            <input id="notary-file-upload" type="file" class="hidden" />
                        </div>
                    </div>

                    <div id="notary-step-3" class="hidden step-content flex-1 flex flex-col">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-white">3. Final Review</h2>
                            <button id="notary-step-back-2" class="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-zinc-800">
                                <i class="fa-solid fa-arrow-left"></i> Change File
                            </button>
                        </div>
                        
                        <div class="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 mb-8 flex-1">
                            <div class="flex items-center gap-4 mb-6">
                                <div class="w-14 h-14 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-file-contract text-blue-400 text-2xl"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filename</h3>
                                    <p id="notary-summary-filename" class="text-white font-bold text-lg truncate">...</p>
                                </div>
                            </div>
                            
                            <div class="pl-4 border-l-2 border-zinc-700">
                                <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Metadata Description</h3>
                                <p id="notary-summary-description" class="text-zinc-300 text-sm italic">...</p>
                            </div>
                        </div>

                        <input type="hidden" id="notary-document-uri">
                        
                        <button id="notarize-submit-btn" class="w-full bg-zinc-800 text-zinc-500 font-bold py-4 rounded-xl cursor-not-allowed transition-all flex items-center justify-center gap-3" disabled>
                            Waiting for upload...
                        </button>
                    </div>

                </div>
            </div>

            <div class="lg:col-span-4 space-y-6">
                
                <div id="notary-user-status-box" class="bg-sidebar border border-zinc-800 rounded-2xl p-6 shadow-xl transition-all duration-500">
                    <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-wallet"></i> Requirements Check
                    </h3>
                    
                    <div id="notary-user-status" class="space-y-4">
                         <div class="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <div class="loader mb-3"></div>
                            <span class="text-xs">Connecting...</span>
                         </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Protocol Stats</h3>
                    <div id="notary-stats-container" class="space-y-3">
                        <div class="h-8 bg-zinc-800 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-16 pt-10 border-t border-zinc-800 animate-fadeIn animation-delay-500">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> My History
                </h2>
                <button id="refresh-docs-btn" class="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-rotate"></i>
                </button>
            </div>
            
            <div id="my-notarized-documents" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                </div>
        </div>
    `;

    initNotaryListeners();
}

// =========================================================================
// 2. CONTROLE DE UI (STEPS & STATUS)
// =========================================================================

function updateNotaryStep(targetStep) {
    const progressLine = document.getElementById('progress-line');
    
    // Esconde todos os painéis
    [1, 2, 3].forEach(step => {
        const el = document.getElementById(`notary-step-${step}`);
        if(el) el.classList.add('hidden');
        
        // Atualiza Bolhas
        const ind = document.getElementById(`step-indicator-${step}`);
        if(ind) {
            const circle = ind.querySelector('div');
            const text = ind.querySelector('span');
            
            if (step < targetStep) {
                // Passo Concluído
                circle.className = "w-12 h-12 rounded-full flex items-center justify-center bg-blue-900/50 border-2 border-blue-500 text-blue-400 font-bold transition-all";
                circle.innerHTML = '<i class="fa-solid fa-check"></i>';
                text.className = "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap";
            } else if (step === targetStep) {
                // Passo Atual
                circle.className = "w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-white text-white font-bold transition-all shadow-lg shadow-white/10 transform scale-110";
                // Restaura ícone original
                if(step === 1) circle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                if(step === 2) circle.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
                if(step === 3) circle.innerHTML = '<i class="fa-solid fa-fingerprint"></i>';
                
                text.className = "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap";
            } else {
                // Passo Futuro
                circle.className = "w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border-2 border-zinc-800 text-zinc-600 font-bold transition-all";
                if(step === 1) circle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                if(step === 2) circle.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
                if(step === 3) circle.innerHTML = '<i class="fa-solid fa-fingerprint"></i>';
                
                text.className = "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-700 uppercase tracking-wider whitespace-nowrap";
            }
        }
    });

    // Mostra painel alvo
    const targetPanel = document.getElementById(`notary-step-${targetStep}`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    // Atualiza linha
    if (progressLine) {
        if (targetStep === 1) progressLine.style.width = '0%';
        if (targetStep === 2) progressLine.style.width = '50%';
        if (targetStep === 3) progressLine.style.width = '100%';
    }
}

function updateNotaryUserStatus() {
    const userStatusEl = document.getElementById('notary-user-status');
    const submitBtn = document.getElementById('notarize-submit-btn'); 
    
    if (!userStatusEl || !submitBtn) return;

    if (!State.isConnected) {
        userStatusEl.innerHTML = `
            <div class="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                <i class="fa-solid fa-wallet text-2xl text-zinc-600 mb-2"></i>
                <p class="text-sm text-zinc-500">Connect wallet to continue</p>
            </div>`;
        submitBtn.className = "w-full bg-zinc-800 text-zinc-500 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-3";
        submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Connect Wallet`;
        return;
    }

    // Dados
    const userPStake = State.userTotalPStake || 0n;
    const reqPStake = State.notaryMinPStake || 0n;
    const userBalance = State.currentUserBalance || 0n;
    const baseFee = State.notaryFee || 0n;
    
    // Lógica de Desconto (Booster)
    // Simplificada para garantir renderização, assumindo 0 se não tiver dados
    let discount = 0n;
    let finalFee = baseFee;
    
    const hasPStake = userPStake >= reqPStake;
    const hasBalance = userBalance >= finalFee;

    userStatusEl.innerHTML = `
        <div class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border ${hasPStake ? 'border-green-500/20' : 'border-red-500/20'}">
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center ${hasPStake ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}">
                    <i class="fa-solid ${hasPStake ? 'fa-check' : 'fa-xmark'} text-xs"></i>
                </div>
                <div>
                    <p class="text-[10px] text-zinc-500 uppercase font-bold">Power Stake</p>
                    <p class="text-xs font-mono ${hasPStake ? 'text-white' : 'text-red-400'}">${formatPStake(userPStake)} / ${formatPStake(reqPStake)}</p>
                </div>
            </div>
            ${!hasPStake ? `<button id="delegate-now-btn" class="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition-colors">Get Stake</button>` : ''}
        </div>

        <div class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border ${hasBalance ? 'border-green-500/20' : 'border-red-500/20'}">
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center ${hasBalance ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}">
                    <i class="fa-solid ${hasBalance ? 'fa-check' : 'fa-xmark'} text-xs"></i>
                </div>
                <div>
                    <p class="text-[10px] text-zinc-500 uppercase font-bold">Cost (Fee)</p>
                    <p class="text-xs font-mono ${hasBalance ? 'text-white' : 'text-red-400'}">${formatBigNumber(finalFee)} BKC</p>
                </div>
            </div>
            ${!hasBalance ? `<a href="${addresses.bkcDexPoolAddress}" target="_blank" class="text-[10px] bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded transition-colors">Buy BKC</a>` : ''}
        </div>
    `;

    // Atualiza Botão Principal baseado no Estado
    if (notaryButtonState === 'initial' || notaryButtonState === 'file_ready') {
        // Lógica já tratada pelo step 1 e 2
    } else if (notaryButtonState === 'upload_ready') {
        if (hasPStake && hasBalance) {
            submitBtn.className = "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2";
            submitBtn.innerHTML = `<i class="fa-solid fa-fingerprint"></i> Authenticate & Mint NFT`;
            submitBtn.disabled = false;
        } else {
            submitBtn.className = "w-full bg-zinc-800 text-zinc-500 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2";
            submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Requirements not met`;
            submitBtn.disabled = true;
        }
    } else if (notaryButtonState === 'signing' || notaryButtonState === 'notarizing') {
        submitBtn.className = "w-full bg-zinc-800 text-white font-bold py-4 rounded-xl cursor-wait flex items-center justify-center gap-2";
        submitBtn.innerHTML = `<div class="loader-sm inline-block"></div> Processing...`;
        submitBtn.disabled = true;
    }
}

// =========================================================================
// 3. DADOS (LOADERS)
// =========================================================================

async function loadNotaryPublicData() {
    const now = Date.now();
    if (now - lastNotaryDataFetch < 60000 && State.notaryFee !== undefined) {
        renderRequirementsWidget();
        return true;
    }

    if (!State.ecosystemManagerContract) return false;

    try {
        lastNotaryDataFetch = now; 
        const [baseFee, pStakeRequirement] = await safeContractCall(
            State.ecosystemManagerContract, 'getServiceRequirements', ["NOTARY_SERVICE"], [0n, 0n] 
        );
        State.notaryMinPStake = pStakeRequirement;
        State.notaryFee = baseFee; 
        renderRequirementsWidget();
    } catch (e) {
        // Fallback
        if(State.notaryFee === undefined) {
            State.notaryFee = 500000000000000000n; 
            State.notaryMinPStake = 500000000000000000000n;
        }
        renderRequirementsWidget();
    }
}

function renderRequirementsWidget() {
    const statsEl = document.getElementById('notary-stats-container');
    if (!statsEl) return;

    const fee = State.notaryFee || 0n;
    const pStake = State.notaryMinPStake || 0n;

    statsEl.innerHTML = `
        <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-400">Service Fee</span>
            <span class="font-mono text-white">${formatBigNumber(fee)} BKC</span>
        </div>
        <div class="h-px bg-zinc-800 w-full my-2"></div>
        <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-400">Min. pStake</span>
            <span class="font-mono text-purple-400">${formatPStake(pStake)}</span>
        </div>
    `;
}

async function renderMyNotarizedDocuments() {
    const docsEl = document.getElementById('my-notarized-documents');
    if (!docsEl || !State.userAddress) return;

    docsEl.innerHTML = renderLoading();

    try {
        const response = await fetch(`${API_ENDPOINTS.getNotaryHistory}/${State.userAddress}`);
        if (!response.ok) throw new Error("API Error");
        const documents = await response.json();

        if (documents.length === 0) {
            docsEl.innerHTML = renderNoData("No documents found.");
            return;
        }
        
        let html = '';
        for (const doc of documents) {
            const explorerLink = `${BLOCKCHAIN_EXPLORER_TX_URL}${doc.txHash}`;
            // Fallback seguro para IPFS Gateway
            const metaLink = doc.metadataURI ? doc.metadataURI.replace('ipfs://', ipfsGateway) : '#';

            html += `
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group">
                    <div class="h-24 bg-black/40 flex items-center justify-center relative">
                        <i class="fa-solid fa-file-shield text-3xl text-zinc-700 group-hover:text-blue-500 transition-colors"></i>
                        <div class="absolute top-2 right-2 px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400">
                            #${doc.tokenId}
                        </div>
                    </div>
                    <div class="p-4">
                        <h4 class="text-white font-bold text-sm truncate mb-4">Document #${doc.tokenId}</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <a href="${metaLink}" target="_blank" class="text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded transition-colors">
                                View Data
                            </a>
                            <a href="${explorerLink}" target="_blank" class="text-center py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 rounded border border-blue-500/20 transition-colors">
                                Proof
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        docsEl.innerHTML = html;
    } catch (e) {
        docsEl.innerHTML = renderError("Failed to load history.");
    }
}

// =========================================================================
// 4. HANDLERS DE EVENTOS
// =========================================================================

function initNotaryListeners() {
    // Re-anexar listeners é necessário porque o HTML é recriado
    const fileInput = document.getElementById('notary-file-upload');
    const dropzone = document.getElementById('notary-file-dropzone');
    
    // Step 1: Descrição
    const descInput = document.getElementById('notary-user-description');
    const step1Btn = document.getElementById('notary-step-1-btn');
    
    if (descInput && step1Btn) {
        descInput.addEventListener('input', () => {
            const len = descInput.value.trim().length;
            document.getElementById('notary-description-counter').innerText = len;
            
            if (len > 0) {
                step1Btn.disabled = false;
                step1Btn.classList.remove('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed');
                step1Btn.classList.add('bg-blue-600', 'hover:bg-blue-500', 'text-white', 'shadow-lg');
            } else {
                step1Btn.disabled = true;
                step1Btn.classList.add('bg-zinc-800', 'text-zinc-500', 'cursor-not-allowed');
                step1Btn.classList.remove('bg-blue-600', 'hover:bg-blue-500', 'text-white', 'shadow-lg');
            }
        });

        step1Btn.addEventListener('click', () => {
            if(!step1Btn.disabled) updateNotaryStep(2);
        });
    }

    // Step 2: Drag & Drop
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files?.length > 0) handleFileUpload(e.target.files[0]);
        });

        // Drag events visual feedback
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-blue-500', 'bg-blue-500/5');
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-blue-500', 'bg-blue-500/5');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-blue-500', 'bg-blue-500/5');
            if (e.dataTransfer.files?.length > 0) handleFileUpload(e.dataTransfer.files[0]);
        });
    }

    // Botão Final (Submit)
    const submitBtn = document.getElementById('notarize-submit-btn');
    if (submitBtn) {
        // Clone to remove old listeners
        const newBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newBtn, submitBtn);
        
        newBtn.addEventListener('click', async () => {
            if (newBtn.disabled) return;

            // LOGICA DE UPLOAD (IPFS)
            if (notaryButtonState === 'file_ready') {
                notaryButtonState = 'signing';
                updateNotaryUserStatus(); // Show loading spinner on button

                try {
                    const signer = await State.provider.getSigner();
                    // Solicita assinatura para autenticar upload (Segurança)
                    const signature = await signer.signMessage("I am signing to authenticate my file for notarization on Backchain.");
                    
                    const formData = new FormData();
                    formData.append('file', currentFileToUpload);
                    formData.append('signature', signature);
                    formData.append('address', State.userAddress);
                    formData.append('description', document.getElementById('notary-user-description').value);

                    const response = await fetch(API_ENDPOINTS.uploadFileToIPFS, { method: 'POST', body: formData });
                    
                    if (!response.ok) throw new Error("Upload failed");
                    
                    const result = await response.json();
                    currentUploadedIPFS_URI = result.ipfsUri; // Salva URI para o passo final
                    
                    notaryButtonState = 'upload_ready';
                    updateNotaryUserStatus();
                    showToast("File uploaded securely!", "success");

                } catch (err) {
                    console.error(err);
                    showToast("Upload Error: " + err.message, "error");
                    notaryButtonState = 'file_ready';
                    updateNotaryUserStatus();
                }
                return;
            }

            // LOGICA DE MINT (BLOCKCHAIN)
            if (notaryButtonState === 'upload_ready') {
                notaryButtonState = 'notarizing';
                updateNotaryUserStatus();

                const boosterId = State.userBoosterId || 0n;
                const success = await executeNotarizeDocument(currentUploadedIPFS_URI, boosterId, newBtn);
                
                if (success) {
                    // Reset total
                    setTimeout(() => {
                        document.getElementById('notary-user-description').value = "";
                        currentFileToUpload = null;
                        notaryButtonState = 'initial';
                        updateNotaryStep(1);
                        renderMyNotarizedDocuments();
                    }, 2000);
                } else {
                    notaryButtonState = 'upload_ready';
                    updateNotaryUserStatus();
                }
            }
        });
    }
}

async function handleFileUpload(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast("File too large (Max 50MB)", "error");
        return;
    }

    currentFileToUpload = file;
    
    // UI Feedback
    const statusEl = document.getElementById('notary-upload-status');
    const promptEl = document.getElementById('notary-upload-prompt');
    
    promptEl.classList.add('hidden');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `
        <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-bounce-short">
            <i class="fa-solid fa-check text-3xl text-green-500"></i>
        </div>
        <p class="text-white font-bold">${file.name}</p>
        <p class="text-zinc-500 text-xs mt-1">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    `;

    // Preenche resumo
    document.getElementById('notary-summary-filename').innerText = file.name;
    document.getElementById('notary-summary-description').innerText = document.getElementById('notary-user-description').value || "No description provided.";

    // Avança estado
    notaryButtonState = 'file_ready';
    
    setTimeout(() => {
        updateNotaryStep(3);
        updateNotaryUserStatus(); // Atualiza botão para "Sign & Upload"
    }, 1000);
}

// =========================================================================
// 5. EXPORT
// =========================================================================

export const NotaryPage = {
    async render(isNewPage) {
        renderNotaryPageLayout();
        
        if (isNewPage && !State.userAddress) await loadPublicData();
        await loadNotaryPublicData();

        if (State.isConnected) {
             if(!State.currentUserBalance) await loadUserData();
             updateNotaryUserStatus();
             renderMyNotarizedDocuments();
        } else {
             updateNotaryUserStatus(); 
        }
        
        // Inicializa Listeners
        initNotaryListeners();
        
        if(isNewPage) {
            updateNotaryStep(1);
            notaryButtonState = 'initial';
        }
    },
    
    update() {
        updateNotaryUserStatus();
    }
};