// pages/NotaryPage.js
// ✅ VERSION V6.0: Clean UI, Mobile-First, V2.1 Compatible

import { State } from '../state.js';
import { formatBigNumber, renderLoading, renderNoData } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js';
import { showToast, addNftToWallet } from '../ui-feedback.js';
import { executeNotarizeDocument } from '../modules/transactions.js';

const ethers = window.ethers;

// --- CONFIG ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const EXPLORER_BASE = "https://sepolia.arbiscan.io/tx/";

// --- LOCAL STATE ---
let currentFile = null;
let descriptionCache = "";
let lastDataFetch = 0;

// --- STYLES ---
const style = document.createElement('style');
style.innerHTML = `
    .notary-drop-zone {
        border: 2px dashed #3f3f46;
        transition: all 0.2s ease;
    }
    .notary-drop-zone.active {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.05);
    }
    .notary-drop-zone:hover {
        border-color: #52525b;
        background: rgba(255, 255, 255, 0.02);
    }
    .step-indicator {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    .step-indicator.pending {
        background: #27272a;
        color: #71717a;
        border: 2px solid #3f3f46;
    }
    .step-indicator.active {
        background: #f59e0b;
        color: #000;
        border: 2px solid #f59e0b;
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
    }
    .step-indicator.completed {
        background: #10b981;
        color: #fff;
        border: 2px solid #10b981;
    }
    @keyframes scanLine {
        0% { top: 0; opacity: 0; }
        50% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
    }
    .scan-animation {
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #f59e0b, transparent);
        animation: scanLine 2s ease-in-out infinite;
    }
`;
document.head.appendChild(style);

// ============================================================================
// 1. REQUIREMENTS CHECK
// ============================================================================

function checkRequirements() {
    if (!State.isConnected) return { allowed: false, reason: 'wallet' };
    
    const userBalance = State.currentUserBalance || 0n;
    const fee = State.notaryFee || ethers.parseEther("1");
    
    if (userBalance < fee) {
        return { allowed: false, reason: 'balance', current: userBalance, required: fee };
    }
    
    return { allowed: true };
}

// ============================================================================
// 2. MAIN RENDER
// ============================================================================

function renderLayout() {
    const container = document.getElementById('notary');
    if (!container) return;
    if (container.querySelector('#notary-main')) {
        updateInterface();
        return;
    }

    container.innerHTML = `
        <div id="notary-main" class="max-w-4xl mx-auto py-6 px-4">
            
            <!-- HEADER -->
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h1 class="text-xl font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-stamp text-amber-500"></i> Notary
                    </h1>
                    <p class="text-xs text-zinc-500 mt-1">Permanent on-chain document certification</p>
                </div>
                <div id="status-badge" class="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-500">
                    CHECKING...
                </div>
            </div>

            <!-- MAIN GRID -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: Action Area -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Progress Steps -->
                    <div class="glass-panel p-4 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div id="step-1" class="step-indicator active">1</div>
                                <span class="text-xs text-zinc-400 hidden sm:inline">File</span>
                            </div>
                            <div class="flex-1 h-px bg-zinc-700 mx-2 sm:mx-4" id="line-1-2"></div>
                            <div class="flex items-center gap-2">
                                <div id="step-2" class="step-indicator pending">2</div>
                                <span class="text-xs text-zinc-400 hidden sm:inline">Details</span>
                            </div>
                            <div class="flex-1 h-px bg-zinc-700 mx-2 sm:mx-4" id="line-2-3"></div>
                            <div class="flex items-center gap-2">
                                <div id="step-3" class="step-indicator pending">3</div>
                                <span class="text-xs text-zinc-400 hidden sm:inline">Mint</span>
                            </div>
                        </div>
                    </div>

                    <!-- Dynamic Content Area -->
                    <div id="action-area" class="glass-panel p-6 rounded-xl min-h-[300px] flex flex-col justify-center">
                        ${renderLoading()}
                    </div>
                </div>

                <!-- RIGHT: Info Panel -->
                <div class="space-y-4">
                    
                    <!-- Cost Info -->
                    <div class="glass-panel p-4 rounded-xl border-l-2 border-amber-500">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Service Cost</h3>
                        <div id="cost-info" class="space-y-2">
                            <!-- Dynamic -->
                        </div>
                    </div>

                    <!-- How It Works -->
                    <div class="glass-panel p-4 rounded-xl">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                            <i class="fa-solid fa-info-circle text-blue-400 mr-1"></i> How It Works
                        </h3>
                        <ul class="text-[11px] text-zinc-500 space-y-2">
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500">1.</span>
                                <span>Upload any file (max 10MB)</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500">2.</span>
                                <span>Add optional description</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-amber-500">3.</span>
                                <span>Sign & mint as NFT certificate</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-green-500">✓</span>
                                <span>Hash stored permanently on-chain</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- HISTORY -->
            <div class="mt-8">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-zinc-500"></i> Your Certificates
                    </h2>
                    <button id="btn-refresh-history" class="text-[10px] text-amber-500 hover:text-white transition-colors">
                        <i class="fa-solid fa-rotate mr-1"></i> Refresh
                    </button>
                </div>
                <div id="history-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${renderLoading()}
                </div>
            </div>
        </div>

        <!-- Processing Overlay -->
        ${renderProcessingOverlay()}
    `;

    attachListeners();
    updateInterface();
    fetchHistory();
}

