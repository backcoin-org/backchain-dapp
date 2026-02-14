// js/pages/NotaryPage.js
// ✅ PRODUCTION V10.0 — Complete Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                  Decentralized Notary — Blockchain Certification
// ═══════════════════════════════════════════════════════════════════════════════
//
// V10.0 Changes:
// - COMPLETE REDESIGN — 4-tab navigation (Documents, Notarize, Verify, Stats)
// - Client-side SHA-256 hash calculation (transparency — user sees hash)
// - Duplicate detection before minting (verifyByHash)
// - Public verification tool (no wallet needed)
// - Statistics dashboard (getStats + totalSupply + recent events)
// - Both BKC + ETH fees displayed
// - Certificate detail view with metadata + actions
// - On-chain event fallback for certificates
// - Operator system via resolveOperator()
// - 3-step notarize wizard with fee breakdown
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { API_ENDPOINTS } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';
import { NotaryTx } from '../modules/transactions/index.js';
import { resolveOperator } from '../modules/core/operator.js';
import { resolveContentUrl, irysUploadFile, getUploadPrice } from '../modules/core/index.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EXPLORER_BASE = 'https://sepolia.arbiscan.io';
const EXPLORER_TX = `${EXPLORER_BASE}/tx/`;
const EXPLORER_ADDR = `${EXPLORER_BASE}/address/`;
const EXPLORER_TOKEN = `${EXPLORER_BASE}/token/`;

// V9: Certified event replaces DocumentNotarized
const NOTARY_ABI_EVENTS = [
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)'
];

