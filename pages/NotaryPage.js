// js/pages/NotaryPage.js
// ✅ VERSION V8.4: Fixed image preview - always try to load from IPFS, multiple gateway fallback

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js';
import { executeNotarizeDocument } from '../modules/transactions.js';
import { showToast, addNftToWallet } from '../ui-feedback.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB - Any file type allowed
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// File type configurations
const FILE_TYPES = {
    image: { icon: 'fa-regular fa-image', color: 'text-green-400', bg: 'bg-green-500/10' },
    pdf: { icon: 'fa-regular fa-file-pdf', color: 'text-red-400', bg: 'bg-red-500/10' },
    audio: { icon: 'fa-solid fa-music', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    video: { icon: 'fa-regular fa-file-video', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    document: { icon: 'fa-regular fa-file-word', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    spreadsheet: { icon: 'fa-regular fa-file-excel', color: 'text-green-400', bg: 'bg-green-500/10' },
    code: { icon: 'fa-solid fa-code', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    archive: { icon: 'fa-regular fa-file-zipper', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    default: { icon: 'fa-regular fa-file', color: 'text-amber-400', bg: 'bg-amber-500/10' }
};

// ============================================================================
// STATE
// ============================================================================
const Notary = {
    step: 1,
    file: null,
    description: '',
    hash: null,
    isProcessing: false,
    certificates: [],
    lastFetch: 0
};

// ============================================================================
// STYLES
// ============================================================================
const injectStyles = () => {
    if (document.getElementById('notary-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notary-styles';
    style.textContent = `
        .notary-dropzone {
            border: 2px dashed #3f3f46;
            transition: all 0.2s ease;
        }
        .notary-dropzone.drag-over {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.05);
        }
        .notary-dropzone:hover {
            border-color: #52525b;
        }
        .step-dot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .step-dot.pending {
            background: #27272a;
            color: #71717a;
            border: 2px solid #3f3f46;
        }
        .step-dot.active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
        }
        .step-dot.done {
            background: #10b981;
            color: #fff;
        }
        .step-line {
            height: 2px;
            flex: 1;
            background: #3f3f46;
            transition: background 0.3s ease;
        }
        .step-line.active {
            background: linear-gradient(90deg, #10b981, #f59e0b);
        }
        .step-line.done {
            background: #10b981;
        }
        @keyframes scanPulse {
            0%, 100% { opacity: 0.5; transform: scaleY(1); }
            50% { opacity: 1; transform: scaleY(1.5); }
        }
        .scan-line {
            animation: scanPulse 1.5s ease-in-out infinite;
        }
        .cert-card {
            transition: all 0.2s ease;
        }
        .cert-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
    `;
    document.head.appendChild(style);
};

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    const container = document.getElementById('notary');
    if (!container) return;
    
    injectStyles();
    
    container.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10">
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 flex items-center justify-center">
                            <img src="./assets/notary.png" alt="Notary" class="w-full h-full object-contain drop-shadow-lg">
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">Decentralized Notary</h1>
                            <p id="mobile-status" class="text-[10px] text-zinc-500">Blockchain Certification</p>
                        </div>
                    </div>
                    <div id="mobile-badge" class="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500">
                        --
                    </div>
                </div>
            </header>

            <!-- DESKTOP HEADER -->
            <div class="hidden md:flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 flex items-center justify-center">
                        <img src="./assets/notary.png" alt="Notary" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Decentralized Notary</h1>
                        <p class="text-sm text-zinc-500">Permanent blockchain certification</p>
                    </div>
                </div>
                <div id="desktop-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm">
                    <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                    <span class="text-zinc-400">Checking...</span>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="mt-4 md:mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- LEFT: Action Panel -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Progress Steps -->
                    <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex flex-col items-center">
                                <div id="step-1" class="step-dot active">1</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Upload</span>
                            </div>
                            <div id="line-1" class="step-line mx-2"></div>
                            <div class="flex flex-col items-center">
                                <div id="step-2" class="step-dot pending">2</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Details</span>
                            </div>
                            <div id="line-2" class="step-line mx-2"></div>
                            <div class="flex flex-col items-center">
                                <div id="step-3" class="step-dot pending">3</div>
                                <span class="text-[10px] text-zinc-500 mt-1">Mint</span>
                            </div>
                        </div>
                    </div>

                    <!-- Dynamic Content -->
                    <div id="action-panel" class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 min-h-[320px]">
                        <!-- Step content renders here -->
                    </div>
                </div>

                <!-- RIGHT: Info Sidebar -->
                <div class="space-y-4">
                    
                    <!-- Cost Card -->
                    <div class="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border border-amber-500/20 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fa-solid fa-coins text-amber-400"></i>
                            <span class="text-xs font-bold text-zinc-300">Service Cost</span>
                        </div>
                        <div id="cost-display" class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-zinc-500 text-sm">Fee</span>
                                <span id="fee-amount" class="text-white font-mono font-bold">-- BKC</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-zinc-700/50">
                                <span class="text-zinc-500 text-sm">Your Balance</span>
                                <span id="user-balance" class="font-mono font-bold">-- BKC</span>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-blue-400"></i> How It Works
                        </h3>
                        <div class="space-y-3">
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">1</span>
                                </div>
                                <p class="text-xs text-zinc-400">Upload any document (max 4MB)</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">2</span>
                                </div>
                                <p class="text-xs text-zinc-400">Add description for your records</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-[10px] font-bold">3</span>
                                </div>
                                <p class="text-xs text-zinc-400">Sign & mint NFT certificate</p>
                            </div>
                            <div class="flex items-start gap-3 pt-2 border-t border-zinc-800/50">
                                <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-check text-green-400 text-[10px]"></i>
                                </div>
                                <p class="text-xs text-zinc-400">Hash stored permanently on-chain</p>
                            </div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-center">
                            <i class="fa-solid fa-shield-halved text-green-400 text-lg mb-1"></i>
                            <p class="text-[10px] text-zinc-500">Tamper-Proof</p>
                        </div>
                        <div class="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-center">
                            <i class="fa-solid fa-infinity text-yellow-400 text-lg mb-1"></i>
                            <p class="text-[10px] text-zinc-500">Permanent</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CERTIFICATES HISTORY -->
            <div class="mt-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-amber-400"></i>
                        Your Certificates
                    </h2>
                    <button id="btn-refresh" class="text-xs text-amber-400 hover:text-white transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                <div id="certificates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full text-center py-8 text-zinc-600">
                        <div class="w-16 h-16 mx-auto mb-3 relative">
                            <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                            <div class="relative w-full h-full rounded-full bg-zinc-800 flex items-center justify-center p-2">
                                <img src="./assets/notary.png" alt="Loading" class="w-full h-full object-contain opacity-60 animate-pulse">
                            </div>
                        </div>
                        <p class="text-zinc-500 text-sm">Loading certificates...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Processing Overlay -->
        <div id="processing-overlay" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/95 backdrop-blur-sm">
            <div class="text-center p-6 max-w-sm">
                <div class="w-28 h-28 mx-auto mb-6 relative">
                    <!-- Outer spinning ring -->
                    <div class="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                    <!-- Pulse glow -->
                    <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <!-- Notary Image container -->
                    <div class="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 overflow-hidden border-2 border-amber-500/30 p-3">
                        <img src="./assets/notary.png" alt="Notarizing" class="w-full h-full object-contain drop-shadow-lg">
                    </div>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">Notarizing Document</h3>
                <p id="process-status" class="text-amber-400 text-sm font-mono mb-4">PREPARING...</p>
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div id="process-bar" class="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <p class="text-[10px] text-zinc-600 mt-3">Do not close this window</p>
            </div>
        </div>
    `;

    // Initial render
    updateStatusBadges();
    renderStepContent();
    loadCertificates();
    attachGlobalListeners();
}

// ============================================================================
// STATUS BADGES
// ============================================================================
function updateStatusBadges() {
    const mobileBadge = document.getElementById('mobile-badge');
    const desktopBadge = document.getElementById('desktop-badge');
    const feeEl = document.getElementById('fee-amount');
    const balanceEl = document.getElementById('user-balance');
    
    const fee = State.notaryFee || ethers.parseEther("1");
    const balance = State.currentUserBalance || 0n;
    const hasBalance = balance >= fee;
    const isOnline = State.isConnected;

    // Fee display
    if (feeEl) feeEl.textContent = `${formatBigNumber(fee)} BKC`;
    if (balanceEl) {
        balanceEl.textContent = `${formatBigNumber(balance)} BKC`;
        balanceEl.className = `font-mono font-bold ${hasBalance ? 'text-green-400' : 'text-red-400'}`;
    }

    // Badges
    if (isOnline) {
        if (hasBalance) {
            if (mobileBadge) {
                mobileBadge.className = 'text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400';
                mobileBadge.textContent = 'Ready';
            }
            if (desktopBadge) {
                desktopBadge.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-green-400">Ready to Notarize</span>
                `;
                desktopBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm';
            }
        } else {
            if (mobileBadge) {
                mobileBadge.className = 'text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400';
                mobileBadge.textContent = 'Low Balance';
            }
            if (desktopBadge) {
                desktopBadge.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `;
                desktopBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm';
            }
        }
    } else {
        if (mobileBadge) {
            mobileBadge.className = 'text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500';
            mobileBadge.textContent = 'Disconnected';
        }
        if (desktopBadge) {
            desktopBadge.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `;
            desktopBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-sm';
        }
    }
}

// ============================================================================
// STEP INDICATOR UPDATE
// ============================================================================
function updateStepIndicators() {
    [1, 2, 3].forEach(i => {
        const dot = document.getElementById(`step-${i}`);
        if (!dot) return;
        
        if (i < Notary.step) {
            dot.className = 'step-dot done';
            dot.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
        } else if (i === Notary.step) {
            dot.className = 'step-dot active';
            dot.textContent = i;
        } else {
            dot.className = 'step-dot pending';
            dot.textContent = i;
        }
    });

    const line1 = document.getElementById('line-1');
    const line2 = document.getElementById('line-2');
    
    if (line1) line1.className = `step-line mx-2 ${Notary.step > 1 ? 'done' : ''}`;
    if (line2) line2.className = `step-line mx-2 ${Notary.step > 2 ? 'done' : ''}`;
}

// ============================================================================
// STEP CONTENT RENDER
// ============================================================================
function renderStepContent() {
    const panel = document.getElementById('action-panel');
    if (!panel) return;

    updateStepIndicators();

    // Check requirements first
    if (!State.isConnected) {
        panel.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-2xl text-zinc-500"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Connect Wallet</h3>
                <p class="text-zinc-500 text-sm mb-4 text-center">Connect your wallet to start notarizing documents</p>
                <button onclick="window.openConnectModal && window.openConnectModal()" 
                    class="bg-amber-500 hover:bg-amber-400 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                    Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    const fee = State.notaryFee || ethers.parseEther("1");
    const balance = State.currentUserBalance || 0n;
    
    if (balance < fee) {
        panel.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-8">
                <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-2xl text-red-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center">You need at least <span class="text-amber-400 font-bold">${formatBigNumber(fee)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs mt-2">Current: ${formatBigNumber(balance)} BKC</p>
            </div>
        `;
        return;
    }

    // Render current step
    switch (Notary.step) {
        case 1:
            renderStep1(panel);
            break;
        case 2:
            renderStep2(panel);
            break;
        case 3:
            renderStep3(panel);
            break;
    }
}

// ============================================================================
// STEP 1: FILE UPLOAD
// ============================================================================
function renderStep1(panel) {
    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <h3 class="text-lg font-bold text-white mb-2">Upload Document</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Select any file to certify on the blockchain</p>
            
            <div id="dropzone" class="notary-dropzone w-full max-w-md rounded-xl p-8 cursor-pointer text-center">
                <input type="file" id="file-input" class="hidden">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up text-2xl text-amber-400"></i>
                </div>
                <p class="text-white font-medium mb-1">Click or drag file here</p>
                <p class="text-[10px] text-zinc-600">Max 4MB • Any format</p>
            </div>

            <div class="flex items-center gap-4 mt-6 text-[10px] text-zinc-600">
                <span><i class="fa-solid fa-lock mr-1"></i> Encrypted upload</span>
                <span><i class="fa-solid fa-shield mr-1"></i> IPFS storage</span>
            </div>
        </div>
    `;

    initDropzone();
}

function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    if (!dropzone || !fileInput) return;

    dropzone.onclick = () => fileInput.click();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        dropzone.addEventListener(e, ev => {
            ev.preventDefault();
            ev.stopPropagation();
        });
    });

    dropzone.addEventListener('dragenter', () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragover', () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
        dropzone.classList.remove('drag-over');
        handleFileSelect(e.dataTransfer?.files?.[0]);
    });

    fileInput.addEventListener('change', e => handleFileSelect(e.target.files?.[0]));
}

function handleFileSelect(file) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 4MB)', 'error');
        return;
    }

    Notary.file = file;
    Notary.step = 2;
    renderStepContent();
}