function renderProcessingOverlay() {
    return `
        <div id="processing-overlay" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/95 backdrop-blur-sm">
            <div class="text-center p-6">
                <div class="relative w-24 h-24 mx-auto mb-4">
                    <div class="scan-animation"></div>
                    <img src="assets/bkc_logo_3d.png" class="w-full h-full object-contain opacity-80" alt="">
                </div>
                <h3 class="text-xl font-bold text-white mb-1">Notarizing</h3>
                <p id="processing-status" class="text-amber-500 text-xs font-mono mb-4">UPLOADING...</p>
                <div class="w-48 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                    <div id="processing-bar" class="h-full bg-amber-500 rounded-full w-0 transition-all duration-300"></div>
                </div>
                <p class="text-[10px] text-zinc-600 mt-3">Do not close this window</p>
            </div>
        </div>
    `;
}

// ============================================================================
// 3. INTERFACE UPDATE
// ============================================================================

function updateInterface() {
    const badge = document.getElementById('status-badge');
    const costInfo = document.getElementById('cost-info');
    const actionArea = document.getElementById('action-area');
    
    if (!badge || !costInfo || !actionArea) return;

    const check = checkRequirements();
    const isOnline = State.isConnected;
    const fee = State.notaryFee || ethers.parseEther("1");
    const userBalance = State.currentUserBalance || 0n;

    // Status Badge
    badge.innerHTML = isOnline 
        ? `<span class="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></span> Online`
        : `<span class="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1"></span> Disconnected`;
    badge.className = `text-[10px] font-mono px-2 py-1 rounded ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-500'}`;

    // Cost Info
    const hasBalance = userBalance >= fee;
    costInfo.innerHTML = `
        <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-500">Fee</span>
            <span class="text-white font-mono font-bold">${formatBigNumber(fee)} BKC</span>
        </div>
        <div class="flex justify-between items-center text-sm pt-2 border-t border-zinc-700/50 mt-2">
            <span class="text-zinc-500">Balance</span>
            <span class="${hasBalance ? 'text-green-400' : 'text-red-400'} font-mono font-bold">${formatBigNumber(userBalance)} BKC</span>
        </div>
        ${!hasBalance && isOnline ? `
            <div class="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                <i class="fa-solid fa-exclamation-circle mr-1"></i> Insufficient balance
            </div>
        ` : ''}
    `;

    // Action Area
    if (!check.allowed) {
        if (check.reason === 'wallet') {
            actionArea.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-wallet text-xl text-zinc-500"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">Connect Wallet</h3>
                    <p class="text-zinc-500 text-xs mb-4">Connect to notarize documents</p>
                    <button onclick="window.openConnectModal()" class="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg text-sm">
                        Connect
                    </button>
                </div>
            `;
        } else if (check.reason === 'balance') {
            actionArea.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-coins text-xl text-red-500"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">Insufficient Balance</h3>
                    <p class="text-zinc-500 text-xs">You need ${formatBigNumber(fee)} BKC to notarize</p>
                </div>
            `;
        }
        return;
    }

    // Show current step
    if (!currentFile) {
        renderStep(1);
    }
}

