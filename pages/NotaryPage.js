// js/pages/NotaryPage.js
// ✅ PRODUCTION V10.0 - Migrated to Transaction Engine (NotaryTx)
//
// V10.0 Changes:
// - Migrated to use NotaryTx module from transaction engine
// - Automatic token approval and validation
// - Better error handling with onSuccess/onError callbacks
//
// V9.2: Firebase-based History + Date/Time Display

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';

// V10: Import new transaction module
import { NotaryTx } from '../modules/transactions/index.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (Pinata Free limit)
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
const NOTARY_IMAGE = "./assets/notary.png";

// ✅ Função para formatar data/hora
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    let date;
    if (typeof timestamp === 'number') {
        date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else if (timestamp?.toDate) {
        date = timestamp.toDate();
    } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
        if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
    }
    
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

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
    if (document.getElementById('notary-styles-v9')) return;
    
    const style = document.createElement('style');
    style.id = 'notary-styles-v9';
    style.textContent = `
        /* Notary Image Animations */
        @keyframes notary-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes notary-pulse {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(245,158,11,0.3)); }
            50% { filter: drop-shadow(0 0 30px rgba(245,158,11,0.6)); }
        }
        @keyframes notary-stamp {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-5deg); }
            50% { transform: scale(0.9) rotate(5deg); }
            75% { transform: scale(1.1) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes notary-success {
            0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
            50% { transform: scale(1.2); filter: drop-shadow(0 0 50px rgba(16,185,129,0.9)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
        }
        @keyframes notary-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        .notary-float { animation: notary-float 4s ease-in-out infinite; }
        .notary-pulse { animation: notary-pulse 2s ease-in-out infinite; }
        .notary-stamp { animation: notary-stamp 0.6s ease-out; }
        .notary-success { animation: notary-success 1s ease-out; }
        .notary-spin { animation: notary-spin 1.5s ease-in-out; }
        
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
                            <img src="${NOTARY_IMAGE}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot-mobile">
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">📜 Decentralized Notary</h1>
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
                        <img src="${NOTARY_IMAGE}" alt="Notary" class="w-full h-full object-contain notary-float notary-pulse" id="notary-mascot">
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">📜 Decentralized Notary</h1>
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
                                <p class="text-xs text-zinc-400">Upload any document (max 5MB)</p>
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
                                <img src="${NOTARY_IMAGE}" alt="Loading" class="w-full h-full object-contain opacity-60 animate-pulse">
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
                    <div class="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                    <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <div class="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 overflow-hidden border-2 border-amber-500/30 p-3">
                        <img src="${NOTARY_IMAGE}" alt="Notarizing" class="w-full h-full object-contain notary-spin" id="notary-overlay-img">
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
    const balEl = document.getElementById('user-balance');

    const fee = State.notaryFee || 0n;
    const balance = State.currentUserBalance || 0n;

    if (feeEl) feeEl.textContent = `${formatBigNumber(fee)} BKC`;
    if (balEl) {
        balEl.textContent = `${formatBigNumber(balance)} BKC`;
        balEl.className = `font-mono font-bold ${balance >= fee ? 'text-green-400' : 'text-red-400'}`;
    }

    if (State.isConnected) {
        if (balance >= fee) {
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
    updateMascotAnimation(Notary.step);

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

    switch (Notary.step) {
        case 1: renderStep1(panel); break;
        case 2: renderStep2(panel); break;
        case 3: renderStep3(panel); break;
    }
}

function updateMascotAnimation(step) {
    const mascot = document.getElementById('notary-mascot');
    const mascotMobile = document.getElementById('notary-mascot-mobile');
    
    [mascot, mascotMobile].forEach(m => {
        if (!m) return;
        m.className = 'w-full h-full object-contain';
        
        switch (step) {
            case 1: m.classList.add('notary-float', 'notary-pulse'); break;
            case 2: m.classList.add('notary-float'); break;
            case 3: m.classList.add('notary-pulse'); break;
        }
    });
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
                <p class="text-[10px] text-zinc-600">Max 5MB • Any format</p>
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
        showToast('File too large (max 5MB)', 'error');
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

            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-zinc-600 resize-none"
                    placeholder="E.g., Property deed signed on Jan 2025...">${Notary.description}</textarea>
            </div>

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

function getFileTypeInfo(mimeType = '', fileName = '') {
    const mime = mimeType.toLowerCase();
    const name = fileName.toLowerCase();
    
    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(name)) return FILE_TYPES.image;
    if (mime.includes('pdf') || name.endsWith('.pdf')) return FILE_TYPES.pdf;
    if (mime.includes('audio') || /\.(mp3|wav|ogg|flac|aac|m4a)$/.test(name)) return FILE_TYPES.audio;
    if (mime.includes('video') || /\.(mp4|avi|mov|mkv|webm|wmv)$/.test(name)) return FILE_TYPES.video;
    if (mime.includes('word') || mime.includes('document') || /\.(doc|docx|odt|rtf)$/.test(name)) return FILE_TYPES.document;
    if (mime.includes('sheet') || mime.includes('excel') || /\.(xls|xlsx|csv|ods)$/.test(name)) return FILE_TYPES.spreadsheet;
    if (/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(name)) return FILE_TYPES.code;
    if (mime.includes('zip') || mime.includes('archive') || /\.(zip|rar|7z|tar|gz)$/.test(name)) return FILE_TYPES.archive;
    
    return FILE_TYPES.default;
}

function getFileIcon(mimeType) {
    return getFileTypeInfo(mimeType).icon;
}

function getFileCategory(mimeType = '') {
    const mime = mimeType.toLowerCase();
    if (mime.includes('image')) return 'image';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('audio')) return 'audio';
    if (mime.includes('video')) return 'video';
    if (mime.includes('word') || mime.includes('document')) return 'document';
    if (mime.includes('sheet') || mime.includes('excel')) return 'spreadsheet';
    if (mime.includes('zip') || mime.includes('archive')) return 'archive';
    return 'document';
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

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400 text-sm">Total Cost</span>
                    <span class="text-amber-400 font-bold">${formatBigNumber(fee)} BKC</span>
                </div>
            </div>

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
    const overlayImg = document.getElementById('notary-overlay-img');

    const setProgress = (percent, text) => {
        if (barEl) barEl.style.width = `${percent}%`;
        if (statusEl) statusEl.textContent = text;
    };

    try {
        const signer = await State.provider.getSigner();
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        const signature = await signer.signMessage(message);

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        setProgress(10, 'UPLOADING TO IPFS...');

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
            if (res.status === 413) throw new Error('File too large. Maximum size is 5MB.');
            if (res.status === 401) throw new Error('Signature verification failed. Please try again.');
            if (res.status === 500) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || 'Server error during upload.');
            }
            throw new Error(`Upload failed (${res.status})`);
        }
        const data = await res.json();

        const ipfsCid = data.ipfsUri || data.metadataUri;
        const contentHash = data.contentHash;
        
        if (!ipfsCid) throw new Error('No IPFS URI returned');
        if (!contentHash) throw new Error('No content hash returned');

        setProgress(50, 'MINTING ON BLOCKCHAIN...');

        // Stamp animation
        if (overlayImg) overlayImg.className = 'w-full h-full object-contain notary-stamp';

        // V10: Use NotaryTx.notarize from new transaction module
        await NotaryTx.notarize({
            ipfsUri: ipfsCid,
            contentHash: contentHash,
            title: Notary.file?.name || 'Untitled Document',
            description: Notary.description || 'No description',
            docType: getFileCategory(Notary.file?.type) || 'document',
            tags: [],
            button: btn,
            
            onSuccess: (receipt) => {
                setProgress(100, 'SUCCESS!');
                
                // Success animation
                if (overlayImg) overlayImg.className = 'w-full h-full object-contain notary-success';
                
                if (overlay) {
                    overlay.innerHTML = `
                        <div class="text-center p-6 max-w-sm animate-fade-in">
                            <div class="w-32 h-32 mx-auto mb-6 relative">
                                <div class="absolute inset-0 rounded-full bg-green-500/30 animate-pulse"></div>
                                <div class="absolute inset-0 rounded-full border-4 border-green-400/50"></div>
                                <div class="relative w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-emerald-900/50 flex items-center justify-center shadow-2xl shadow-green-500/30 overflow-hidden p-3 border-2 border-green-400">
                                    <img src="${NOTARY_IMAGE}" alt="Success" class="w-full h-full object-contain notary-success">
                                </div>
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
                    
                    Notary.file = null;
                    Notary.description = '';
                    Notary.step = 1;
                    Notary.isProcessing = false;
                    
                    renderStepContent();
                    loadCertificates();
                    loadUserData(true);
                    
                    showToast('📜 Document notarized successfully!', 'success');
                }, 3000);
            },
            
            onError: (error) => {
                throw error; // Re-throw to be caught by outer catch
            }
        });

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

    // Mostrar loading
    grid.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fa-solid fa-circle-notch fa-spin text-amber-400 text-2xl mb-3"></i>
            <p class="text-zinc-500 text-sm">Loading certificates from database...</p>
        </div>
    `;

    try {
        // ✅ Buscar APENAS do Firebase via API (escalável para 10+ anos)
        const baseUrl = API_ENDPOINTS.getNotarizedDocuments || 
            'https://getnotarizeddocuments-4wvdcuoouq-uc.a.run.app';
        const apiUrl = `${baseUrl}/${State.userAddress}`;
        
        console.log('📜 Fetching certificates from Firebase:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <img src="${NOTARY_IMAGE}" class="w-14 h-14 mx-auto opacity-20 mb-3">
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;
            return;
        }

        // Mapear dados do Firebase
        const certs = data.map(doc => ({
            id: doc.tokenId || '?',
            ipfs: doc.ipfsCid || '',
            description: doc.description || '',
            hash: doc.contentHash || '',
            timestamp: doc.createdAt || doc.timestamp || '',
            txHash: doc.txHash || '',
            blockNumber: doc.blockNumber || 0
        }));

        console.log(`📜 Found ${certs.length} certificates in Firebase`);

        // Já vem ordenado do Firebase, mas garantir ordem por ID decrescente
        const sorted = certs.sort((a, b) => parseInt(b.id) - parseInt(a.id));

        grid.innerHTML = sorted.map(cert => {
            let ipfsUrl = '';
            const ipfsData = cert.ipfs || '';
            
            if (ipfsData.startsWith('ipfs://')) {
                ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsData.replace('ipfs://', '')}`;
            } else if (ipfsData.startsWith('https://')) {
                ipfsUrl = ipfsData;
            } else if (ipfsData.length > 0) {
                ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsData}`;
            }
            
            let cleanDesc = cert.description || '';
            cleanDesc = cleanDesc.split('---')[0].trim() || cleanDesc;
            cleanDesc = cleanDesc.split('\n')[0].trim() || 'Notarized Document';
            
            const fileInfo = getFileTypeInfo('', cleanDesc);
            const hasValidUrl = ipfsUrl && ipfsUrl.length > 10;
            const timeAgo = formatTimestamp(cert.timestamp);

            return `
                <div class="cert-card bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all">
                    <div class="h-28 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${hasValidUrl ? `
                            <img src="${ipfsUrl}" 
                                 class="absolute inset-0 w-full h-full object-cover"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-12 h-12 rounded-xl ${fileInfo.bg} flex items-center justify-center mb-1">
                                    <i class="${fileInfo.icon} text-2xl ${fileInfo.color}"></i>
                                </div>
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
                        ${timeAgo ? `
                            <span class="absolute top-2 left-2 text-[9px] text-zinc-500 bg-black/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i> ${timeAgo}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="p-3">
                        <p class="text-xs text-white font-medium truncate mb-1" title="${cleanDesc}">
                            ${cleanDesc || 'Notarized Document'}
                        </p>
                        <p class="text-[9px] font-mono text-zinc-600 truncate mb-3" title="${cert.hash}">
                            SHA-256: ${cert.hash?.slice(0, 16) || '...'}...
                        </p>
                        
                        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                            <div class="flex gap-3">
                                ${ipfsUrl ? `
                                    <a href="${ipfsUrl}" target="_blank" 
                                       class="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1">
                                        <i class="fa-solid fa-download"></i> Download
                                    </a>
                                ` : `<span class="text-[10px] text-zinc-600">No file</span>`}
                                <button onclick="NotaryPage.addToWallet('${cert.id}', '${ipfsUrl}')" 
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
        console.error('❌ Error loading certificates:', e);
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i> Failed to load certificates</p>
                <p class="text-zinc-600 text-xs mt-1">${e.message}</p>
                <button onclick="loadCertificates()" class="mt-3 text-amber-400 text-xs hover:underline">
                    <i class="fa-solid fa-rotate mr-1"></i> Try Again
                </button>
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
        // Load public data if not loaded
        if (!State.ecosystemManagerContractPublic && !State.ecosystemManagerContract) {
            await loadPublicData();
        }
        
        const hub = State.ecosystemManagerContractPublic || State.ecosystemManagerContract;
        
        if (hub) {
            // V10.1: Try multiple methods to get fee
            let fee = 0n;
            
            try {
                // Method 1: getFee with key
                const key = ethers.id("NOTARY_SERVICE");
                fee = await safeContractCall(hub, 'getFee', [key], 0n);
            } catch (e1) {
                console.warn('getFee with key failed:', e1.message);
                
                try {
                    // Method 2: Direct notaryFee property
                    fee = await safeContractCall(hub, 'notaryFee', [], 0n);
                } catch (e2) {
                    console.warn('notaryFee failed:', e2.message);
                    
                    try {
                        // Method 3: fees mapping
                        const key = ethers.id("NOTARY_SERVICE");
                        fee = await safeContractCall(hub, 'fees', [key], 0n);
                    } catch (e3) {
                        console.warn('fees mapping failed:', e3.message);
                    }
                }
            }

            if (fee > 0n) {
                State.notaryFee = fee;
                console.log('📜 Notary fee loaded:', formatBigNumber(fee), 'BKC');
            } else {
                // Default fee if not found
                State.notaryFee = ethers.parseEther("1");
                console.log('📜 Using default notary fee: 1 BKC');
            }
            
            Notary.lastFetch = now;
        }
        
        // V10.1: Also ensure user balance is loaded
        if (State.isConnected && State.userAddress) {
            try {
                if (State.bkcTokenContract || State.bkcTokenContractPublic) {
                    const token = State.bkcTokenContract || State.bkcTokenContractPublic;
                    const balance = await safeContractCall(token, 'balanceOf', [State.userAddress], 0n);
                    if (balance > 0n) {
                        State.currentUserBalance = balance;
                        console.log('📜 User balance loaded:', formatBigNumber(balance), 'BKC');
                    }
                }
            } catch (e) {
                console.warn('Balance load error:', e.message);
            }
        }
        
        // Update UI after loading
        updateStatusBadges();
        
    } catch (e) {
        console.warn('Notary data error:', e);
        // Set default fee on error
        if (!State.notaryFee || State.notaryFee === 0n) {
            State.notaryFee = ethers.parseEther("1");
        }
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

    async addToWallet(tokenId, imageUrl) {
        try {
            // 🔥 V9.1: Lista de gateways IPFS em ordem de preferência
            // dweb.link e w3s.link são gerenciados pelo Protocol Labs (criadores do IPFS)
            const IPFS_GATEWAYS = [
                'https://dweb.link/ipfs/',
                'https://w3s.link/ipfs/',
                'https://nftstorage.link/ipfs/',
                'https://cloudflare-ipfs.com/ipfs/',
                'https://ipfs.io/ipfs/'
            ];
            
            // Função helper para extrair CID de qualquer URL IPFS
            const extractCid = (url) => {
                if (!url) return '';
                
                if (url.startsWith('ipfs://')) {
                    return url.replace('ipfs://', '').split('?')[0];
                } else if (url.includes('/ipfs/')) {
                    return url.split('/ipfs/')[1].split('?')[0];
                } else if (url.match(/^Qm[a-zA-Z0-9]{44}/) || url.match(/^bafy[a-zA-Z0-9]+/)) {
                    return url;
                }
                return '';
            };
            
            // Converter para HTTPS usando o gateway preferido
            const toHttpsUrl = (url, gatewayIndex = 0) => {
                if (!url) return '';
                
                // Se já é HTTPS de um servidor não-IPFS, retorna como está
                if (url.startsWith('https://') && !url.includes('/ipfs/') && !url.includes('ipfs.io')) {
                    return url;
                }
                
                const cid = extractCid(url);
                if (cid) {
                    return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
                }
                return url;
            };
            
            let finalImageUrl = toHttpsUrl(imageUrl || '');
            console.log('📜 Input imageUrl:', imageUrl);
            console.log('📜 Converted to:', finalImageUrl);
            
            // Buscar do tokenURI para garantir imagem correta
            if (State.decentralizedNotaryContract) {
                try {
                    const uri = await State.decentralizedNotaryContract.tokenURI(tokenId);
                    console.log('📜 TokenURI response:', uri?.slice(0, 200));
                    
                    if (uri && uri.startsWith('data:application/json;base64,')) {
                        const base64Data = uri.replace('data:application/json;base64,', '');
                        const metadata = JSON.parse(atob(base64Data));
                        console.log('📜 Parsed metadata:', JSON.stringify(metadata).slice(0, 300));
                        
                        if (metadata.image) {
                            finalImageUrl = toHttpsUrl(metadata.image);
                            console.log('📜 Image from metadata:', finalImageUrl);
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch tokenURI:', e.message);
                }
            }
            
            console.log('📜 Final image URL for wallet:', finalImageUrl);
            
            const contractAddress = State.decentralizedNotaryContract?.target || 
                                   (State.decentralizedNotaryContract?.getAddress ? await State.decentralizedNotaryContract.getAddress() : null);
            
            if (!contractAddress) {
                showToast('Contract address not found', 'error');
                return;
            }
            
            console.log('📜 Contract address:', contractAddress);
            console.log('📜 Token ID:', tokenId);
            
            showToast('Adding NFT #' + tokenId + ' to wallet...', 'info');
            
            // 🔥 V9.1: Tentar com imagem explícita (funciona em versões recentes da MetaMask)
            try {
                const wasAdded = await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC721',
                        options: {
                            address: contractAddress,
                            tokenId: String(tokenId),
                            // MetaMask experimental: passar imagem diretamente
                            image: finalImageUrl
                        },
                    },
                });
                
                if (wasAdded) {
                    showToast('📜 NFT #' + tokenId + ' added to wallet!', 'success');
                } else {
                    showToast('NFT not added (cancelled)', 'warning');
                }
                return;
            } catch (firstError) {
                console.warn('First attempt with image failed:', firstError.message?.slice(0, 100));
                
                // Se falhou e não foi cancelamento do usuário, tentar sem a imagem
                if (firstError.code !== 4001) {
                    try {
                        const wasAdded = await window.ethereum.request({
                            method: 'wallet_watchAsset',
                            params: {
                                type: 'ERC721',
                                options: {
                                    address: contractAddress,
                                    tokenId: String(tokenId)
                                },
                            },
                        });
                        
                        if (wasAdded) {
                            showToast('📜 NFT #' + tokenId + ' added to wallet!', 'success');
                        } else {
                            showToast('NFT not added (cancelled)', 'warning');
                        }
                        return;
                    } catch (secondError) {
                        throw secondError;
                    }
                }
                throw firstError;
            }
        } catch (error) {
            console.error('Add to wallet error:', error);
            
            if (error.code === 4001) {
                // User rejected - don't show error
                return;
            } else if (error.code === 4100 || error.message?.includes('spam')) {
                showToast('MetaMask blocked request. Wait a few seconds and try again.', 'warning');
            } else {
                showToast('Could not add NFT: ' + (error.message || 'Unknown error'), 'error');
            }
        }
    }
};

window.NotaryPage = NotaryPage;