// ============================================================================
// STEP 2: DETAILS
// ============================================================================
function renderStep2(panel) {
    const file = Notary.file;
    const fileSize = file ? (file.size / 1024).toFixed(1) : '0';
    const fileIcon = getFileIcon(file?.type || '');

    panel.innerHTML = `
        <div class="max-w-md mx-auto">
            <h3 class="text-lg font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <!-- File Preview -->
            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${fileIcon} text-xl text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate">${file?.name || 'Unknown'}</p>
                        <p class="text-[10px] text-zinc-500">${fileSize} KB</p>
                    </div>
                    <button id="btn-remove" class="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-trash text-red-400 text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- Description Input -->
            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-zinc-600 resize-none"
                    placeholder="E.g., Property deed signed on Jan 2025...">${Notary.description}</textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-next" class="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors">
                    Continue <i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-remove')?.addEventListener('click', () => {
        Notary.file = null;
        Notary.description = '';
        Notary.step = 1;
        renderStepContent();
    });

    document.getElementById('btn-back')?.addEventListener('click', () => {
        Notary.step = 1;
        renderStepContent();
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        const input = document.getElementById('desc-input');
        Notary.description = input?.value || '';
        Notary.step = 3;
        renderStepContent();
    });
}

// Get file type info (icon, color, bg) based on mime type or filename
function getFileTypeInfo(mimeType = '', fileName = '') {
    const mime = mimeType.toLowerCase();
    const name = fileName.toLowerCase();
    
    // Images
    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(name)) {
        return FILE_TYPES.image;
    }
    // PDF
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
        return FILE_TYPES.pdf;
    }
    // Audio
    if (mime.includes('audio') || /\.(mp3|wav|ogg|flac|aac|m4a)$/.test(name)) {
        return FILE_TYPES.audio;
    }
    // Video
    if (mime.includes('video') || /\.(mp4|avi|mov|mkv|webm|wmv)$/.test(name)) {
        return FILE_TYPES.video;
    }
    // Documents
    if (mime.includes('word') || mime.includes('document') || /\.(doc|docx|odt|rtf)$/.test(name)) {
        return FILE_TYPES.document;
    }
    // Spreadsheets
    if (mime.includes('sheet') || mime.includes('excel') || /\.(xls|xlsx|csv|ods)$/.test(name)) {
        return FILE_TYPES.spreadsheet;
    }
    // Code/Programming
    if (/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(name)) {
        return FILE_TYPES.code;
    }
    // Archives
    if (mime.includes('zip') || mime.includes('archive') || /\.(zip|rar|7z|tar|gz)$/.test(name)) {
        return FILE_TYPES.archive;
    }
    
    return FILE_TYPES.default;
}

// Legacy function for backwards compatibility
function getFileIcon(mimeType) {
    return getFileTypeInfo(mimeType).icon;
}

// ============================================================================
// STEP 3: CONFIRM & MINT
// ============================================================================
function renderStep3(panel) {
    const file = Notary.file;
    const desc = Notary.description || 'No description';
    const fee = State.notaryFee || ethers.parseEther("1");

    panel.innerHTML = `
        <div class="max-w-md mx-auto text-center">
            <h3 class="text-lg font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your certificate</p>

            <!-- Summary Card -->
            <div class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4 text-left">
                <div class="flex items-center gap-3 pb-3 border-b border-zinc-700/50 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="${getFileIcon(file?.type || '')} text-amber-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate text-sm">${file?.name}</p>
                        <p class="text-[10px] text-zinc-500">${(file?.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-xs text-zinc-400 italic">"${desc}"</p>
            </div>

            <!-- Cost Summary -->
            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400 text-sm">Total Cost</span>
                    <span class="text-amber-400 font-bold">${formatBigNumber(fee)} BKC</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button id="btn-back" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button id="btn-mint" class="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-bold rounded-xl transition-all">
                    <i class="fa-solid fa-stamp mr-2"></i> Sign & Mint
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-back')?.addEventListener('click', () => {
        Notary.step = 2;
        renderStepContent();
    });

    document.getElementById('btn-mint')?.addEventListener('click', handleMint);
}