// ============================================================================
// 4. STEP RENDERING
// ============================================================================

function renderStep(step) {
    const actionArea = document.getElementById('action-area');
    if (!actionArea) return;

    // Update step indicators
    [1, 2, 3].forEach(i => {
        const el = document.getElementById(`step-${i}`);
        if (el) {
            el.className = `step-indicator ${i < step ? 'completed' : (i === step ? 'active' : 'pending')}`;
            el.innerHTML = i < step ? '<i class="fa-solid fa-check text-[10px]"></i>' : i;
        }
    });

    // Update lines
    const line12 = document.getElementById('line-1-2');
    const line23 = document.getElementById('line-2-3');
    if (line12) line12.className = `flex-1 h-px mx-2 sm:mx-4 ${step > 1 ? 'bg-amber-500' : 'bg-zinc-700'}`;
    if (line23) line23.className = `flex-1 h-px mx-2 sm:mx-4 ${step > 2 ? 'bg-amber-500' : 'bg-zinc-700'}`;

    // Step Content
    if (step === 1) {
        actionArea.innerHTML = `
            <div class="text-center">
                <h3 class="text-lg font-bold text-white mb-4">Select File</h3>
                <div id="drop-zone" class="notary-drop-zone rounded-xl p-8 cursor-pointer">
                    <input type="file" id="file-input" class="hidden" accept="*">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-amber-500 mb-3"></i>
                    <p class="text-zinc-300 text-sm font-medium mb-1">Click or drag file here</p>
                    <p class="text-[10px] text-zinc-600">Max 10MB • Any format</p>
                </div>
            </div>
        `;
        initDropZone();
    } 
    else if (step === 2) {
        actionArea.innerHTML = `
            <div class="w-full max-w-md mx-auto">
                <h3 class="text-lg font-bold text-white mb-4 text-center">Add Details</h3>
                
                <!-- File Preview -->
                <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <i class="fa-regular fa-file text-amber-500"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium truncate">${currentFile?.name || 'Unknown'}</p>
                        <p class="text-[10px] text-zinc-500">${currentFile ? (currentFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                    </div>
                    <button id="btn-remove-file" class="text-zinc-500 hover:text-red-400 transition-colors">
                        <i class="fa-solid fa-trash text-sm"></i>
                    </button>
                </div>

                <!-- Description -->
                <div class="mb-4">
                    <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                        Description (Optional)
                    </label>
                    <textarea id="description-input" rows="3" 
                        class="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-zinc-600 resize-none"
                        placeholder="E.g., Property deed, Contract #123...">${descriptionCache}</textarea>
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                    <button id="btn-back-step1" class="flex-1 border border-zinc-700 text-zinc-400 font-bold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm">
                        Back
                    </button>
                    <button id="btn-next-step3" class="flex-[2] bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm">
                        Continue
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-remove-file').onclick = () => {
            currentFile = null;
            descriptionCache = "";
            renderStep(1);
        };
        document.getElementById('btn-back-step1').onclick = () => renderStep(1);
        document.getElementById('btn-next-step3').onclick = () => {
            const input = document.getElementById('description-input');
            if (input) descriptionCache = input.value;
            renderStep(3);
        };
    }
    else if (step === 3) {
        const desc = descriptionCache || "No description provided";
        actionArea.innerHTML = `
            <div class="w-full max-w-md mx-auto text-center">
                <h3 class="text-lg font-bold text-white mb-2">Confirm & Mint</h3>
                <p class="text-xs text-zinc-500 mb-4">This will permanently store the file hash on-chain</p>

                <!-- Summary -->
                <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4 text-left">
                    <div class="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-700/50">
                        <div class="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center">
                            <i class="fa-regular fa-file text-amber-500 text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-medium truncate">${currentFile?.name}</p>
                        </div>
                    </div>
                    <p class="text-xs text-zinc-400 italic">"${desc}"</p>
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                    <button id="btn-back-step2" class="flex-1 border border-zinc-700 text-zinc-400 font-bold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm">
                        Back
                    </button>
                    <button id="btn-mint" class="flex-[2] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 rounded-lg transition-all text-sm">
                        <i class="fa-solid fa-stamp mr-2"></i> Sign & Mint
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-back-step2').onclick = () => renderStep(2);
        document.getElementById('btn-mint').onclick = () => handleMint();
    }
}

