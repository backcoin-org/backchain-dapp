// pages/notary/NotaryPage.js
// Notary V10 — Main orchestrator
// ============================================================================

import { NT } from './state.js';
import { injectStyles } from './styles.js';
import { loadFees, loadCertificates, loadStats } from './data-loader.js';
import { navigateView, goBack, setTab, viewCert, handleMint, wizNext, wizBack, wizToStep3, wizRemoveFile, onDocTypeChange, importToWallet, shareLink, copyHash, viewDocument, toggleTransferForm, handleTransfer, showCertCard, hideNftCard } from './actions.js';
import { renderDocuments } from './documents.js';
import { renderNotarize, renderWizStep2 } from './wizard.js';
import { renderVerify } from './verify.js';
import { renderStats } from './stats.js';
import { renderCertDetail } from './cert-detail.js';

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

// Connect callbacks so modules can trigger re-renders
NT._render = renderContent;
NT._renderHeader = renderHeader;

// ============================================================================
// MAIN RENDER
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

    // Navigation
    setTab,
    goBack,
    viewCert,

    // Wizard
    wizNext,
    wizBack,
    wizToStep3,
    wizRemoveFile,
    onDocTypeChange,
    handleMint,

    // Document / Transfer
    viewDocument,
    toggleTransferForm,
    handleTransfer,

    // NFT Card
    showCertCard,
    hideNftCard,

    // Wallet / Share
    importToWallet,
    shareLink,
    copyHash
};

// Expose globally for inline onclick handlers
window.NotaryPage = NotaryPage;