// ============================================================================
// MINT PROCESS
// ============================================================================
async function handleMint() {
    if (Notary.isProcessing) return;
    Notary.isProcessing = true;

    const btn = document.getElementById('btn-mint');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Signing...';
    }

    const overlay = document.getElementById('processing-overlay');
    const statusEl = document.getElementById('process-status');
    const barEl = document.getElementById('process-bar');

    const setProgress = (percent, text) => {
        if (barEl) barEl.style.width = `${percent}%`;
        if (statusEl) statusEl.textContent = text;
    };

    try {
        // Sign authentication message
        const signer = await State.provider.getSigner();
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        const signature = await signer.signMessage(message);

        // Show overlay
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        setProgress(10, 'UPLOADING TO IPFS...');

        // V7.4: Upload to IPFS with description
        const formData = new FormData();
        formData.append('file', Notary.file);
        formData.append('signature', signature);
        formData.append('address', State.userAddress);
        formData.append('description', Notary.description || 'No description');

        const uploadUrl = API_ENDPOINTS.uploadFileToIPFS || "/api/upload";
        const res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(180000)
        });

        if (!res.ok) {
            // Handle specific error codes
            if (res.status === 413) {
                throw new Error('File too large. Maximum size is 4MB.');
            } else if (res.status === 401) {
                throw new Error('Signature verification failed. Please try again.');
            } else if (res.status === 500) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || 'Server error during upload.');
            }
            throw new Error(`Upload failed (${res.status})`);
        }
        const data = await res.json();
        
        console.log('📤 Upload response:', data);

        // V7.4: Use ipfsUri for the image CID (what goes to contract)
        // contentHash is the SHA-256 of the file
        const ipfsCid = data.ipfsUri || data.metadataUri;
        const contentHash = data.contentHash;
        
        if (!ipfsCid) throw new Error('No IPFS URI returned');
        if (!contentHash) throw new Error('No content hash returned');

        setProgress(50, 'MINTING ON BLOCKCHAIN...');

        // Execute mint - pass the image IPFS URI and content hash
        const success = await executeNotarizeDocument(
            ipfsCid,
            Notary.description || 'No description',
            contentHash,
            0n,
            btn
        );

        if (success) {
            setProgress(100, 'SUCCESS!');
            
            // Show success animation in overlay
            if (overlay) {
                overlay.innerHTML = `
                    <div class="text-center p-6 max-w-sm animate-fade-in">
                        <div class="w-32 h-32 mx-auto mb-6 relative">
                            <!-- Success glow -->
                            <div class="absolute inset-0 rounded-full bg-green-500/30 animate-pulse"></div>
                            <!-- Confetti effect -->
                            <div class="absolute inset-0 rounded-full border-4 border-green-400/50"></div>
                            <!-- Image container -->
                            <div class="relative w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-emerald-900/50 flex items-center justify-center shadow-2xl shadow-green-500/30 overflow-hidden p-3 border-2 border-green-400">
                                <img src="./assets/notary.png" alt="Success" class="w-full h-full object-contain drop-shadow-lg">
                            </div>
                            <!-- Checkmark badge -->
                            <div class="absolute -bottom-1 -right-1 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <i class="fa-solid fa-check text-white text-lg"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">🎉 Notarized!</h3>
                        <p class="text-green-400 text-sm mb-4">Your document is now permanently certified on the blockchain</p>
                        <div class="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                            <i class="fa-solid fa-shield-check text-green-400"></i>
                            <span>Immutable • Verifiable • Permanent</span>
                        </div>
                    </div>
                `;
            }
            
            setTimeout(() => {
                if (overlay) {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }
                
                // Reset state
                Notary.file = null;
                Notary.description = '';
                Notary.step = 1;
                Notary.isProcessing = false;
                
                renderStepContent();
                loadCertificates();
                loadUserData(true);
                
                showToast('🎉 Document notarized successfully!', 'success');
            }, 3000); // Extended to 3s to show success animation
        } else {
            throw new Error('Minting failed');
        }

    } catch (e) {
        console.error('Notary Error:', e);
        
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i> Sign & Mint';
        }
        
        Notary.isProcessing = false;
        showToast(e.message || 'Notarization failed', 'error');
    }
}