// ============================================================================
// 5. FILE HANDLING
// ============================================================================

function initDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    if (!dropZone || !fileInput) return;

    dropZone.onclick = () => fileInput.click();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, () => dropZone.classList.add('active'));
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, () => dropZone.classList.remove('active'));
    });

    dropZone.addEventListener('drop', handleFile);
    fileInput.addEventListener('change', handleFile);
}

function handleFile(e) {
    const check = checkRequirements();
    if (!check.allowed) {
        if (check.reason === 'balance') showToast("Insufficient BKC balance", "error");
        else showToast("Connect wallet first", "error");
        return;
    }

    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast("File too large (max 10MB)", "error");
        return;
    }

    currentFile = file;
    renderStep(2);
}

// ============================================================================
// 6. MINT PROCESS
// ============================================================================

async function handleMint() {
    const btn = document.getElementById('btn-mint');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Signing...';
    }

    let progressTimer;

    try {
        const description = descriptionCache?.trim() || "No description provided";

        // Sign message
        const signer = await State.provider.getSigner();
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        const signature = await signer.signMessage(message);

        // Show overlay
        const overlay = document.getElementById('processing-overlay');
        const progressBar = document.getElementById('processing-bar');
        const statusText = document.getElementById('processing-status');
        
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        let progress = 0;
        progressTimer = setInterval(() => {
            progress = Math.min(progress + 0.5, 90);
            if (progressBar) progressBar.style.width = `${progress}%`;
        }, 500);

        // Upload to IPFS
        if (statusText) statusText.textContent = "UPLOADING TO IPFS...";

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('signature', signature);
        formData.append('address', State.userAddress);

        const uploadUrl = API_ENDPOINTS.uploadFileToIPFS || "https://api.backcoin.org/upload";
        const res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(180000)
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        // Mint on-chain
        if (statusText) statusText.textContent = "MINTING ON BLOCKCHAIN...";

        await executeNotarizeDocument(
            data.ipfsUri,
            description,
            data.contentHash,
            0n,
            btn
        );

        // Success
        clearInterval(progressTimer);
        if (progressBar) progressBar.style.width = '100%';
        if (statusText) statusText.textContent = "SUCCESS!";

        setTimeout(() => {
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
            NotaryPage.reset();
            fetchHistory();
            loadUserData(true);
        }, 2000);

    } catch (e) {
        clearInterval(progressTimer);
        
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        showToast(e.message || "Notarization failed", "error");
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint';
        }
    }
}

// ============================================================================
// 7. HISTORY
// ============================================================================