const FILE_TYPES = {
    image:       { icon: 'fa-regular fa-image',       color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Image' },
    pdf:         { icon: 'fa-regular fa-file-pdf',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'PDF' },
    audio:       { icon: 'fa-solid fa-music',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Audio' },
    video:       { icon: 'fa-regular fa-file-video',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Video' },
    document:    { icon: 'fa-regular fa-file-word',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Document' },
    spreadsheet: { icon: 'fa-regular fa-file-excel',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Spreadsheet' },
    code:        { icon: 'fa-solid fa-code',           color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', label: 'Code' },
    archive:     { icon: 'fa-regular fa-file-zipper',  color: '#facc15', bg: 'rgba(250,204,21,0.12)', label: 'Archive' },
    default:     { icon: 'fa-regular fa-file',         color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'File' }
};

// ============================================================================
// STATE
// ============================================================================
const NT = {
    // View routing
    view: 'documents',
    activeTab: 'documents',
    viewHistory: [],

    // Wizard (notarize flow)
    wizStep: 1,
    wizFile: null,
    wizFileHash: null,
    wizDescription: '',
    wizDuplicateCheck: null,
    wizIsHashing: false,
    wizDocType: 0,
    wizUploadCost: null,

    // Fees
    bkcFee: 0n,
    ethFee: 0n,
    feesLoaded: false,

    // Certificates (My Documents)
    certificates: [],
    certsLoading: false,

    // Certificate detail
    selectedCert: null,

    // Verify tab
    verifyFile: null,
    verifyHash: null,
    verifyResult: null,
    verifyIsChecking: false,

    // Stats tab
    stats: null,
    totalSupply: 0,
    recentNotarizations: [],
    statsLoading: false,

    // Processing
    isProcessing: false,
    processStep: '',

    // General
    isLoading: false,
    contractAvailable: true
};

// ============================================================================
// HELPERS
// ============================================================================
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

function formatTimestamp(ts) {
    if (!ts) return '';
    let date;
    if (typeof ts === 'number') date = new Date(ts > 1e12 ? ts : ts * 1000);
    else if (typeof ts === 'string') date = new Date(ts);
    else if (ts?.toDate) date = ts.toDate();
    else if (ts?.seconds) date = new Date(ts.seconds * 1000);
    else return '';
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatDateFull(ts) {
    if (!ts) return '';
    const date = typeof ts === 'number' ? new Date(ts > 1e12 ? ts : ts * 1000) : new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortenAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortenHash(hash) {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function resolveStorageUrl(uri) {
    return resolveContentUrl(uri) || '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
}

// ============================================================================
// NAVIGATION
// ============================================================================
function navigateView(view, data) {
    NT.viewHistory.push({ view: NT.view, data: NT.selectedCert });
    NT.view = view;
    if (view !== 'cert-detail') NT.activeTab = view;
    if (data) NT.selectedCert = data;
    renderContent();
    renderHeader();
}

function goBack() {
    const prev = NT.viewHistory.pop();
    if (prev) {
        NT.view = prev.view;
        NT.activeTab = prev.view === 'cert-detail' ? 'documents' : prev.view;
        NT.selectedCert = prev.data;
    } else {
        NT.view = 'documents';
        NT.activeTab = 'documents';
    }
    renderContent();
    renderHeader();
}

function setTab(tab) {
    if (NT.activeTab === tab && NT.view === tab) return;
    NT.viewHistory = [];
    NT.view = tab;
    NT.activeTab = tab;
    renderContent();
    renderHeader();
}

// ============================================================================
// CSS INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('notary-styles-v10')) return;
    const style = document.createElement('style');
    style.id = 'notary-styles-v10';
    style.textContent = `
        :root {
            --nt-bg:       #0c0c0e;
            --nt-bg2:      #141417;
            --nt-bg3:      #1c1c21;
            --nt-surface:  #222228;
            --nt-border:   rgba(255,255,255,0.06);
            --nt-border-h: rgba(255,255,255,0.1);
            --nt-text:     #f0f0f2;
            --nt-text-2:   #a0a0ab;
            --nt-text-3:   #5c5c68;
            --nt-accent:   #f59e0b;
            --nt-accent-2: #d97706;
            --nt-accent-glow: rgba(245,158,11,0.15);
            --nt-red:      #ef4444;
            --nt-green:    #22c55e;
            --nt-blue:     #3b82f6;
            --nt-radius:   14px;
            --nt-radius-sm: 10px;
            --nt-radius-lg: 20px;
            --nt-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes nt-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nt-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: none; } }
        @keyframes nt-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes nt-stamp { 0% { transform: scale(1) rotate(0); } 25% { transform: scale(1.2) rotate(-5deg); } 50% { transform: scale(0.9) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes nt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes nt-scan { 0% { top: 0; opacity: 1; } 50% { opacity: 0.5; } 100% { top: 100%; opacity: 1; } }
        @keyframes nt-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 100% { box-shadow: 0 0 0 15px rgba(245,158,11,0); } }

        .nt-shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 0 16px 32px;
            min-height: 100vh;
            background: var(--nt-bg);
        }
        .nt-header {
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 12px 0 0;
            background: var(--nt-bg);
        }
        .nt-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
        }
        .nt-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nt-brand-icon {
            width: 44px; height: 44px;
            border-radius: var(--nt-radius);
            background: var(--nt-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            display: flex; align-items: center; justify-content: center;
            color: var(--nt-accent);
            font-size: 20px;
            animation: nt-float 4s ease-in-out infinite;
        }
        .nt-brand-name {
            font-size: 18px;
            font-weight: 800;
            color: var(--nt-text);
            letter-spacing: -0.02em;
        }
        .nt-brand-sub {
            font-size: 11px;
            color: var(--nt-text-3);
        }

        /* Navigation */
        .nt-nav {
            display: flex;
            gap: 2px;
            padding: 4px;
            background: var(--nt-bg2);
            border-radius: var(--nt-radius);
            border: 1px solid var(--nt-border);
            margin-top: 8px;
        }
        .nt-nav-item {
            flex: 1;
            padding: 10px 6px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: var(--nt-text-3);
            border-radius: var(--nt-radius-sm);
            cursor: pointer;
            transition: all var(--nt-transition);
            border: none;
            background: none;
        }
        .nt-nav-item:hover { color: var(--nt-text-2); background: var(--nt-bg3); }
        .nt-nav-item.active {
            color: var(--nt-text);
            background: var(--nt-surface);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .nt-nav-item i { margin-right: 6px; }

        /* Back header */
        .nt-back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
        }
        .nt-back-btn {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-back-btn:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Card */
        .nt-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 20px;
            animation: nt-fadeIn 0.3s ease;
        }

        /* Certificate grid */
        .nt-cert-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
        }
        @media (max-width: 640px) {
            .nt-cert-grid { grid-template-columns: 1fr; }
        }
        .nt-cert-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            overflow: hidden;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-cert-card:hover {
            border-color: var(--nt-border-h);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .nt-cert-thumb {
            height: 120px;
            background: var(--nt-bg3);
            display: flex; align-items: center; justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .nt-cert-thumb img {
            width: 100%; height: 100%; object-fit: cover; opacity: 0.8;
        }
        .nt-cert-info {
            padding: 14px;
        }
        .nt-card-action {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 600;
            color: var(--nt-text-2);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            border-radius: 8px;
            cursor: pointer;
            transition: all var(--nt-transition);
            text-decoration: none;
            font-family: inherit;
        }
        .nt-card-action:hover {
            color: var(--nt-accent);
            border-color: rgba(245,158,11,0.3);
            background: var(--nt-accent-glow);
        }

        /* Dropzone */
        .nt-dropzone {
            border: 2px dashed var(--nt-border-h);
            border-radius: var(--nt-radius-lg);
            padding: 48px 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(0,0,0,0.15);
        }
        .nt-dropzone:hover {
            border-color: rgba(245,158,11,0.4);
            background: var(--nt-accent-glow);
        }
        .nt-dropzone.drag-over {
            border-color: var(--nt-accent);
            background: var(--nt-accent-glow);
            transform: scale(1.01);
        }

        /* Wizard steps */
        .nt-steps {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            margin-bottom: 28px;
        }
        .nt-step-dot {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        .nt-step-dot.pending {
            background: var(--nt-bg3);
            color: var(--nt-text-3);
            border: 2px solid var(--nt-border);
        }
        .nt-step-dot.active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.3);
        }
        .nt-step-dot.done {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #fff;
        }
        .nt-step-line {
            width: 60px; height: 3px;
            background: var(--nt-border);
            border-radius: 2px;
            transition: all 0.4s ease;
        }
        .nt-step-line.done { background: var(--nt-green); }
        .nt-step-line.active { background: linear-gradient(90deg, var(--nt-green), var(--nt-accent)); }

        /* Fee box */
        .nt-fee-box {
            background: rgba(245,158,11,0.06);
            border: 1px solid rgba(245,158,11,0.15);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
        .nt-fee-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .nt-fee-row + .nt-fee-row {
            border-top: 1px solid var(--nt-border);
        }

        /* Verify */
        .nt-verified {
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }
        .nt-not-found {
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }

        /* Stats */
        .nt-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        @media (min-width: 640px) {
            .nt-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .nt-stat-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 16px;
            text-align: center;
            animation: nt-fadeIn 0.3s ease;
        }
        .nt-stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--nt-text);
            font-family: monospace;
        }
        .nt-recent-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-bottom: 1px solid var(--nt-border);
            transition: background var(--nt-transition);
        }
        .nt-recent-item:hover { background: var(--nt-bg3); }
        .nt-recent-item:last-child { border-bottom: none; }

        /* Detail */
        .nt-detail { animation: nt-fadeIn 0.3s ease; }
        .nt-detail-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        @media (max-width: 640px) {
            .nt-detail-meta { grid-template-columns: 1fr; }
        }
        .nt-hash-display {
            font-family: monospace;
            font-size: 11px;
            color: var(--nt-text-2);
            background: var(--nt-bg3);
            padding: 12px;
            border-radius: var(--nt-radius-sm);
            word-break: break-all;
            cursor: pointer;
            border: 1px solid var(--nt-border);
            transition: border-color var(--nt-transition);
        }
        .nt-hash-display:hover { border-color: var(--nt-accent); }

        /* Buttons */
        .nt-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
            border: none;
            border-radius: var(--nt-radius-sm);
            padding: 12px 24px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 14px;
        }
        .nt-btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(245,158,11,0.3);
        }
        .nt-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .nt-btn-secondary {
            background: var(--nt-bg3);
            color: var(--nt-text-2);
            font-weight: 600;
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius-sm);
            padding: 10px 20px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 13px;
        }
        .nt-btn-secondary:hover { background: var(--nt-surface); color: var(--nt-text); }
        .nt-btn-icon {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-btn-icon:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Overlay */
        .nt-overlay {
            position: fixed; inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.92);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center; justify-content: center;
        }
        .nt-overlay.active { display: flex; }

        /* Shimmer loading */
        .nt-shimmer {
            background: linear-gradient(90deg, var(--nt-bg3) 25%, var(--nt-surface) 50%, var(--nt-bg3) 75%);
            background-size: 200% 100%;
            animation: nt-shimmer 1.5s ease infinite;
            border-radius: var(--nt-radius-sm);
        }

        /* Duplicate warning */
        .nt-duplicate-warn {
            background: rgba(251,191,36,0.08);
            border: 1px solid rgba(251,191,36,0.25);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
    `;
    document.head.appendChild(style);

    // Remove old styles
    const old = document.getElementById('notary-styles-v6');
    if (old) old.remove();
}

// ============================================================================
// RENDER
// ============================================================================
function render(isActive) {
    const container = document.getElementById('notary');
    if (!container) return;

    injectStyles();

    container.innerHTML = `
        <div class="nt-shell">
            <div class="nt-header" id="nt-header"></div>
            <div id="nt-content"></div>
            <div id="nt-overlay" class="nt-overlay"></div>
        </div>
    `;

    renderHeader();
    renderContent();

    // Load data
    Promise.all([
        loadFees(),
        loadCertificates(),
        loadStats()
    ]).catch(() => {});
}

// ============================================================================
// HEADER
// ============================================================================
function renderHeader() {
    const el = document.getElementById('nt-header');
    if (!el) return;

    if (NT.view === 'cert-detail') {
        el.innerHTML = `
            <div class="nt-back-header">
                <button class="nt-back-btn" onclick="NotaryPage.goBack()">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <div style="font-size:15px;font-weight:700;color:var(--nt-text)">Certificate #${NT.selectedCert?.id || ''}</div>
                    <div style="font-size:11px;color:var(--nt-text-3)">Document details</div>
                </div>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="nt-header-bar">
            <div class="nt-brand">
                <div class="nt-brand-icon"><i class="fa-solid fa-stamp"></i></div>
                <div>
                    <div class="nt-brand-name">Decentralized Notary</div>
                    <div class="nt-brand-sub">Permanent blockchain certification</div>
                </div>
            </div>
        </div>
        <nav class="nt-nav">
            <button class="nt-nav-item ${NT.activeTab === 'documents' ? 'active' : ''}" onclick="NotaryPage.setTab('documents')">
                <i class="fa-solid fa-certificate"></i><span>Documents</span>
            </button>
            <button class="nt-nav-item ${NT.activeTab === 'notarize' ? 'active' : ''}" onclick="NotaryPage.setTab('notarize')">
                <i class="fa-solid fa-stamp"></i><span>Notarize</span>
            </button>
            <button class="nt-nav-item ${NT.activeTab === 'verify' ? 'active' : ''}" onclick="NotaryPage.setTab('verify')">
                <i class="fa-solid fa-shield-check"></i><span>Verify</span>
            </button>
            <button class="nt-nav-item ${NT.activeTab === 'stats' ? 'active' : ''}" onclick="NotaryPage.setTab('stats')">
                <i class="fa-solid fa-chart-simple"></i><span>Stats</span>
            </button>
        </nav>
    `;
}

// ============================================================================
// CONTENT DISPATCHER
// ============================================================================
function renderContent() {
    const el = document.getElementById('nt-content');
    if (!el) return;

    switch (NT.view) {
        case 'documents':   renderDocuments(el);  break;
        case 'notarize':    renderNotarize(el);   break;
        case 'verify':      renderVerify(el);     break;
        case 'stats':       renderStats(el);      break;
        case 'cert-detail': renderCertDetail(el); break;
        default:            renderDocuments(el);
    }
}

// ============================================================================
// DOCUMENTS TAB
// ============================================================================
function renderDocuments(el) {
    if (!State.isConnected) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to view your certificates</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    if (NT.certsLoading) {
        el.innerHTML = `
            <div class="nt-cert-grid" style="margin-top:16px">
                ${Array(4).fill('').map(() => `
                    <div class="nt-cert-card">
                        <div class="nt-shimmer" style="height:120px"></div>
                        <div style="padding:14px">
                            <div class="nt-shimmer" style="height:16px;width:70%;margin-bottom:8px"></div>
                            <div class="nt-shimmer" style="height:12px;width:50%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        return;
    }

    if (!NT.certificates.length) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-stamp" style="font-size:24px;color:var(--nt-accent);opacity:0.5"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">No Certificates</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Notarize a document to create your first certificate</div>
                <button class="nt-btn-primary" onclick="NotaryPage.setTab('notarize')">
                    <i class="fa-solid fa-plus" style="margin-right:8px"></i>Notarize Document
                </button>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;margin-bottom:4px">
            <div style="font-size:13px;color:var(--nt-text-2)">${NT.certificates.length} certificate${NT.certificates.length > 1 ? 's' : ''}</div>
            <button class="nt-btn-icon" onclick="NotaryPage.refreshHistory()" title="Refresh">
                <i class="fa-solid fa-rotate-right" style="font-size:12px"></i>
            </button>
        </div>
        <div class="nt-cert-grid">
            ${NT.certificates.map(cert => renderCertCard(cert)).join('')}
        </div>
    `;
}

function renderCertCard(cert) {
    const ipfsUrl = resolveStorageUrl(cert.ipfs);
    const fileInfo = getFileTypeInfo(cert.mimeType || '', cert.description || cert.fileName || '');
    const timeAgo = formatTimestamp(cert.timestamp);
    const desc = cert.description?.split('---')[0].trim().split('\n')[0].trim() || 'Notarized Document';
    const docTypeName = NotaryTx.DOC_TYPE_NAMES?.[cert.docType] || '';

    return `
        <div class="nt-cert-card" onclick="NotaryPage.viewCert(${cert.id})">
            <div class="nt-cert-thumb">
                ${ipfsUrl ? `
                    <img src="${ipfsUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
                    <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:absolute;inset:0;background:var(--nt-bg3)">
                        <i class="${fileInfo.icon}" style="font-size:28px;color:${fileInfo.color}"></i>
                    </div>
                ` : `
                    <i class="${fileInfo.icon}" style="font-size:28px;color:${fileInfo.color}"></i>
                `}
                <span style="position:absolute;top:8px;right:8px;font-size:10px;font-family:monospace;color:var(--nt-accent);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px;font-weight:700">#${cert.id}</span>
                ${timeAgo ? `<span style="position:absolute;top:8px;left:8px;font-size:10px;color:var(--nt-text-3);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px"><i class="fa-regular fa-clock" style="margin-right:4px"></i>${timeAgo}</span>` : ''}
            </div>
            <div class="nt-cert-info">
                <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${desc}</div>
                ${docTypeName ? `<div style="font-size:10px;color:${fileInfo.color};margin-bottom:2px"><i class="${fileInfo.icon}" style="margin-right:3px;font-size:9px"></i>${docTypeName}</div>` : ''}
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px">SHA-256: ${cert.hash?.slice(0, 18) || '...'}...</div>
                <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
                    <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${cert.id}" target="_blank" class="nt-card-action" title="Verify on Arbiscan">
                        <i class="fa-solid fa-cube"></i> Verify
                    </a>
                    <button class="nt-card-action" onclick="NotaryPage.addToWallet('${cert.id}')" title="Copy certificate link">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// NOTARIZE TAB (3-Step Wizard)
// ============================================================================
function renderNotarize(el) {
    if (!State.isConnected) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to notarize documents on the blockchain</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="nt-card" style="margin-top:16px">
            ${renderStepProgress()}
            <div id="nt-wiz-panel"></div>
        </div>
    `;

    const panel = document.getElementById('nt-wiz-panel');
    if (!panel) return;

    switch (NT.wizStep) {
        case 1: renderWizStep1(panel); break;
        case 2: renderWizStep2(panel); break;
        case 3: renderWizStep3(panel); break;
    }
}

function renderStepProgress() {
    const s = NT.wizStep;
    return `
        <div class="nt-steps">
            <div class="nt-step-dot ${s > 1 ? 'done' : s === 1 ? 'active' : 'pending'}">${s > 1 ? '<i class="fa-solid fa-check" style="font-size:12px"></i>' : '1'}</div>
            <div class="nt-step-line ${s > 1 ? 'done' : s === 1 ? '' : ''}"></div>
            <div class="nt-step-dot ${s > 2 ? 'done' : s === 2 ? 'active' : 'pending'}">${s > 2 ? '<i class="fa-solid fa-check" style="font-size:12px"></i>' : '2'}</div>
            <div class="nt-step-line ${s > 2 ? 'done' : s === 2 ? 'active' : ''}"></div>
            <div class="nt-step-dot ${s === 3 ? 'active' : 'pending'}">3</div>
        </div>
    `;
}

// ── Step 1: Upload + Hash + Duplicate Check ──
function renderWizStep1(panel) {
    if (NT.wizFile && NT.wizFileHash) {
        // File selected, show hash + duplicate check
        const file = NT.wizFile;
        const fileInfo = getFileTypeInfo(file.type, file.name);
        const dupCheck = NT.wizDuplicateCheck;

        panel.innerHTML = `
            <div style="text-align:center;margin-bottom:20px">
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">File Selected</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">SHA-256 hash computed in your browser</div>
            </div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:16px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:14px">
                    <div style="width:48px;height:48px;border-radius:var(--nt-radius-sm);background:${fileInfo.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="${fileInfo.icon}" style="font-size:20px;color:${fileInfo.color}"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file.name}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${formatFileSize(file.size)} &bull; ${fileInfo.label}</div>
                    </div>
                    <button class="nt-btn-icon" onclick="NotaryPage.wizRemoveFile()" title="Remove">
                        <i class="fa-solid fa-xmark" style="color:var(--nt-red)"></i>
                    </button>
                </div>
            </div>

            <div style="margin-bottom:16px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
                    <i class="fa-solid fa-fingerprint" style="margin-right:4px;color:var(--nt-accent)"></i>SHA-256 Hash
                </div>
                <div class="nt-hash-display" onclick="NotaryPage.copyHash('${NT.wizFileHash}')" title="Click to copy">
                    ${NT.wizFileHash}
                    <i class="fa-regular fa-copy" style="float:right;margin-top:2px;color:var(--nt-accent)"></i>
                </div>
            </div>

            ${dupCheck === null ? `
                <div style="text-align:center;padding:12px;color:var(--nt-text-3);font-size:12px">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Checking for duplicates...
                </div>
            ` : dupCheck?.exists ? `
                <div class="nt-duplicate-warn" style="margin-bottom:16px">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#fbbf24;font-size:16px"></i>
                        <span style="font-size:13px;font-weight:700;color:#fbbf24">Document already notarized!</span>
                    </div>
                    <div style="font-size:12px;color:var(--nt-text-2);line-height:1.5">
                        This hash already exists on the blockchain.<br>
                        Token ID: <strong style="color:var(--nt-accent)">#${dupCheck.tokenId}</strong><br>
                        Owner: <span style="font-family:monospace;font-size:11px">${shortenAddress(dupCheck.owner)}</span><br>
                        Date: ${formatDateFull(dupCheck.timestamp)}
                    </div>
                </div>
            ` : `
                <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--nt-radius);padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i class="fa-solid fa-circle-check" style="color:var(--nt-green)"></i>
                    <span style="font-size:12px;color:var(--nt-green);font-weight:600">Hash unico — pronto para notarizar</span>
                </div>
            `}

            <div style="display:flex;gap:10px;margin-top:8px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizRemoveFile()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Change File
                </button>
                <button class="nt-btn-primary" style="flex:2" ${dupCheck?.exists ? 'disabled' : ''} onclick="NotaryPage.wizNext()">
                    Continue<i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        `;
        return;
    }

    if (NT.wizIsHashing) {
        panel.innerHTML = `
            <div style="text-align:center;padding:40px 20px">
                <div style="width:56px;height:56px;border-radius:50%;background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-fingerprint fa-spin" style="font-size:24px;color:var(--nt-accent)"></i>
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--nt-text)">Computing SHA-256...</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:6px">Hash being computed locally in your browser</div>
            </div>
        `;
        return;
    }

    // Dropzone
    panel.innerHTML = `
        <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Upload Document</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">Select a file to certify permanently on the blockchain</div>
        </div>

        <div class="nt-dropzone" id="nt-wiz-dropzone">
            <input type="file" id="nt-wiz-file-input" style="display:none">
            <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--nt-accent)"></i>
            </div>
            <div style="font-size:14px;font-weight:600;color:var(--nt-text);margin-bottom:4px">Click or drag file here</div>
            <div style="font-size:11px;color:var(--nt-text-3)">Max 5MB &bull; Any format</div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:16px;font-size:11px;color:var(--nt-text-3)">
            <span><i class="fa-solid fa-shield-halved" style="color:var(--nt-green);margin-right:4px"></i>Local hash</span>
            <span><i class="fa-solid fa-database" style="color:var(--nt-blue);margin-right:4px"></i>Arweave</span>
            <span><i class="fa-solid fa-infinity" style="color:var(--nt-accent);margin-right:4px"></i>Permanent</span>
        </div>
    `;

    initWizDropzone();
}

function initWizDropzone() {
    const dropzone = document.getElementById('nt-wiz-dropzone');
    const fileInput = document.getElementById('nt-wiz-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.onclick = () => fileInput.click();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        dropzone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); });
    });
    dropzone.addEventListener('dragenter', () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragover',  () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
        dropzone.classList.remove('drag-over');
        handleWizFileSelect(e.dataTransfer?.files?.[0]);
    });
    fileInput.addEventListener('change', e => handleWizFileSelect(e.target.files?.[0]));
}

async function handleWizFileSelect(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 5MB)', 'error');
        return;
    }

    NT.wizFile = file;
    NT.wizFileHash = null;
    NT.wizDuplicateCheck = null;
    NT.wizIsHashing = true;
    renderContent();

    try {
        const hash = await NotaryTx.calculateFileHash(file);
        NT.wizFileHash = hash;
        NT.wizIsHashing = false;
        renderContent();

        // Check for duplicates
        NT.wizDuplicateCheck = null;
        renderContent();
        const dupResult = await NotaryTx.verifyByHash(hash);
        NT.wizDuplicateCheck = dupResult;
        renderContent();
    } catch (err) {
        console.error('[NotaryPage] Hash error:', err);
        NT.wizIsHashing = false;
        NT.wizFile = null;
        showToast('Error computing file hash', 'error');
        renderContent();
    }
}

// ── Step 2: Description + Fee Breakdown ──
function renderWizStep2(panel) {
    const file = NT.wizFile;
    const fileInfo = getFileTypeInfo(file?.type || '', file?.name || '');

    const ethFmt = NT.feesLoaded ? (ethers ? ethers.formatEther(NT.ethFee) : '0.0001') : '...';
    const uploadCostFmt = NT.wizUploadCost ? NT.wizUploadCost.costFormatted : '...';

    const ethBalance = State.currentUserNativeBalance || 0n;
    const totalEthNeeded = (NT.ethFee || 0n) + (NT.wizUploadCost?.cost || 0n) + (ethers?.parseEther('0.001') || 0n);
    const hasEth = NT.feesLoaded ? ethBalance >= totalEthNeeded : true;
    const canProceed = hasEth;

    // Doc type options
    const docTypeNames = ['General', 'Contract', 'Identity', 'Diploma', 'Property', 'Financial', 'Legal', 'Medical', 'IP', 'Other'];
    const docTypeOptions = docTypeNames.map((name, i) =>
        `<option value="${i}" ${NT.wizDocType === i ? 'selected' : ''}>${name}</option>`
    ).join('');

    panel.innerHTML = `
        <div style="max-width:420px;margin:0 auto">
            <div style="text-align:center;margin-bottom:20px">
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Details & Fees</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">Describe your document and review the fees</div>
            </div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:var(--nt-radius-sm);background:${fileInfo.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="${fileInfo.icon}" style="font-size:16px;color:${fileInfo.color}"></i>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file?.name || 'File'}</div>
                    <div style="font-size:10px;color:var(--nt-text-3)">${formatFileSize(file?.size || 0)}</div>
                </div>
            </div>

            <div style="margin-bottom:16px">
                <label style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">
                    Document Type
                </label>
                <select id="nt-wiz-doctype"
                    style="width:100%;background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius-sm);padding:10px 12px;font-size:13px;color:var(--nt-text);outline:none;font-family:inherit;cursor:pointer"
                    onchange="NotaryPage.onDocTypeChange(this.value)">
                    ${docTypeOptions}
                </select>
            </div>

            <div style="margin-bottom:16px">
                <label style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">
                    Description <span style="font-weight:400;text-transform:none">(optional)</span>
                </label>
                <textarea id="nt-wiz-desc" rows="3"
                    style="width:100%;background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius-sm);padding:12px;font-size:13px;color:var(--nt-text);resize:none;outline:none;font-family:inherit;transition:border-color var(--nt-transition)"
                    onfocus="this.style.borderColor='rgba(245,158,11,0.4)'"
                    onblur="this.style.borderColor='var(--nt-border)'"
                    placeholder="E.g., Property deed signed Jan 2025...">${NT.wizDescription}</textarea>
            </div>

            <div class="nt-fee-box" style="margin-bottom:16px">
                <div style="font-size:11px;font-weight:700;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
                    <i class="fa-solid fa-coins" style="color:var(--nt-accent);margin-right:4px"></i>Fees
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">Arweave Storage</span>
                    <span style="font-size:14px;font-weight:700;color:#22d3ee;font-family:monospace">${uploadCostFmt}</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">Certification Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${ethFmt} ETH</span>
                </div>
                <div style="font-size:10px;color:var(--nt-text-3);margin-top:6px;font-style:italic">
                    <i class="fa-solid fa-infinity" style="margin-right:4px"></i>Arweave = permanent, decentralized storage
                </div>
                ${!hasEth ? `<div style="font-size:11px;color:var(--nt-red);margin-top:8px"><i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Insufficient ETH for fees + gas</div>` : ''}
            </div>

            <div style="display:flex;gap:10px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button class="nt-btn-primary" style="flex:2" ${!canProceed ? 'disabled' : ''} onclick="NotaryPage.wizToStep3()">
                    Review<i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 3: Confirm & Mint ──
function renderWizStep3(panel) {
    const file = NT.wizFile;
    const fileInfo = getFileTypeInfo(file?.type || '', file?.name || '');
    const desc = NT.wizDescription || 'No description';
    const docTypeNames = ['General', 'Contract', 'Identity', 'Diploma', 'Property', 'Financial', 'Legal', 'Medical', 'IP', 'Other'];

    const ethFmt = ethers ? ethers.formatEther(NT.ethFee) : '0.0001';
    const uploadCostFmt = NT.wizUploadCost ? NT.wizUploadCost.costFormatted : '~0 ETH';

    panel.innerHTML = `
        <div style="max-width:420px;margin:0 auto;text-align:center">
            <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:4px">Confirm & Mint</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-bottom:20px">Review and sign to create your certificate</div>

            <div style="background:var(--nt-bg3);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:16px;text-align:left;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--nt-border);margin-bottom:12px">
                    <div style="width:44px;height:44px;border-radius:var(--nt-radius-sm);background:${fileInfo.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="${fileInfo.icon}" style="font-size:18px;color:${fileInfo.color}"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file?.name}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${formatFileSize(file?.size || 0)} &middot; ${docTypeNames[NT.wizDocType] || 'General'}</div>
                    </div>
                </div>
                <div style="font-size:12px;color:var(--nt-text-2);font-style:italic">"${desc}"</div>
                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);margin-top:8px;word-break:break-all">
                    <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>${NT.wizFileHash}
                </div>
            </div>

            <div class="nt-fee-box" style="margin-bottom:20px">
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">Arweave Storage</span>
                    <span style="font-size:14px;font-weight:700;color:#22d3ee;font-family:monospace">${uploadCostFmt}</span>
                </div>
                <div class="nt-fee-row">
                    <span style="font-size:13px;color:var(--nt-text-2)">Certification Fee</span>
                    <span style="font-size:14px;font-weight:700;color:var(--nt-blue);font-family:monospace">${ethFmt} ETH</span>
                </div>
            </div>

            <div style="display:flex;gap:10px">
                <button class="nt-btn-secondary" style="flex:1" onclick="NotaryPage.wizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button class="nt-btn-primary" style="flex:2" id="nt-btn-mint" onclick="NotaryPage.handleMint()">
                    <i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// MINT HANDLER
// ============================================================================
async function handleMint() {
    if (NT.isProcessing) return;
    NT.isProcessing = true;

    const btn = document.getElementById('nt-btn-mint');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Uploading...'; }

    showOverlay('uploading');

    try {
        // 1. Upload to Arweave via Irys (user pays ETH directly from MetaMask)
        NT.processStep = 'UPLOADING';
        const uploadResult = await irysUploadFile(NT.wizFile, {
            tags: [
                { name: 'Type', value: 'notary-document' },
                { name: 'Doc-Type', value: String(NT.wizDocType) },
                { name: 'File-Name', value: NT.wizFile.name }
            ],
            onProgress: (phase, detail) => {
                if (phase === 'funding') showOverlay('funding');
                else if (phase === 'uploading') showOverlay('uploading');
            }
        });

        console.log('[NotaryPage] Arweave upload:', uploadResult.url);

        // 2. Certify on blockchain
        NT.processStep = 'MINTING';
        showOverlay('minting');

        const meta = JSON.stringify({
            uri: `ar://${uploadResult.id}`,
            name: NT.wizFile.name,
            size: NT.wizFile.size,
            type: NT.wizFile.type,
            desc: NT.wizDescription || ''
        });

        await NotaryTx.certify({
            documentHash: NT.wizFileHash,
            meta,
            docType: NT.wizDocType,
            operator: resolveOperator(),
            button: btn,

            onSuccess: (receipt, tokenId) => {
                NT.processStep = 'SUCCESS';
                showOverlay('success', tokenId);

                setTimeout(() => {
                    hideOverlay();
                    NT.wizFile = null;
                    NT.wizFileHash = null;
                    NT.wizDescription = '';
                    NT.wizDuplicateCheck = null;
                    NT.wizDocType = 0;
                    NT.wizUploadCost = null;
                    NT.wizStep = 1;
                    NT.isProcessing = false;

                    NT.view = 'documents';
                    NT.activeTab = 'documents';
                    renderHeader();
                    renderContent();
                    loadCertificates();

                    showToast('Document certified on Arweave + Blockchain!', 'success');
                }, 3000);
            },

            onError: (error) => {
                if (error.cancelled || error.type === 'user_rejected') {
                    NT.isProcessing = false;
                    hideOverlay();
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'; }
                    return;
                }
                throw error;
            }
        });

    } catch (e) {
        console.error('[NotaryPage] Mint error:', e);
        hideOverlay();
        NT.isProcessing = false;
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-stamp" style="margin-right:6px"></i>Sign & Mint'; }
        if (e.code !== 4001 && e.code !== 'ACTION_REJECTED') {
            showToast(e.message || 'Certification failed', 'error');
        }
    }
}

// ============================================================================
// PROCESSING OVERLAY
// ============================================================================
function showOverlay(step, tokenId) {
    const overlay = document.getElementById('nt-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    const configs = {
        uploading: { icon: 'fa-solid fa-cloud-arrow-up', text: 'Uploading to Arweave...', sub: 'Permanent decentralized storage', pct: 20 },
        funding: { icon: 'fa-solid fa-wallet', text: 'Funding storage...', sub: 'Confirm in MetaMask', pct: 15, animate: true },
        minting: { icon: 'fa-solid fa-stamp', text: 'Certifying on Blockchain...', sub: 'Waiting for confirmation', pct: 65, animate: true },
        success: { icon: 'fa-solid fa-check', text: 'Certified!', sub: tokenId ? `Certificate #${tokenId}` : 'Certificate created', pct: 100, success: true }
    };

    const cfg = configs[step] || configs.signing;

    overlay.innerHTML = `
        <div style="text-align:center;padding:24px;max-width:360px">
            <div style="width:100px;height:100px;margin:0 auto 24px;position:relative">
                ${!cfg.success ? `
                    <div style="position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--nt-accent);border-right-color:rgba(245,158,11,0.3);animation:nt-spin 1s linear infinite"></div>
                ` : ''}
                <div style="width:100%;height:100%;border-radius:50%;background:${cfg.success ? 'rgba(34,197,94,0.15)' : 'var(--nt-bg3)'};display:flex;align-items:center;justify-content:center;border:2px solid ${cfg.success ? 'var(--nt-green)' : 'rgba(245,158,11,0.2)'}">
                    <i class="${cfg.icon}" style="font-size:36px;color:${cfg.success ? 'var(--nt-green)' : 'var(--nt-accent)'};${cfg.animate ? 'animation:nt-stamp 0.6s ease' : ''}"></i>
                </div>
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--nt-text);margin-bottom:6px">${cfg.text}</div>
            <div style="font-size:12px;color:${cfg.success ? 'var(--nt-green)' : 'var(--nt-accent)'};font-family:monospace;margin-bottom:16px">${cfg.sub}</div>
            <div style="width:100%;height:4px;background:var(--nt-bg3);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${cfg.pct}%;background:linear-gradient(90deg,var(--nt-accent),${cfg.success ? 'var(--nt-green)' : '#fbbf24'});border-radius:2px;transition:width 0.5s ease"></div>
            </div>
            ${!cfg.success ? '<div style="font-size:10px;color:var(--nt-text-3);margin-top:12px">Do not close this window</div>' : ''}
        </div>
    `;

    // Add spin keyframe if not present
    if (!document.getElementById('nt-spin-kf')) {
        const s = document.createElement('style');
        s.id = 'nt-spin-kf';
        s.textContent = '@keyframes nt-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(s);
    }
}

function hideOverlay() {
    const overlay = document.getElementById('nt-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ============================================================================
// VERIFY TAB (Public — No wallet needed)
// ============================================================================
function renderVerify(el) {
    el.innerHTML = `
        <div class="nt-card" style="margin-top:16px">
            <div style="text-align:center;margin-bottom:20px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-shield-check" style="font-size:22px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">Public Verification</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px;max-width:380px;margin-left:auto;margin-right:auto">
                    Verify if a document was notarized on the blockchain. <strong style="color:var(--nt-green)">No wallet needed.</strong>
                </div>
            </div>

            <div class="nt-dropzone" id="nt-verify-dropzone" style="margin-bottom:16px">
                <input type="file" id="nt-verify-file-input" style="display:none">
                <div style="width:48px;height:48px;border-radius:var(--nt-radius);background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:20px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--nt-text);margin-bottom:4px">Drag a file to verify</div>
                <div style="font-size:11px;color:var(--nt-text-3)">The SHA-256 hash will be computed locally</div>
            </div>

            <div id="nt-verify-result"></div>
        </div>
    `;

    initVerifyDropzone();
    if (NT.verifyResult) renderVerifyResult();
}

function initVerifyDropzone() {
    const dropzone = document.getElementById('nt-verify-dropzone');
    const fileInput = document.getElementById('nt-verify-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.onclick = () => fileInput.click();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        dropzone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); });
    });
    dropzone.addEventListener('dragenter', () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragover',  () => dropzone.classList.add('drag-over'));
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
        dropzone.classList.remove('drag-over');
        handleVerifyFile(e.dataTransfer?.files?.[0]);
    });
    fileInput.addEventListener('change', e => handleVerifyFile(e.target.files?.[0]));
}

async function handleVerifyFile(file) {
    if (!file) return;
    NT.verifyFile = file;
    NT.verifyHash = null;
    NT.verifyResult = null;
    NT.verifyIsChecking = true;

    const resultEl = document.getElementById('nt-verify-result');
    if (resultEl) {
        resultEl.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>Computing hash and verifying...
            </div>
        `;
    }

    try {
        const hash = await NotaryTx.calculateFileHash(file);
        NT.verifyHash = hash;

        const result = await NotaryTx.verifyByHash(hash);
        NT.verifyResult = result;
        NT.verifyIsChecking = false;
        renderVerifyResult();
    } catch (err) {
        console.error('[NotaryPage] Verify error:', err);
        NT.verifyIsChecking = false;
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="nt-not-found" style="text-align:center">
                    <i class="fa-solid fa-circle-xmark" style="font-size:20px;color:var(--nt-red);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-red)">Verification error: ${err.message}</div>
                </div>
            `;
        }
    }
}

function renderVerifyResult() {
    const resultEl = document.getElementById('nt-verify-result');
    if (!resultEl || !NT.verifyResult) return;

    const r = NT.verifyResult;
    const file = NT.verifyFile;

    if (r.exists) {
        resultEl.innerHTML = `
            <div class="nt-verified">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="fa-solid fa-shield-check" style="font-size:18px;color:var(--nt-green)"></i>
                    </div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--nt-green)">Document Verified!</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">This document was notarized on the blockchain</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Token ID</div>
                        <div style="font-size:16px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${r.tokenId}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Data</div>
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${formatDateFull(r.timestamp)}</div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px;margin-bottom:12px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${r.owner}</div>
                </div>

                ${NT.verifyHash ? `
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${NT.verifyHash}</div>
                    </div>
                ` : ''}

                <div style="margin-top:12px;display:flex;gap:8px">
                    <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${r.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                    </a>
                </div>
            </div>
        `;
    } else {
        resultEl.innerHTML = `
            <div class="nt-not-found">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="fa-solid fa-circle-xmark" style="font-size:18px;color:var(--nt-red)"></i>
                    </div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--nt-red)">Not Found</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">This document was not notarized on the blockchain</div>
                    </div>
                </div>

                ${file ? `<div style="font-size:12px;color:var(--nt-text-3);margin-bottom:8px">File: <strong style="color:var(--nt-text-2)">${file.name}</strong></div>` : ''}
                ${NT.verifyHash ? `
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SHA-256 Hash</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${NT.verifyHash}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// ============================================================================
// STATS TAB
// ============================================================================
function renderStats(el) {
    if (NT.statsLoading && !NT.stats) {
        el.innerHTML = `
            <div class="nt-stat-grid" style="margin-top:16px">
                ${Array(4).fill('').map(() => '<div class="nt-stat-card"><div class="nt-shimmer" style="height:32px;width:60%;margin:0 auto 8px"></div><div class="nt-shimmer" style="height:12px;width:40%;margin:0 auto"></div></div>').join('')}
            </div>
        `;
        return;
    }

    const stats = NT.stats;
    const supply = NT.totalSupply;

    el.innerHTML = `
        <div style="margin-top:16px">
            <div class="nt-stat-grid">
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--nt-accent-glow);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-stamp" style="font-size:16px;color:var(--nt-accent)"></i>
                    </div>
                    <div class="nt-stat-value">${stats?.totalNotarizations ?? '—'}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">Notarizations</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-certificate" style="font-size:16px;color:var(--nt-green)"></i>
                    </div>
                    <div class="nt-stat-value">${supply ?? '—'}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">Certificates</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(251,191,36,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-solid fa-coins" style="font-size:16px;color:#fbbf24"></i>
                    </div>
                    <div class="nt-stat-value" style="font-size:18px">${stats?.totalBKCFormatted ?? '—'}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">BKC Collected</div>
                </div>
                <div class="nt-stat-card">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(96,165,250,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px">
                        <i class="fa-brands fa-ethereum" style="font-size:16px;color:var(--nt-blue)"></i>
                    </div>
                    <div class="nt-stat-value" style="font-size:18px">${stats?.totalETHFormatted ?? '—'}</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">ETH Collected</div>
                </div>
            </div>

            <!-- Recent notarizations -->
            <div class="nt-card" style="margin-top:16px;padding:0;overflow:hidden">
                <div style="padding:16px 20px;border-bottom:1px solid var(--nt-border)">
                    <div style="font-size:13px;font-weight:700;color:var(--nt-text)">
                        <i class="fa-solid fa-clock-rotate-left" style="color:var(--nt-accent);margin-right:6px"></i>Recent Notarizations
                    </div>
                </div>
                <div id="nt-recent-feed">
                    ${NT.recentNotarizations.length === 0 ? `
                        <div style="text-align:center;padding:32px 20px;color:var(--nt-text-3);font-size:13px">
                            ${NT.statsLoading ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Loading...' : 'No recent notarizations found'}
                        </div>
                    ` : NT.recentNotarizations.map(item => `
                        <div class="nt-recent-item">
                            <div style="width:36px;height:36px;border-radius:50%;background:var(--nt-accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <i class="fa-solid fa-stamp" style="font-size:14px;color:var(--nt-accent)"></i>
                            </div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:12px;font-weight:600;color:var(--nt-text)">Certificate #${item.tokenId}</div>
                                <div style="font-size:11px;color:var(--nt-text-3)">${shortenAddress(item.owner)}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                <div style="font-size:11px;color:var(--nt-text-3)">${formatTimestamp(item.timestamp)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="text-align:center;margin-top:16px">
                <a href="${EXPLORER_ADDR}${addresses?.notary}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:10px 20px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View Contract on Arbiscan
                </a>
            </div>
        </div>
    `;
}

// ============================================================================
// CERTIFICATE DETAIL VIEW
// ============================================================================
function renderCertDetail(el) {
    const cert = NT.selectedCert;
    if (!cert) { goBack(); return; }

    const ipfsUrl = resolveStorageUrl(cert.ipfs);
    const fileInfo = getFileTypeInfo(cert.mimeType || '', cert.description || '');
    const isImage = (cert.mimeType || '').includes('image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(cert.fileName || cert.description || '');

    el.innerHTML = `
        <div class="nt-detail" style="margin-top:8px">
            <!-- Image Preview (large, clickable) -->
            ${ipfsUrl ? `
                <a href="${ipfsUrl}" target="_blank" style="display:block;text-decoration:none;margin-bottom:16px">
                    <div style="min-height:240px;max-height:400px;background:var(--nt-bg3);border-radius:var(--nt-radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid var(--nt-border);cursor:pointer;transition:border-color var(--nt-transition)" onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'" onmouseout="this.style.borderColor='var(--nt-border)'">
                        <img src="${ipfsUrl}" style="width:100%;height:100%;object-fit:contain;max-height:400px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="Certificate #${cert.id}">
                        <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:240px;position:absolute;inset:0;background:var(--nt-bg3)">
                            <i class="${fileInfo.icon}" style="font-size:48px;color:${fileInfo.color};margin-bottom:8px"></i>
                            <span style="font-size:12px;color:var(--nt-text-3)">${fileInfo.label} file</span>
                        </div>
                        <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${cert.id}</div>
                        <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.75);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--nt-text-2)">
                            <i class="fa-solid fa-expand" style="margin-right:4px"></i>Click to view full size
                        </div>
                    </div>
                </a>
            ` : `
                <div style="height:200px;background:var(--nt-bg3);border-radius:var(--nt-radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:16px;border:1px solid var(--nt-border)">
                    <div style="text-align:center">
                        <i class="${fileInfo.icon}" style="font-size:48px;color:${fileInfo.color};margin-bottom:8px"></i>
                        <div style="font-size:12px;color:var(--nt-text-3)">${fileInfo.label} file</div>
                    </div>
                    <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${cert.id}</div>
                </div>
            `}

            <!-- Share Certificate — Primary Action -->
            <button class="nt-btn-primary" style="width:100%;padding:14px;font-size:15px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="NotaryPage.addToWallet('${cert.id}')">
                <i class="fa-solid fa-share-nodes"></i>Copy Certificate Link
            </button>

            <!-- Description -->
            <div class="nt-card" style="margin-bottom:12px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Description</div>
                <div style="font-size:14px;color:var(--nt-text);line-height:1.5">${cert.description || 'Notarized Document'}</div>
                ${cert.fileName ? `<div style="font-size:12px;color:var(--nt-text-2);margin-top:6px"><i class="${fileInfo.icon}" style="margin-right:4px;color:${fileInfo.color}"></i>${cert.fileName}</div>` : ''}
            </div>

            <!-- Content Hash -->
            <div class="nt-card" style="margin-bottom:12px">
                <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
                    <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>Content Hash (SHA-256)
                </div>
                <div class="nt-hash-display" onclick="NotaryPage.copyHash('${cert.hash}')" title="Click to copy">
                    ${cert.hash || 'N/A'}
                    <i class="fa-regular fa-copy" style="float:right;margin-top:2px;color:var(--nt-accent)"></i>
                </div>
            </div>

            <!-- Metadata grid -->
            <div class="nt-detail-meta" style="margin-bottom:12px">
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Date</div>
                    <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${formatDateFull(cert.timestamp) || 'N/A'}</div>
                </div>
                <div class="nt-card" style="padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Owner</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${shortenAddress(cert.owner || State.userAddress)}</div>
                </div>
            </div>

            ${cert.ipfs ? `
                <div class="nt-card" style="margin-bottom:12px;padding:14px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Storage URI</div>
                    <div style="font-size:11px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${cert.ipfs}</div>
                </div>
            ` : ''}

            <!-- Secondary Actions -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                ${ipfsUrl ? `
                    <a href="${ipfsUrl}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-download"></i>Download
                    </a>
                ` : ''}
                <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${cert.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Arbiscan
                </a>
                ${cert.txHash ? `
                    <a href="${EXPLORER_TX}${cert.txHash}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                        <i class="fa-solid fa-receipt"></i>Transaction
                    </a>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadFees(docType = 0) {
    try {
        const result = await NotaryTx.getCertifyFee(docType);
        NT.ethFee = result.fee;
        NT.feesLoaded = true;
    } catch {
        NT.ethFee = ethers?.parseEther('0.0001') || 0n;
        NT.feesLoaded = true;
    }

    // Also calculate Arweave upload cost if file is selected
    if (NT.wizFile?.size) {
        try {
            NT.wizUploadCost = await getUploadPrice(NT.wizFile.size);
        } catch (e) {
            console.warn('[NotaryPage] Could not estimate upload cost:', e.message);
            NT.wizUploadCost = null;
        }
    }
}

async function loadCertificates() {
    if (!State.isConnected || !State.userAddress) return;

    NT.certsLoading = true;
    renderContent();

    // Primary strategy: read directly from contract (no events, no block range issues)
    try {
        const certs = await loadCertificatesFromContract();
        NT.certificates = certs;
        console.log('[NotaryPage] Loaded', certs.length, 'certificates from contract');
    } catch (err) {
        console.error('[NotaryPage] Contract load failed:', err);
        NT.certificates = [];
    }

    NT.certsLoading = false;
    renderContent();
}

async function loadCertificatesFromContract() {
    const total = await NotaryTx.getTotalDocuments();
    if (total === 0) return [];

    console.log(`[NotaryPage] Total certs on-chain: ${total}, scanning for owner: ${State.userAddress}`);

    // Load all certs in batches of 50 and filter by owner
    const userAddr = State.userAddress.toLowerCase();
    const userCerts = [];
    const BATCH = 50;

    for (let start = 1; start <= total; start += BATCH) {
        const count = Math.min(BATCH, total - start + 1);
        const batch = await NotaryTx.getCertificatesBatch(start, count);
        for (const cert of batch) {
            if (cert.owner?.toLowerCase() === userAddr) {
                userCerts.push(cert);
            }
        }
    }

    // Enrich with metadata (description) via individual getCertificate calls
    const enriched = [];
    for (const cert of userCerts) {
        try {
            const detail = await NotaryTx.getCertificate(cert.id);
            const parsed = parseMetaJson(detail?.meta || '');
            enriched.push({
                id: cert.id,
                hash: cert.documentHash || detail?.documentHash || '',
                description: parsed.desc || parsed.name || '',
                docType: cert.docType ?? detail?.docType ?? 0,
                timestamp: cert.timestamp || detail?.timestamp || 0,
                owner: cert.owner,
                isBoosted: cert.isBoosted || detail?.isBoosted || false,
                boostExpiry: cert.boostExpiry || detail?.boostExpiry || 0,
                ipfs: parsed.uri || extractStorageUri(detail?.meta || ''),
                mimeType: parsed.type || '',
                fileName: parsed.name || '',
                rawMeta: detail?.meta || '',
                txHash: ''
            });
        } catch {
            enriched.push({
                id: cert.id,
                hash: cert.documentHash || '',
                description: '',
                docType: cert.docType ?? 0,
                timestamp: cert.timestamp || 0,
                owner: cert.owner,
                ipfs: '',
                txHash: ''
            });
        }
    }

    return enriched.sort((a, b) => b.id - a.id);
}

/**
 * Parse metadata JSON string from contract.
 * Format: {"uri":"ar://...","name":"file.png","size":123,"type":"image/png","desc":"..."}
 * Falls back to empty object if not valid JSON.
 */
function parseMetaJson(meta) {
    if (!meta) return {};
    try {
        // Try JSON parse first
        if (meta.trim().startsWith('{')) {
            return JSON.parse(meta);
        }
    } catch {}
    // Not JSON — treat as plain description
    return { desc: meta };
}

function extractStorageUri(meta) {
    if (!meta) return '';
    // Try JSON parse first
    try {
        if (meta.trim().startsWith('{')) {
            const obj = JSON.parse(meta);
            if (obj.uri) return obj.uri;
        }
    } catch {}
    // Regex fallback for ar://, ipfs://, CIDs
    const arMatch = meta.match(/ar:\/\/[a-zA-Z0-9_-]{43,44}/);
    if (arMatch) return arMatch[0];
    const ipfsMatch = meta.match(/ipfs:\/\/\S+/);
    if (ipfsMatch) return ipfsMatch[0];
    const cidMatch = meta.match(/\b(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy\S+)\b/);
    if (cidMatch) return cidMatch[1];
    // If meta contains --- separator, the part after might be a storage URI
    if (meta.includes('---')) {
        const parts = meta.split('---');
        const uri = parts[parts.length - 1].trim();
        if (uri.length > 10) return uri;
    }
    return '';
}

async function loadStats() {
    NT.statsLoading = true;

    try {
        const [stats, supply] = await Promise.all([
            NotaryTx.getStats(),
            NotaryTx.getTotalDocuments()
        ]);

        NT.stats = stats;
        NT.totalSupply = supply;
    } catch (err) {
        console.warn('[NotaryPage] Stats load error:', err);
    }

    // Load recent notarizations from events
    try {
        await loadRecentNotarizations();
    } catch {}

    NT.statsLoading = false;

    // Re-render if on stats tab
    if (NT.view === 'stats') renderContent();
}

async function loadRecentNotarizations() {
    if (!ethers || !addresses?.notary) return;

    const { NetworkManager } = await import('../modules/core/index.js');
    const provider = NetworkManager.getProvider();
    if (!provider) return;

    const contract = new ethers.Contract(addresses.notary, NOTARY_ABI_EVENTS, provider);
    const filter = contract.filters.Certified();

    const currentBlock = await provider.getBlockNumber();
    // Arbitrum ~250ms/block → 10M blocks ≈ 29 days
    const fromBlock = Math.max(0, currentBlock - 10_000_000);

    const events = await contract.queryFilter(filter, fromBlock, currentBlock);

    // Get 20 most recent
    const recent = events.slice(-20).reverse();

    // V9: Certified event args: certId, owner, documentHash, docType, operator
    NT.recentNotarizations = recent.map(ev => ({
        tokenId: Number(ev.args.certId),
        owner: ev.args.owner,
        hash: ev.args.documentHash,
        docType: Number(ev.args.docType || 0),
        timestamp: null,
        blockNumber: ev.blockNumber
    }));

    // Try to get timestamps from blocks (batch)
    try {
        const uniqueBlocks = [...new Set(recent.map(e => e.blockNumber))];
        const blockData = {};
        await Promise.all(uniqueBlocks.slice(0, 10).map(async bn => {
            const block = await provider.getBlock(bn);
            if (block) blockData[bn] = block.timestamp;
        }));

        NT.recentNotarizations.forEach(item => {
            if (blockData[item.blockNumber]) {
                item.timestamp = blockData[item.blockNumber];
            }
        });
    } catch {}
}

// ============================================================================
// SHARE / COPY CERTIFICATE LINK
// ============================================================================
function addToWallet(tokenId) {
    // Notary is NOT an ERC-721, so wallet_watchAsset won't work.
    // Instead, copy a shareable Arbiscan verification link.
    const contractAddress = addresses?.notary;
    if (!contractAddress) {
        showToast('Contract address not found', 'error');
        return;
    }
    const url = `${EXPLORER_ADDR}${contractAddress}?a=${tokenId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast(`Certificate #${tokenId} link copied!`, 'success');
    }).catch(() => {
        window.open(url, '_blank');
    });
}

// ============================================================================
// CLIPBOARD
// ============================================================================
function copyHash(hash) {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
        showToast('Hash copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// ============================================================================
// WIZARD NAVIGATION HANDLERS
// ============================================================================
function wizNext() {
    if (NT.wizStep === 1 && NT.wizFileHash && !NT.wizDuplicateCheck?.exists) {
        NT.wizStep = 2;
    } else if (NT.wizStep === 2) {
        NT.wizStep = 3;
    }
    renderContent();
}

function wizBack() {
    if (NT.wizStep > 1) {
        NT.wizStep--;
        renderContent();
    }
}

function wizToStep3() {
    const descInput = document.getElementById('nt-wiz-desc');
    if (descInput) NT.wizDescription = descInput.value || '';
    NT.wizStep = 3;
    renderContent();
}

function onDocTypeChange(value) {
    NT.wizDocType = parseInt(value) || 0;
    // Recalculate fee for new doc type
    loadFees(NT.wizDocType).then(() => {
        const panel = document.getElementById('nt-wiz-panel');
        if (panel && NT.wizStep === 2) renderWizStep2(panel);
    });
}

function wizRemoveFile() {
    NT.wizFile = null;
    NT.wizFileHash = null;
    NT.wizDuplicateCheck = null;
    NT.wizStep = 1;
    renderContent();
}

function viewCert(id) {
    const cert = NT.certificates.find(c => String(c.id) === String(id));
    if (cert) {
        navigateView('cert-detail', cert);
    }
}

// ============================================================================
// EXPORT
// ============================================================================
export const NotaryPage = {
    async render(isActive) {
        if (!isActive) return;
        render(isActive);
    },

    reset() {
        NT.wizFile = null;
        NT.wizFileHash = null;
        NT.wizDescription = '';
        NT.wizDuplicateCheck = null;
        NT.wizStep = 1;
        NT.view = 'documents';
        NT.activeTab = 'documents';
        NT.viewHistory = [];
        renderContent();
        renderHeader();
    },

    update() {
        if (!NT.isProcessing && NT.view === 'notarize') {
            const panel = document.getElementById('nt-wiz-panel');
            if (panel && NT.wizStep === 2) renderWizStep2(panel);
        }
    },

    refreshHistory() {
        loadCertificates();
    },

    // Public API for onclick handlers
    setTab,
    goBack,
    viewCert,
    handleMint,
    addToWallet,
    copyHash,
    wizNext,
    wizBack,
    wizToStep3,
    wizRemoveFile,
    onDocTypeChange
};

window.NotaryPage = NotaryPage;