// ============================================================================
// CERTIFICATES HISTORY
// ============================================================================
async function loadCertificates() {
    const grid = document.getElementById('certificates-grid');
    if (!grid) return;

    if (!State.isConnected) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-zinc-500 text-sm">Connect wallet to view certificates</p>
            </div>
        `;
        return;
    }

    try {
        // V7.4: First try to fetch from API (Firebase)
        let certs = [];
        
        try {
            const apiUrl = API_ENDPOINTS.getNotarizedDocuments || 
                `https://us-central1-backchain-415921.cloudfunctions.net/getNotarizedDocuments/${State.userAddress}`;
            
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    certs = data.map(doc => ({
                        id: doc.tokenId || '?',
                        ipfs: doc.ipfsCid || '',
                        description: doc.description || '',
                        hash: doc.contentHash || '',
                        timestamp: doc.timestamp || '',
                        txHash: doc.txHash || ''
                    }));
                    console.log(`📜 Loaded ${certs.length} certificates from API`);
                }
            }
        } catch (apiErr) {
            console.warn('API fetch failed, falling back to contract:', apiErr.message?.slice(0, 50));
        }
        
        // Fallback: Query contract events if API returned nothing
        if (certs.length === 0) {
            if (!State.decentralizedNotaryContract) await loadPublicData();
            const contract = State.decentralizedNotaryContract;
            
            if (!contract) {
                grid.innerHTML = `<div class="col-span-full text-center py-8 text-zinc-500 text-sm">Contract not available</div>`;
                return;
            }

            let events = [];
            try {
                const filter = contract.filters.DocumentNotarized 
                    ? contract.filters.DocumentNotarized(null, State.userAddress)
                    : contract.filters.NotarizationEvent?.(null, State.userAddress);
                
                if (filter) {
                    events = await contract.queryFilter(filter, -50000);
                }
            } catch (filterErr) {
                console.warn('Event filter error:', filterErr.message?.slice(0, 100));
                try {
                    const balance = await contract.balanceOf(State.userAddress);
                    if (balance > 0n) {
                        for (let i = 0n; i < balance; i++) {
                            try {
                                const tokenId = await contract.tokenOfOwnerByIndex(State.userAddress, i);
                                events.push({ args: [tokenId], transactionHash: null });
                            } catch (e) { break; }
                        }
                    }
                } catch (balErr) {
                    console.warn('Balance fallback failed:', balErr);
                }
            }

            // Fetch certificate details from tokenURI (always works)
            certs = await Promise.all(events.map(async (e) => {
                const tokenId = e.args[0];
                let ipfsCid = '';
                let description = '';
                let contentHash = '';
                
                try {
                    // Use tokenURI which is always available in ERC721
                    if (typeof contract.tokenURI === 'function') {
                        const uri = await contract.tokenURI(tokenId);
                        if (uri && uri.startsWith('data:application/json;base64,')) {
                            const base64Data = uri.replace('data:application/json;base64,', '');
                            const jsonStr = atob(base64Data);
                            const metadata = JSON.parse(jsonStr);
                            
                            ipfsCid = metadata.image || '';
                            description = metadata.description || '';
                            
                            // Debug: log the full metadata
                            console.log(`📜 Certificate #${tokenId} metadata:`, {
                                image: ipfsCid?.slice(0, 50),
                                description: description?.slice(0, 50)
                            });
                            
                            // Extract content hash from attributes if available
                            if (metadata.attributes) {
                                const hashAttr = metadata.attributes.find(a => a.trait_type === 'Content Hash');
                                if (hashAttr) contentHash = hashAttr.value || 'SHA-256';
                            }
                            
                            console.log(`📜 Certificate #${tokenId} from tokenURI: ${description?.slice(0,30)}...`);
                        }
                    }
                } catch (err) {
                    console.warn('tokenURI error for token', tokenId?.toString(), err.message?.slice(0, 50));
                }

                return {
                    id: tokenId?.toString() || '?',
                    ipfs: ipfsCid,
                    description: description,
                    hash: contentHash,
                    txHash: e.transactionHash || ''
                };
            }));
        }

        if (certs.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-certificate text-xl text-zinc-600"></i>
                    </div>
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;
            return;
        }

        // Sort by ID descending (newest first)
        const sorted = certs.sort((a, b) => parseInt(b.id) - parseInt(a.id));

        grid.innerHTML = sorted.map(cert => {
            // Build IPFS URL with fallback gateways
            let ipfsUrl = '';
            const ipfsData = cert.ipfs || '';
            
            if (ipfsData.startsWith('ipfs://')) {
                const cid = ipfsData.replace('ipfs://', '');
                ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
            } else if (ipfsData.startsWith('https://')) {
                ipfsUrl = ipfsData;
            } else if (ipfsData.length > 0) {
                // Assume it's just the CID
                ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsData}`;
            }
            
            // Alternative gateways for fallback
            const altIpfsUrl = ipfsUrl.replace('gateway.pinata.cloud', 'ipfs.io');
            const alt2IpfsUrl = ipfsUrl.replace('gateway.pinata.cloud', 'cloudflare-ipfs.com');
            
            // Clean description (remove "--- Verified by Backchain Protocol..." suffix)
            let cleanDesc = cert.description || '';
            cleanDesc = cleanDesc.split('---')[0].trim() || cleanDesc;
            cleanDesc = cleanDesc.split('\n')[0].trim() || 'Notarized Document';
            
            // Detect file type from ipfs data or description
            const fileInfo = getFileTypeInfo('', cleanDesc);
            
            // Always try to show image if we have ipfsUrl (use onerror fallback)
            const hasValidUrl = ipfsUrl && ipfsUrl.length > 10;

            return `
                <div class="cert-card bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                    <!-- Preview -->
                    <div class="h-28 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${hasValidUrl ? `
                            <img src="${ipfsUrl}" 
                                 class="absolute inset-0 w-full h-full object-cover"
                                 onerror="
                                    if(!this.dataset.retry){
                                        this.dataset.retry='1';
                                        this.src='${altIpfsUrl}';
                                    } else if(this.dataset.retry==='1'){
                                        this.dataset.retry='2';
                                        this.src='${alt2IpfsUrl}';
                                    } else {
                                        this.style.display='none';
                                        this.nextElementSibling.style.display='flex';
                                    }
                                 ">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-12 h-12 rounded-xl ${fileInfo.bg} flex items-center justify-center mb-1">
                                    <i class="${fileInfo.icon} text-2xl ${fileInfo.color}"></i>
                                </div>
                                <span class="text-[9px] text-zinc-600">File stored on IPFS</span>
                            </div>
                        ` : `
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-14 h-14 rounded-xl ${fileInfo.bg} flex items-center justify-center mb-2">
                                    <i class="${fileInfo.icon} text-2xl ${fileInfo.color}"></i>
                                </div>
                                <span class="text-[9px] text-zinc-600 uppercase tracking-wider">CERTIFIED</span>
                            </div>
                        `}
                        <span class="absolute top-2 right-2 text-[9px] font-mono text-zinc-400 bg-black/70 px-2 py-0.5 rounded-full">#${cert.id}</span>
                    </div>
                    
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-xs text-white font-medium truncate mb-1" title="${cleanDesc}">
                            ${cleanDesc || 'Notarized Document'}
                        </p>
                        <p class="text-[9px] font-mono text-zinc-600 truncate mb-3" title="${cert.hash}">
                            SHA-256: ${cert.hash?.slice(0, 16) || '...'}...
                        </p>
                        
                        <!-- Actions -->
                        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                            <div class="flex gap-3">
                                ${ipfsUrl ? `
                                    <a href="${ipfsUrl}" target="_blank" 
                                       class="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1">
                                        <i class="fa-solid fa-download"></i> Download
                                    </a>
                                ` : `
                                    <span class="text-[10px] text-zinc-600">No file</span>
                                `}
                                <button onclick="NotaryPage.addToWallet('${cert.id}')" 
                                    class="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                                    <i class="fa-solid fa-wallet"></i> Wallet
                                </button>
                            </div>
                            ${cert.txHash ? `
                                <a href="${EXPLORER_TX}${cert.txHash}" target="_blank" 
                                   class="text-zinc-600 hover:text-white transition-colors" title="View on Explorer">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('History Error:', e);
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i> Failed to load</p>
                <p class="text-zinc-600 text-xs mt-1">${e.message?.slice(0, 50) || 'Unknown error'}</p>
            </div>
        `;
    }
}

// ============================================================================
// GLOBAL LISTENERS
// ============================================================================
function attachGlobalListeners() {
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-refresh');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Loading...';
        await loadCertificates();
        if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh';
    });
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadNotaryData() {
    const now = Date.now();
    if (now - Notary.lastFetch < 30000 && State.notaryFee > 0n) return;

    try {
        const hub = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        if (!hub) await loadPublicData();

        // V2.1: Use getFee
        const key = ethers.id("NOTARY_SERVICE");
        const fee = await safeContractCall(hub || State.ecosystemManagerContractPublic, 'getFee', [key], 0n);

        if (fee > 0n) {
            State.notaryFee = fee;
            Notary.lastFetch = now;
        }
    } catch (e) {
        console.warn('Notary data error:', e);
    }
}

// ============================================================================
// EXPORT
// ============================================================================
export const NotaryPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
        await loadNotaryData();
        if (State.isConnected) await loadUserData();
        updateStatusBadges();
        renderStepContent();
    },

    reset() {
        Notary.file = null;
        Notary.description = '';
        Notary.step = 1;
        renderStepContent();
    },

    update() {
        updateStatusBadges();
        if (!Notary.isProcessing) renderStepContent();
    },

    refreshHistory() {
        loadCertificates();
    },

    addToWallet(tokenId) {
        if (State.decentralizedNotaryContract) {
            addNftToWallet(State.decentralizedNotaryContract.target, tokenId);
        } else {
            showToast('Contract not loaded', 'error');
        }
    }
};

window.NotaryPage = NotaryPage;