async function fetchHistory() {
    const container = document.getElementById('history-container');
    if (!container || !State.isConnected) return;

    try {
        if (!State.decentralizedNotaryContract) await loadPublicData();
        const contract = State.decentralizedNotaryContract;
        
        if (!contract) {
            container.innerHTML = renderNoData("Contract not available");
            return;
        }

        const filter = contract.filters.NotarizationEvent(null, State.userAddress);
        const events = await contract.queryFilter(filter, -50000);

        const docs = await Promise.all(events.map(async (e) => {
            const tokenId = e.args[0];
            let info = { ipfsCid: "", description: "", contentHash: "" };
            
            try {
                info = await contract.getDocumentInfo(tokenId);
            } catch (err) {
                console.warn("Could not read doc info for token", tokenId);
            }

            return {
                id: tokenId.toString(),
                image: info.ipfsCid,
                description: info.description,
                hash: info.contentHash,
                txHash: e.transactionHash
            };
        }));

        const sorted = docs.reverse();

        if (sorted.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-stamp text-zinc-600 text-lg"></i>
                    </div>
                    <p class="text-zinc-500 text-sm">No certificates yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sorted.map(doc => {
            const ipfsLink = doc.image.startsWith('ipfs://') 
                ? `https://ipfs.io/ipfs/${doc.image.replace('ipfs://', '')}` 
                : doc.image;

            return `
                <div class="glass-panel rounded-xl overflow-hidden hover:border-amber-500/30 transition-colors group">
                    <!-- Preview -->
                    <div class="h-24 bg-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        <img src="${ipfsLink}" 
                             class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fa-solid fa-file-contract text-2xl text-zinc-600\\'></i>'">
                    </div>
                    
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-[10px] text-zinc-600 uppercase mb-1">Description</p>
                        <p class="text-xs text-zinc-300 truncate mb-2" title="${doc.description || ''}">${doc.description || 'No description'}</p>
                        
                        <p class="text-[10px] text-zinc-600 uppercase mb-1">Hash</p>
                        <p class="text-[9px] font-mono text-zinc-500 truncate mb-3" title="${doc.hash}">${doc.hash?.slice(0, 20)}...</p>
                        
                        <!-- Actions -->
                        <div class="flex justify-between items-center pt-2 border-t border-zinc-800">
                            <div class="flex gap-2">
                                <a href="${ipfsLink}" target="_blank" class="text-[10px] text-amber-500 hover:text-white font-bold">
                                    View
                                </a>
                                <button onclick="NotaryPage.addToWallet('${doc.id}')" class="text-zinc-500 hover:text-amber-400 transition-colors">
                                    <i class="fa-solid fa-wallet text-[10px]"></i>
                                </button>
                            </div>
                            <a href="${EXPLORER_BASE}${doc.txHash}" target="_blank" class="text-zinc-600 hover:text-white">
                                <i class="fa-solid fa-external-link text-[10px]"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("History Error:", e);
        container.innerHTML = renderNoData("Failed to load history");
    }
}

// ============================================================================
// 8. LISTENERS
// ============================================================================

function attachListeners() {
    const refreshBtn = document.getElementById('btn-refresh-history');
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            refreshBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin mr-1"></i> Loading...';
            fetchHistory().then(() => {
                refreshBtn.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i> Refresh';
            });
        };
    }
}

// ============================================================================
// 9. DATA LOADING
// ============================================================================

async function loadNotaryData() {
    const now = Date.now();
    if (now - lastDataFetch < 30000 && State.notaryFee > 0n) return;

    try {
        const hub = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        if (!hub) await loadPublicData();

        // V2.1: Use getFee
        const key = ethers.id("NOTARY_SERVICE");
        const fee = await safeContractCall(hub || State.ecosystemManagerContractPublic, 'getFee', [key], 0n);

        if (fee > 0n) {
            State.notaryFee = fee;
            State.notaryMinPStake = 0n;
            lastDataFetch = now;
        }
    } catch (e) {
        console.error("Notary Data Error:", e);
    }
}

// ============================================================================
// 10. EXPORT
// ============================================================================

export const NotaryPage = {
    render: async (isActive) => {
        if (!isActive) return;
        renderLayout();
        await loadNotaryData();
        if (State.isConnected) await loadUserData();
        updateInterface();
    },

    reset: () => {
        currentFile = null;
        descriptionCache = "";
        renderStep(1);
    },

    update: () => {
        updateInterface();
    },

    refreshHistory: () => {
        fetchHistory();
    },

    addToWallet: (tokenId) => {
        if (State.decentralizedNotaryContract) {
            addNftToWallet(State.decentralizedNotaryContract.target, tokenId);
        } else {
            showToast("Contract not loaded", "error");
        }
    }
};

window.NotaryPage = NotaryPage;