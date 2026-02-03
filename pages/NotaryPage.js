// js/pages/NotaryPage.js
// ✅ PRODUCTION V6.9 - Complete Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                  Decentralized Notary - Blockchain Certification
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, consistent with other pages
// - Improved step progress indicator
// - Better file preview and upload experience
// - Enhanced certificate cards with animations
// - Smoother transitions and micro-interactions
// - Consistent styling with NetworkStakingPage, RewardsPage, CharityPage
//
// V11.0 Features (maintained):
// - NotaryTx module integration
// - IPFS upload with signature verification
// - Firebase-based certificate history
// - Add to wallet functionality
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { safeContractCall, API_ENDPOINTS, loadPublicData, loadUserData } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';
import { NotaryTx } from '../modules/transactions/index.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// File type configurations
const FILE_TYPES = {
    image: { icon: 'fa-regular fa-image', color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Image' },
    pdf: { icon: 'fa-regular fa-file-pdf', color: 'text-red-400', bg: 'bg-red-500/15', label: 'PDF' },
    audio: { icon: 'fa-solid fa-music', color: 'text-purple-400', bg: 'bg-purple-500/15', label: 'Audio' },
    video: { icon: 'fa-regular fa-file-video', color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Video' },
    document: { icon: 'fa-regular fa-file-word', color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Document' },
    spreadsheet: { icon: 'fa-regular fa-file-excel', color: 'text-green-400', bg: 'bg-green-500/15', label: 'Spreadsheet' },
    code: { icon: 'fa-solid fa-code', color: 'text-cyan-400', bg: 'bg-cyan-500/15', label: 'Code' },
    archive: { icon: 'fa-regular fa-file-zipper', color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Archive' },
    default: { icon: 'fa-regular fa-file', color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'File' }
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
// HELPERS
// ============================================================================
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
    
    if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('notary-styles-v6')) return;
    
    const style = document.createElement('style');
    style.id = 'notary-styles-v6';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Notary Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.2); } 
            50% { box-shadow: 0 0 40px rgba(245,158,11,0.4); } 
        }
        @keyframes stamp {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-5deg); }
            50% { transform: scale(0.9) rotate(5deg); }
            75% { transform: scale(1.1) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes success-bounce {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scan {
            0% { top: 0; opacity: 1; }
            50% { opacity: 0.5; }
            100% { top: 100%; opacity: 1; }
        }
        
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .stamp-animation { animation: stamp 0.6s ease-out; }
        .success-bounce { animation: success-bounce 0.5s ease-out; }
        
        /* Cards */
        .notary-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .notary-card:hover {
            border-color: rgba(245,158,11,0.3);
        }
        
        /* Step Progress */
        .step-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        .step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
        }
        .step-dot {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.3s ease;
        }
        .step-dot.pending {
            background: rgba(39,39,42,0.8);
            color: #71717a;
            border: 2px solid rgba(63,63,70,0.8);
        }
        .step-dot.active {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.4);
        }
        .step-dot.done {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
        }
        .step-line {
            position: absolute;
            top: 20px;
            height: 3px;
            background: rgba(63,63,70,0.5);
            transition: all 0.5s ease;
        }
        .step-line.line-1 { left: 20%; width: 30%; }
        .step-line.line-2 { left: 50%; width: 30%; }
        .step-line.active {
            background: linear-gradient(90deg, #10b981, #f59e0b);
        }
        .step-line.done {
            background: #10b981;
        }
        
        /* Dropzone */
        .dropzone {
            border: 2px dashed rgba(63,63,70,0.8);
            border-radius: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
            background: rgba(0,0,0,0.2);
        }
        .dropzone:hover {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.05);
        }
        .dropzone.drag-over {
            border-color: #f59e0b;
            background: rgba(245,158,11,0.1);
            transform: scale(1.02);
        }
        
        /* Certificate Cards */
        .cert-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .cert-card:hover {
            transform: translateY(-4px);
            border-color: rgba(245,158,11,0.4);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        /* Buttons */
        .btn-primary {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(245,158,11,0.3);
        }
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #fafafa;
            font-weight: 600;
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .btn-secondary:hover {
            background: rgba(63,63,70,1);
        }
        
        /* Processing Overlay */
        .processing-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(10px);
            display: none;
            align-items: center;
            justify-content: center;
        }
        .processing-overlay.active {
            display: flex;
        }
        
        /* Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.5); }
        
        /* Responsive */
        @media (max-width: 768px) {
            .notary-grid { grid-template-columns: 1fr !important; }
            .step-dot { width: 36px; height: 36px; font-size: 12px; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    const container = document.getElementById('notary');
    if (!container) return;
    
    injectStyles();
    
    container.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-6">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-stamp text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Decentralized Notary</h1>
                        <p class="text-sm text-zinc-500">Permanent blockchain certification</p>
                    </div>
                </div>
                <div id="status-badge" class="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-sm">
                    <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                    <span class="text-zinc-400">Checking...</span>
                </div>
            </div>
            
            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 notary-grid">
                
                <!-- Left: Action Panel -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Step Progress -->
                    <div class="notary-card p-5">
                        <div class="step-container">
                            <div class="step-line line-1" id="line-1"></div>
                            <div class="step-line line-2" id="line-2"></div>
                            
                            <div class="step-item">
                                <div class="step-dot active" id="step-1">1</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Upload</span>
                            </div>
                            <div class="step-item">
                                <div class="step-dot pending" id="step-2">2</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Details</span>
                            </div>
                            <div class="step-item">
                                <div class="step-dot pending" id="step-3">3</div>
                                <span class="text-[10px] text-zinc-500 mt-2">Mint</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Panel -->
                    <div id="action-panel" class="notary-card p-6 min-h-[350px]">
                        <!-- Step content renders here -->
                    </div>
                </div>
                
                <!-- Right: Sidebar -->
                <div class="space-y-4">
                    
                    <!-- Cost Card -->
                    <div class="notary-card p-5 border-amber-500/20">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-coins text-amber-400"></i>
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500">Service Cost</p>
                                <p id="fee-amount" class="text-lg font-bold text-amber-400 font-mono">-- BKC</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
                            <span class="text-sm text-zinc-500">Your Balance</span>
                            <span id="user-balance" class="font-mono font-bold">-- BKC</span>
                        </div>
                    </div>
                    
                    <!-- How It Works -->
                    <div class="notary-card p-5">
                        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-blue-400"></i> How It Works
                        </h3>
                        <div class="space-y-3">
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">1</span>
                                </div>
                                <p class="text-xs text-zinc-400">Upload any document (max 5MB)</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">2</span>
                                </div>
                                <p class="text-xs text-zinc-400">Add description for your records</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                    <span class="text-amber-400 text-xs font-bold">3</span>
                                </div>
                                <p class="text-xs text-zinc-400">Sign & mint NFT certificate</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                            <i class="fa-solid fa-shield-check text-emerald-400"></i>
                            <span>Hash stored permanently on-chain</span>
                        </div>
                    </div>
                    
                    <!-- Features -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="notary-card p-4 text-center">
                            <i class="fa-solid fa-shield-halved text-emerald-400 text-xl mb-2"></i>
                            <p class="text-[10px] text-zinc-500">Tamper-Proof</p>
                        </div>
                        <div class="notary-card p-4 text-center">
                            <i class="fa-solid fa-infinity text-amber-400 text-xl mb-2"></i>
                            <p class="text-[10px] text-zinc-500">Permanent</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Certificates History -->
            <div class="mt-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-amber-400"></i>
                        Your Certificates
                    </h2>
                    <button onclick="NotaryPage.refreshHistory()" class="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
                <div id="certificates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="col-span-full text-center py-8 text-zinc-500">
                        <i class="fa-solid fa-spinner fa-spin text-amber-400 text-2xl mb-3"></i>
                        <p class="text-sm">Loading certificates...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Processing Overlay -->
        <div id="processing-overlay" class="processing-overlay">
            <div class="text-center p-6 max-w-sm">
                <div class="w-28 h-28 mx-auto mb-6 relative">
                    <div class="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-500/50 animate-spin"></div>
                    <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <div class="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-amber-500/30">
                        <i id="overlay-icon" class="fa-solid fa-stamp text-4xl text-amber-400"></i>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Notarizing Document</h3>
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
}

// ============================================================================
// STATUS BADGES
// ============================================================================
function updateStatusBadges() {
    const badge = document.getElementById('status-badge');
    const feeEl = document.getElementById('fee-amount');
    const balEl = document.getElementById('user-balance');

    const fee = State.notaryFee || 0n;
    const balance = State.currentUserBalance || 0n;

    if (feeEl) feeEl.textContent = `${formatBigNumber(fee)} BKC`;
    if (balEl) {
        balEl.textContent = `${formatBigNumber(balance)} BKC`;
        balEl.className = `font-mono font-bold ${balance >= fee ? 'text-emerald-400' : 'text-red-400'}`;
    }

    if (badge) {
        if (State.isConnected) {
            if (balance >= fee) {
                badge.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-emerald-400">Ready to Notarize</span>
                `;
                badge.className = 'flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm';
            } else {
                badge.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="text-red-400">Insufficient Balance</span>
                `;
                badge.className = 'flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-sm';
            }
        } else {
            badge.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span class="text-zinc-400">Connect Wallet</span>
            `;
            badge.className = 'flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-sm';
        }
    }
}

// ============================================================================
// STEP INDICATORS
// ============================================================================
function updateStepIndicators() {
    [1, 2, 3].forEach(i => {
        const dot = document.getElementById(`step-${i}`);
        if (!dot) return;
        
        if (i < Notary.step) {
            dot.className = 'step-dot done';
            dot.innerHTML = '<i class="fa-solid fa-check text-sm"></i>';
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
    
    if (line1) line1.className = `step-line line-1 ${Notary.step > 1 ? 'done' : ''}`;
    if (line2) line2.className = `step-line line-2 ${Notary.step > 2 ? 'done' : ''}`;
}

// ============================================================================
// STEP CONTENT
// ============================================================================
function renderStepContent() {
    const panel = document.getElementById('action-panel');
    if (!panel) return;

    updateStepIndicators();

    if (!State.isConnected) {
        panel.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-12">
                <div class="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-wallet text-3xl text-zinc-500"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p class="text-zinc-500 text-sm mb-6 text-center max-w-xs">Connect your wallet to start notarizing documents on the blockchain</p>
                <button onclick="window.openConnectModal && window.openConnectModal()" 
                    class="btn-primary px-8 py-3 text-base">
                    <i class="fa-solid fa-wallet mr-2"></i>Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    const fee = State.notaryFee || ethers.parseEther("1");
    const balance = State.currentUserBalance || 0n;
    
    if (balance < fee) {
        panel.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-12">
                <div class="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-coins text-3xl text-red-400"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Insufficient Balance</h3>
                <p class="text-zinc-500 text-sm text-center mb-2">You need at least <span class="text-amber-400 font-bold">${formatBigNumber(fee)} BKC</span> to notarize</p>
                <p class="text-zinc-600 text-xs">Current balance: ${formatBigNumber(balance)} BKC</p>
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

// ============================================================================
// STEP 1: FILE UPLOAD
// ============================================================================
function renderStep1(panel) {
    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-8">
            <h3 class="text-xl font-bold text-white mb-2">Upload Document</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Select any file to certify permanently on the blockchain</p>
            
            <div id="dropzone" class="dropzone w-full max-w-md p-10 text-center">
                <input type="file" id="file-input" class="hidden">
                <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-amber-400"></i>
                </div>
                <p class="text-white font-semibold mb-1">Click or drag file here</p>
                <p class="text-xs text-zinc-600">Max 5MB • Any format supported</p>
            </div>

            <div class="flex items-center gap-6 mt-6 text-xs text-zinc-600">
                <span class="flex items-center gap-1"><i class="fa-solid fa-lock text-emerald-500"></i> Encrypted</span>
                <span class="flex items-center gap-1"><i class="fa-solid fa-database text-blue-400"></i> IPFS Storage</span>
                <span class="flex items-center gap-1"><i class="fa-solid fa-shield text-purple-400"></i> Tamper-proof</span>
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
        dropzone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); });
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
    const fileInfo = getFileTypeInfo(file?.type || '', file?.name || '');

    panel.innerHTML = `
        <div class="max-w-md mx-auto py-4">
            <h3 class="text-xl font-bold text-white mb-2 text-center">Add Details</h3>
            <p class="text-zinc-500 text-sm mb-6 text-center">Describe your document for easy reference</p>

            <div class="notary-card p-4 mb-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl ${fileInfo.bg} flex items-center justify-center flex-shrink-0">
                        <i class="${fileInfo.icon} text-2xl ${fileInfo.color}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate">${file?.name || 'Unknown'}</p>
                        <p class="text-xs text-zinc-500">${fileSize} KB • ${fileInfo.label}</p>
                    </div>
                    <button id="btn-remove" class="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-trash text-red-400"></i>
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Description <span class="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea id="desc-input" rows="3" 
                    class="w-full bg-black/40 border-2 border-zinc-700/50 rounded-xl p-4 text-sm text-white focus:border-amber-500/50 focus:outline-none placeholder-zinc-600 resize-none transition-colors"
                    placeholder="E.g., Property deed signed on Jan 2025...">${Notary.description}</textarea>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="btn-secondary flex-1 py-3.5 text-sm">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-next" class="btn-primary flex-[2] py-3.5 text-sm">
                    Continue<i class="fa-solid fa-arrow-right ml-2"></i>
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
        Notary.description = document.getElementById('desc-input')?.value || '';
        Notary.step = 3;
        renderStepContent();
    });
}

// ============================================================================
// STEP 3: CONFIRM & MINT
// ============================================================================
function renderStep3(panel) {
    const file = Notary.file;
    const desc = Notary.description || 'No description';
    const fee = State.notaryFee || ethers.parseEther("1");
    const fileInfo = getFileTypeInfo(file?.type || '', file?.name || '');

    panel.innerHTML = `
        <div class="max-w-md mx-auto py-4 text-center">
            <h3 class="text-xl font-bold text-white mb-2">Confirm & Mint</h3>
            <p class="text-zinc-500 text-sm mb-6">Review and sign to create your NFT certificate</p>

            <div class="notary-card p-4 mb-4 text-left">
                <div class="flex items-center gap-4 pb-4 border-b border-zinc-800/50 mb-3">
                    <div class="w-12 h-12 rounded-xl ${fileInfo.bg} flex items-center justify-center">
                        <i class="${fileInfo.icon} text-xl ${fileInfo.color}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate text-sm">${file?.name}</p>
                        <p class="text-xs text-zinc-500">${(file?.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <p class="text-sm text-zinc-400 italic">"${desc}"</p>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-400">Total Cost</span>
                    <span class="text-amber-400 font-bold text-lg">${formatBigNumber(fee)} BKC</span>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="btn-back" class="btn-secondary flex-1 py-3.5 text-sm">
                    <i class="fa-solid fa-arrow-left mr-2"></i>Back
                </button>
                <button id="btn-mint" class="btn-primary flex-[2] py-3.5 text-sm pulse-glow">
                    <i class="fa-solid fa-stamp mr-2"></i>Sign & Mint
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
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Signing...';
    }

    const overlay = document.getElementById('processing-overlay');
    const statusEl = document.getElementById('process-status');
    const barEl = document.getElementById('process-bar');
    const iconEl = document.getElementById('overlay-icon');

    const setProgress = (percent, text) => {
        if (barEl) barEl.style.width = `${percent}%`;
        if (statusEl) statusEl.textContent = text;
    };

    try {
        const signer = await State.provider.getSigner();
        const message = "I am signing to authenticate my file for notarization on Backchain.";
        const signature = await signer.signMessage(message);

        if (overlay) overlay.classList.add('active');

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
            if (res.status === 401) throw new Error('Signature verification failed.');
            throw new Error(`Upload failed (${res.status})`);
        }
        const data = await res.json();

        const ipfsCid = data.ipfsUri || data.metadataUri;
        const contentHash = data.contentHash;
        
        if (!ipfsCid) throw new Error('No IPFS URI returned');
        if (!contentHash) throw new Error('No content hash returned');

        setProgress(50, 'MINTING ON BLOCKCHAIN...');
        if (iconEl) iconEl.className = 'fa-solid fa-stamp text-4xl text-amber-400 stamp-animation';

        await NotaryTx.notarize({
            ipfsCid,
            contentHash,
            description: Notary.description || 'No description',
            button: btn,
            
            onSuccess: (receipt) => {
                setProgress(100, 'SUCCESS!');
                
                if (overlay) {
                    overlay.innerHTML = `
                        <div class="text-center p-6 max-w-sm success-bounce">
                            <div class="w-32 h-32 mx-auto mb-6 relative">
                                <div class="absolute inset-0 rounded-full bg-emerald-500/30 animate-pulse"></div>
                                <div class="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-900/50 to-green-900/50 flex items-center justify-center border-2 border-emerald-400">
                                    <i class="fa-solid fa-check text-5xl text-emerald-400"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-white mb-2">🎉 Notarized!</h3>
                            <p class="text-emerald-400 text-sm mb-4">Your document is now permanently certified</p>
                            <div class="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                                <i class="fa-solid fa-shield-check text-emerald-400"></i>
                                <span>Immutable • Verifiable • Permanent</span>
                            </div>
                        </div>
                    `;
                }
                
                setTimeout(() => {
                    if (overlay) overlay.classList.remove('active');
                    
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
                if (error.cancelled || error.type === 'user_rejected') {
                    Notary.isProcessing = false;
                    if (overlay) overlay.classList.remove('active');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i>Sign & Mint';
                    }
                    return;
                }
                throw error;
            }
        });

    } catch (e) {
        console.error('Notary Error:', e);
        
        if (overlay) overlay.classList.remove('active');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-stamp mr-2"></i>Sign & Mint';
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

    grid.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fa-solid fa-spinner fa-spin text-amber-400 text-2xl mb-3"></i>
            <p class="text-zinc-500 text-sm">Loading certificates...</p>
        </div>
    `;

    try {
        const baseUrl = API_ENDPOINTS.getNotarizedDocuments || 'https://getnotarizeddocuments-4wvdcuoouq-uc.a.run.app';
        const response = await fetch(`${baseUrl}/${State.userAddress}`);
        
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-stamp text-2xl text-amber-400/50"></i>
                    </div>
                    <p class="text-zinc-500 text-sm mb-1">No certificates yet</p>
                    <p class="text-zinc-600 text-xs">Upload a document to get started</p>
                </div>
            `;
            return;
        }

        const certs = data.map(doc => ({
            id: doc.tokenId || '?',
            ipfs: doc.ipfsCid || '',
            description: doc.description || '',
            hash: doc.contentHash || '',
            timestamp: doc.createdAt || doc.timestamp || '',
            txHash: doc.txHash || ''
        })).sort((a, b) => parseInt(b.id) - parseInt(a.id));

        grid.innerHTML = certs.map(cert => {
            let ipfsUrl = '';
            const ipfsData = cert.ipfs || '';
            
            if (ipfsData.startsWith('ipfs://')) {
                ipfsUrl = `${IPFS_GATEWAY}${ipfsData.replace('ipfs://', '')}`;
            } else if (ipfsData.startsWith('https://')) {
                ipfsUrl = ipfsData;
            } else if (ipfsData.length > 0) {
                ipfsUrl = `${IPFS_GATEWAY}${ipfsData}`;
            }
            
            let cleanDesc = cert.description?.split('---')[0].trim().split('\n')[0].trim() || 'Notarized Document';
            const fileInfo = getFileTypeInfo('', cleanDesc);
            const timeAgo = formatTimestamp(cert.timestamp);

            return `
                <div class="cert-card">
                    <div class="h-32 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                        ${ipfsUrl ? `
                            <img src="${ipfsUrl}" class="absolute inset-0 w-full h-full object-cover opacity-80"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden flex-col items-center justify-center h-full absolute inset-0 bg-zinc-900">
                                <div class="w-14 h-14 rounded-xl ${fileInfo.bg} flex items-center justify-center">
                                    <i class="${fileInfo.icon} text-2xl ${fileInfo.color}"></i>
                                </div>
                            </div>
                        ` : `
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 rounded-xl ${fileInfo.bg} flex items-center justify-center mb-2">
                                    <i class="${fileInfo.icon} text-3xl ${fileInfo.color}"></i>
                                </div>
                            </div>
                        `}
                        <span class="absolute top-2 right-2 text-[10px] font-mono text-amber-400 bg-black/80 px-2 py-1 rounded-full font-bold">#${cert.id}</span>
                        ${timeAgo ? `
                            <span class="absolute top-2 left-2 text-[10px] text-zinc-400 bg-black/80 px-2 py-1 rounded-full flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i> ${timeAgo}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="p-4">
                        <p class="text-sm text-white font-semibold truncate mb-1" title="${cleanDesc}">
                            ${cleanDesc}
                        </p>
                        <p class="text-[10px] font-mono text-zinc-600 truncate mb-3" title="${cert.hash}">
                            SHA-256: ${cert.hash?.slice(0, 16) || '...'}...
                        </p>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                            <div class="flex gap-3">
                                ${ipfsUrl ? `
                                    <a href="${ipfsUrl}" target="_blank" 
                                       class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1">
                                        <i class="fa-solid fa-download"></i> Download
                                    </a>
                                ` : ''}
                                <button onclick="NotaryPage.addToWallet('${cert.id}', '${ipfsUrl}')" 
                                    class="text-[11px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                                    <i class="fa-solid fa-wallet"></i> Wallet
                                </button>
                            </div>
                            ${cert.txHash ? `
                                <a href="${EXPLORER_TX}${cert.txHash}" target="_blank" 
                                   class="text-zinc-600 hover:text-white transition-colors" title="View on Explorer">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('Error loading certificates:', e);
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-400 text-sm"><i class="fa-solid fa-exclamation-circle mr-2"></i>Failed to load</p>
                <button onclick="NotaryPage.refreshHistory()" class="mt-2 text-amber-400 text-xs hover:underline">Try again</button>
            </div>
        `;
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadNotaryData() {
    try {
        await loadPublicData();
        
        if (State.isConnected && State.userAddress) {
            try {
                if (State.bkcTokenContract || State.bkcTokenContractPublic) {
                    const token = State.bkcTokenContract || State.bkcTokenContractPublic;
                    const balance = await safeContractCall(token, 'balanceOf', [State.userAddress], 0n);
                    if (balance > 0n) State.currentUserBalance = balance;
                }
            } catch (e) {}
        }
        
        updateStatusBadges();
        
    } catch (e) {
        if (!State.notaryFee || State.notaryFee === 0n) {
            State.notaryFee = ethers.parseEther("1");
        }
    }
}

// ============================================================================
// ADD TO WALLET
// ============================================================================
async function addToWallet(tokenId, imageUrl) {
    try {
        const IPFS_GATEWAYS = [
            'https://dweb.link/ipfs/',
            'https://w3s.link/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://ipfs.io/ipfs/'
        ];
        
        const extractCid = (url) => {
            if (!url) return '';
            if (url.startsWith('ipfs://')) return url.replace('ipfs://', '').split('?')[0];
            if (url.includes('/ipfs/')) return url.split('/ipfs/')[1].split('?')[0];
            if (url.match(/^Qm[a-zA-Z0-9]{44}/) || url.match(/^bafy[a-zA-Z0-9]+/)) return url;
            return '';
        };
        
        const toHttpsUrl = (url) => {
            if (!url) return '';
            if (url.startsWith('https://') && !url.includes('/ipfs/')) return url;
            const cid = extractCid(url);
            return cid ? `${IPFS_GATEWAYS[0]}${cid}` : url;
        };
        
        let finalImageUrl = toHttpsUrl(imageUrl || '');
        
        if (State.decentralizedNotaryContract) {
            try {
                const uri = await State.decentralizedNotaryContract.tokenURI(tokenId);
                if (uri?.startsWith('data:application/json;base64,')) {
                    const metadata = JSON.parse(atob(uri.replace('data:application/json;base64,', '')));
                    if (metadata.image) finalImageUrl = toHttpsUrl(metadata.image);
                }
            } catch (e) {}
        }
        
        const contractAddress = State.decentralizedNotaryContract?.target || 
            (State.decentralizedNotaryContract?.getAddress ? await State.decentralizedNotaryContract.getAddress() : null);
        
        if (!contractAddress) {
            showToast('Contract address not found', 'error');
            return;
        }
        
        showToast(`Adding NFT #${tokenId} to wallet...`, 'info');
        
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: { address: contractAddress, tokenId: String(tokenId), image: finalImageUrl }
            }
        });
        
        if (wasAdded) {
            showToast(`📜 NFT #${tokenId} added to wallet!`, 'success');
        }
    } catch (error) {
        if (error.code === 4001) return;
        showToast('Could not add NFT', 'error');
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

    addToWallet
};

window.NotaryPage = NotaryPage;