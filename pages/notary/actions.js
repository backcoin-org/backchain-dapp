// pages/notary/actions.js
// Notary V10 — Navigation + action handlers
// ============================================================================

import { NotaryTx } from '../../modules/transactions/index.js';
import { resolveOperator } from '../../modules/core/operator.js';
import { irysUploadFile } from '../../modules/core/index.js';
import { showToast } from '../../ui-feedback.js';
import { addresses } from '../../config.js';
import { NT, EXPLORER_ADDR } from './state.js';
import { showOverlay, hideOverlay } from './overlay.js';
import { loadFees, loadCertificates } from './data-loader.js';

// ============================================================================
// NAVIGATION
// ============================================================================

export function navigateView(view, data) {
    NT.viewHistory.push({ view: NT.view, data: NT.selectedCert });
    NT.view = view;
    if (view !== 'cert-detail') NT.activeTab = view;
    if (data) NT.selectedCert = data;
    NT._render();
    NT._renderHeader();
}

export function goBack() {
    const prev = NT.viewHistory.pop();
    if (prev) {
        NT.view = prev.view;
        NT.activeTab = prev.view === 'cert-detail' ? 'documents' : prev.view;
        NT.selectedCert = prev.data;
    } else {
        NT.view = 'documents';
        NT.activeTab = 'documents';
    }
    NT._render();
    NT._renderHeader();
}

export function setTab(tab) {
    if (NT.activeTab === tab && NT.view === tab) return;
    NT.viewHistory = [];
    NT.view = tab;
    NT.activeTab = tab;
    NT._render();
    NT._renderHeader();
}

export function viewCert(id) {
    const cert = NT.certificates.find(c => String(c.id) === String(id));
    if (cert) {
        navigateView('cert-detail', cert);
    }
}

// ============================================================================
// WIZARD NAVIGATION
// ============================================================================

export function wizNext() {
    if (NT.wizStep === 1 && NT.wizFileHash && !NT.wizDuplicateCheck?.exists) {
        NT.wizStep = 2;
    } else if (NT.wizStep === 2) {
        NT.wizStep = 3;
    }
    NT._render();
}

export function wizBack() {
    if (NT.wizStep > 1) {
        NT.wizStep--;
        NT._render();
    }
}

export function wizToStep3() {
    const descInput = document.getElementById('nt-wiz-desc');
    if (descInput) NT.wizDescription = descInput.value || '';
    NT.wizStep = 3;
    NT._render();
}

export function wizRemoveFile() {
    NT.wizFile = null;
    NT.wizFileHash = null;
    NT.wizDuplicateCheck = null;
    NT.wizStep = 1;
    NT._render();
}

export function onDocTypeChange(value) {
    NT.wizDocType = parseInt(value) || 0;
    // Preserve current description before re-render
    const descInput = document.getElementById('nt-wiz-desc');
    if (descInput) NT.wizDescription = descInput.value || '';
    loadFees(NT.wizDocType).then(() => NT._render());
}

// ============================================================================
// MINT HANDLER
// ============================================================================

export async function handleMint() {
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
            onProgress: (phase) => {
                if (phase === 'funding') showOverlay('funding');
                else if (phase === 'uploading') showOverlay('uploading');
            }
        });

        console.log('[NotaryPage] Arweave upload:', uploadResult.url);

        // 2. Certify on blockchain
        NT.processStep = 'MINTING';
        showOverlay('minting');

        const meta = JSON.stringify({
            uri: `ipfs://${uploadResult.id}`,
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
                    NT._renderHeader();
                    NT._render();
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
// TRANSFER
// ============================================================================

export function toggleTransferForm() {
    const form = document.getElementById('nt-transfer-form');
    if (!form) return;
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        const input = document.getElementById('nt-transfer-addr');
        if (input) { input.value = ''; input.focus(); }
    }
}

export async function handleTransfer() {
    const input = document.getElementById('nt-transfer-addr');
    const btn = document.getElementById('nt-btn-transfer');
    const newOwner = input?.value?.trim();
    const ethers = window.ethers;

    if (!newOwner || !ethers.isAddress(newOwner)) {
        showToast('Enter a valid wallet address', 'error');
        return;
    }

    const cert = NT.selectedCert;
    if (!cert?.hash) {
        showToast('Certificate not found', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Transferring...'; }

    try {
        await NotaryTx.transferCertificate({
            documentHash: cert.hash,
            newOwner,
            operator: resolveOperator(),
            button: btn,

            onSuccess: (receipt) => {
                showToast(`Certificate #${cert.id} transferred!`, 'success');
                // Update local state
                cert.owner = newOwner;
                NT.selectedCert = cert;
                loadCertificates();
                NT._render();
            },

            onError: (error) => {
                if (error.cancelled || error.type === 'user_rejected') {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:6px"></i>Transfer'; }
                    return;
                }
                throw error;
            }
        });
    } catch (e) {
        console.error('[NotaryPage] Transfer error:', e);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:6px"></i>Transfer'; }
        if (e.code !== 4001 && e.code !== 'ACTION_REJECTED') {
            showToast(e.message || 'Transfer failed', 'error');
        }
    }
}

// ============================================================================
// CLIPBOARD / SHARE
// ============================================================================

export function addToWallet(tokenId) {
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

export function copyHash(hash) {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
        showToast('Hash copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}
