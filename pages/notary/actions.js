// pages/notary/actions.js
// Notary V10 — Navigation + action handlers
// ============================================================================

import { NotaryTx } from '../../modules/transactions/index.js';
import { resolveOperator } from '../../modules/core/operator.js';
import { irysUploadFile } from '../../modules/core/index.js';
import { showToast } from '../../ui-feedback.js';
import { addresses } from '../../config.js';
import { NT, EXPLORER_ADDR } from './state.js';
import { resolveStorageUrl, getFileTypeInfo } from './utils.js';
import { showOverlay, hideOverlay, showNftCard } from './overlay.js';
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
// NFT CARD OVERLAY
// ============================================================================

export function showCertCard() {
    const cert = NT.selectedCert;
    if (!cert) return;

    const imageUrl = resolveStorageUrl(cert.ipfs);
    const fileInfo = getFileTypeInfo(cert.mimeType || '', cert.description || '');
    showNftCard(cert, imageUrl, fileInfo);
}

export function hideNftCard() {
    hideOverlay();
}

// ============================================================================
// VIEW DOCUMENT
// ============================================================================

export function viewDocument() {
    const cert = NT.selectedCert;
    if (!cert) return;

    const url = resolveStorageUrl(cert.ipfs);
    if (url) {
        window.open(url, '_blank');
    } else {
        const contractAddress = addresses?.notary;
        if (contractAddress) {
            window.open(`${EXPLORER_ADDR}${contractAddress}?a=${cert.id}`, '_blank');
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

export async function addToWallet(tokenId) {
    const contractAddress = addresses?.notary;
    if (!contractAddress) {
        showToast('Contract address not found', 'error');
        return;
    }

    // Try wallet_watchAsset first (experimental ERC721 support)
    let autoAdded = false;
    if (window.ethereum) {
        try {
            autoAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC721',
                    options: {
                        address: contractAddress,
                        tokenId: String(tokenId),
                    },
                },
            });
        } catch (e) {
            console.warn('[Notary] wallet_watchAsset not supported:', e.message);
        }
    }

    if (autoAdded) {
        showToast(`Certificate #${tokenId} added to wallet!`, 'success');
        return;
    }

    // Show manual import instructions modal
    _showImportNftModal(contractAddress, tokenId);
}

function _showImportNftModal(contractAddress, tokenId) {
    let existing = document.getElementById('nt-import-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'nt-import-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div style="background:#1a1a20;border:1px solid rgba(255,255,255,0.1);border-radius:16px;max-width:400px;width:100%;padding:24px;animation:nt-scaleIn 0.2s ease-out;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <span style="font-size:16px;font-weight:700;color:#f4f4f5;"><i class="fa-solid fa-wallet" style="color:#f59e0b;margin-right:8px;"></i>Import NFT to Wallet</span>
                <button onclick="this.closest('#nt-import-modal').remove()" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:18px;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p style="font-size:13px;color:#a1a1aa;margin-bottom:16px;line-height:1.5;">
                Open MetaMask → <strong style="color:#f4f4f5;">NFTs tab</strong> → <strong style="color:#f4f4f5;">Import NFT</strong>, then paste:
            </p>
            <div style="margin-bottom:12px;">
                <label style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Contract Address</label>
                <div style="display:flex;gap:8px;margin-top:4px;">
                    <input readonly value="${contractAddress}" style="flex:1;background:#111115;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#f4f4f5;font-family:monospace;font-size:12px;outline:none;">
                    <button onclick="navigator.clipboard.writeText('${contractAddress}');this.innerHTML='<i class=\\'fa-solid fa-check\\'></i>';setTimeout(()=>this.innerHTML='<i class=\\'fa-solid fa-copy\\'></i>',1500)" style="background:#f59e0b;color:#000;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;font-size:14px;"><i class="fa-solid fa-copy"></i></button>
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <label style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Token ID</label>
                <div style="display:flex;gap:8px;margin-top:4px;">
                    <input readonly value="${tokenId}" style="flex:1;background:#111115;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#f4f4f5;font-family:monospace;font-size:18px;font-weight:700;outline:none;">
                    <button onclick="navigator.clipboard.writeText('${tokenId}');this.innerHTML='<i class=\\'fa-solid fa-check\\'></i>';setTimeout(()=>this.innerHTML='<i class=\\'fa-solid fa-copy\\'></i>',1500)" style="background:#f59e0b;color:#000;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;font-size:14px;"><i class="fa-solid fa-copy"></i></button>
                </div>
            </div>
            <button onclick="navigator.clipboard.writeText('${contractAddress}');this.closest('#nt-import-modal').remove();window.open('https://metamask.app.link','_blank');" style="width:100%;padding:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                <i class="fa-solid fa-up-right-from-square"></i> Open MetaMask
            </button>
        </div>`;

    document.body.appendChild(modal);
}

export function copyHash(hash) {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
        showToast('Hash copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}
