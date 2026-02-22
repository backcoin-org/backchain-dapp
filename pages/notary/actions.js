// pages/notary/actions.js
// Notary V5 — Cartório Digital — Navigation + action handlers
// ============================================================================

import { NotaryTx } from '../../modules/transactions/index.js';
import { resolveOperator } from '../../modules/core/operator.js';
import { irysUploadFile } from '../../modules/core/index.js';
import { showToast } from '../../ui-feedback.js';
import { addresses } from '../../config.js';
import { State } from '../../state.js';
import { NT, EXPLORER_ADDR } from './state.js';
import { resolveStorageUrl, getFileTypeInfo } from './utils.js';
import { showOverlay, hideOverlay, showNftCard } from './overlay.js';
import { loadFees, loadCertificates, loadAssets, loadAssetAnnotations } from './data-loader.js';

// ============================================================================
// NAVIGATION
// ============================================================================

export function navigateView(view, data) {
    NT.viewHistory.push({ view: NT.view, data: NT.selectedCert || NT.selectedAsset });
    NT.view = view;
    if (view !== 'cert-detail' && view !== 'asset-detail') NT.activeTab = view;
    if (data) {
        if (view === 'asset-detail') {
            NT.selectedAsset = data;
        } else {
            NT.selectedCert = data;
        }
    }
    NT._render();
    NT._renderHeader();
}

export function goBack() {
    const prev = NT.viewHistory.pop();
    if (prev) {
        NT.view = prev.view;
        NT.activeTab = (prev.view === 'cert-detail' || prev.view === 'asset-detail')
            ? (prev.view === 'asset-detail' ? 'assets' : 'documents')
            : prev.view;
        if (prev.data) {
            if (prev.view === 'asset-detail') NT.selectedAsset = prev.data;
            else NT.selectedCert = prev.data;
        }
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

export async function viewAsset(id) {
    const asset = NT.assets.find(a => String(a.id) === String(id));
    if (asset) {
        navigateView('asset-detail', asset);
        await loadAssetAnnotations(asset.id);
        NT._render();
    }
}

// ============================================================================
// WIZARD NAVIGATION (Document Certification)
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
// ASSET WIZARD NAVIGATION
// ============================================================================

export function assetWizNext() {
    if (NT.assetWizStep < 4) {
        NT.assetWizStep++;
        NT._render();
    }
}

export function assetWizBack() {
    if (NT.assetWizStep > 1) {
        NT.assetWizStep--;
        NT._render();
    }
}

export function assetWizReset() {
    NT.assetWizStep = 1;
    NT.assetWizType = 0;
    NT.assetWizDescription = '';
    NT.assetWizMeta = '';
    NT.assetWizFile = null;
    NT.assetWizFileHash = null;
    NT._render();
}

export function onAssetTypeChange(value) {
    NT.assetWizType = parseInt(value) || 0;
    NT._render();
}

export function onAssetDescChange(value) {
    NT.assetWizDescription = value || '';
}

export function onAssetMetaChange(value) {
    NT.assetWizMeta = value || '';
}

export function assetWizToStep3() {
    const descInput = document.getElementById('nt-asset-desc');
    if (descInput) NT.assetWizDescription = descInput.value || '';
    const metaInput = document.getElementById('nt-asset-meta');
    if (metaInput) NT.assetWizMeta = metaInput.value || '';
    if (!NT.assetWizDescription) return;
    NT.assetWizStep = 3;
    NT._render();
}

export function assetWizSkipDoc() {
    NT.assetWizFile = null;
    NT.assetWizFileHash = null;
    NT.assetWizStep = 4;
    NT._render();
}

export function assetWizToReview() {
    NT.assetWizStep = 4;
    NT._render();
}

export async function onAssetFileSelect(file) {
    if (!file) return;
    NT.assetWizFile = file;
    // Hash the file
    try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        NT.assetWizFileHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        NT.assetWizFileHash = null;
    }
    NT._render();
}

export function removeAssetFile() {
    NT.assetWizFile = null;
    NT.assetWizFileHash = null;
    NT._render();
}

export function toggleAssetTransferForm() {
    const form = document.getElementById('nt-asset-transfer-form');
    if (!form) return;
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    // Close annotation form if open
    const annForm = document.getElementById('nt-annotation-form');
    if (annForm && isHidden) annForm.style.display = 'none';
    if (isHidden) {
        const input = document.getElementById('nt-asset-transfer-addr');
        if (input) { input.value = ''; input.focus(); }
    }
}

export function toggleAnnotationForm() {
    const form = document.getElementById('nt-annotation-form');
    if (!form) return;
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    // Close transfer form if open
    const xferForm = document.getElementById('nt-asset-transfer-form');
    if (xferForm && isHidden) xferForm.style.display = 'none';
}

export function refreshAssets() {
    loadAssets();
}

// ============================================================================
// MINT HANDLER (Document Certification)
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
// REGISTER ASSET HANDLER
// ============================================================================

export async function handleRegisterAsset() {
    if (NT.isProcessing) return;
    NT.isProcessing = true;

    const btn = document.getElementById('nt-btn-register-asset');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Registering...'; }

    try {
        const meta = JSON.stringify({
            desc: NT.assetWizDescription || '',
            extra: NT.assetWizMeta || ''
        });

        const docHash = NT.assetWizFileHash || ('0x' + '0'.repeat(64));

        await NotaryTx.registerAsset({
            assetType: NT.assetWizType,
            meta,
            documentHash: docHash,
            operator: resolveOperator(),
            button: btn,

            onSuccess: (receipt, tokenId) => {
                showOverlay('asset-success', tokenId);

                setTimeout(() => {
                    hideOverlay();
                    assetWizReset();
                    NT.isProcessing = false;

                    NT.view = 'assets';
                    NT.activeTab = 'assets';
                    NT._renderHeader();
                    NT._render();
                    loadAssets();

                    showToast(`Asset #${tokenId} registered!`, 'success');
                }, 3000);
            },

            onError: (error) => {
                if (error.cancelled || error.type === 'user_rejected') {
                    NT.isProcessing = false;
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-signature" style="margin-right:6px"></i>Register Asset'; }
                    return;
                }
                throw error;
            }
        });

    } catch (e) {
        console.error('[NotaryPage] Register asset error:', e);
        NT.isProcessing = false;
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-signature" style="margin-right:6px"></i>Register Asset'; }
        if (e.code !== 4001 && e.code !== 'ACTION_REJECTED') {
            showToast(e.message || 'Registration failed', 'error');
        }
    }
}

// ============================================================================
// TRANSFER ASSET HANDLER
// ============================================================================

export async function handleTransferAsset() {
    const input = document.getElementById('nt-asset-transfer-addr');
    const valueInput = document.getElementById('nt-asset-transfer-value');
    const noteInput = document.getElementById('nt-asset-transfer-note');
    const btn = document.getElementById('nt-btn-transfer-asset');
    const newOwner = input?.value?.trim();
    const ethers = window.ethers;

    if (!newOwner || !ethers.isAddress(newOwner)) {
        showToast('Enter a valid wallet address', 'error');
        return;
    }

    const asset = NT.selectedAsset;
    if (!asset?.id) {
        showToast('Asset not found', 'error');
        return;
    }

    const declaredValue = valueInput?.value
        ? ethers.parseEther(valueInput.value)
        : 0n;
    const transferNote = noteInput?.value?.trim() || '';

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Transferring...'; }

    try {
        await NotaryTx.transferAsset({
            tokenId: asset.id,
            newOwner,
            declaredValue,
            meta: transferNote,
            operator: resolveOperator(),
            button: btn,

            onSuccess: (receipt) => {
                showToast(`Asset #${asset.id} transferred!`, 'success');
                asset.owner = newOwner;
                NT.selectedAsset = asset;
                loadAssets();
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
        console.error('[NotaryPage] Asset transfer error:', e);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:6px"></i>Transfer'; }
        if (e.code !== 4001 && e.code !== 'ACTION_REJECTED') {
            showToast(e.message || 'Transfer failed', 'error');
        }
    }
}

// ============================================================================
// ADD ANNOTATION HANDLER
// ============================================================================

export async function handleAddAnnotation() {
    const typeSelect = document.getElementById('nt-annotation-type');
    const metaInput = document.getElementById('nt-annotation-meta');
    const btn = document.getElementById('nt-btn-add-annotation');

    const asset = NT.selectedAsset;
    if (!asset?.id) {
        showToast('Asset not found', 'error');
        return;
    }

    const annotationType = parseInt(typeSelect?.value) || 0;
    const meta = metaInput?.value?.trim() || '';

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Adding...'; }

    try {
        await NotaryTx.addAnnotation({
            tokenId: asset.id,
            annotationType,
            meta,
            operator: resolveOperator(),
            button: btn,

            onSuccess: (receipt, annotationId) => {
                showToast(`Annotation added to asset #${asset.id}!`, 'success');
                // Reload annotations
                loadAssetAnnotations(asset.id).then(() => {
                    // Update annotation count in local state
                    asset.annotationCount = (asset.annotationCount || 0) + 1;
                    NT.selectedAsset = asset;
                    NT._render();
                });
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px"></i>Add Annotation'; }
                if (metaInput) metaInput.value = '';
            },

            onError: (error) => {
                if (error.cancelled || error.type === 'user_rejected') {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px"></i>Add Annotation'; }
                    return;
                }
                throw error;
            }
        });
    } catch (e) {
        console.error('[NotaryPage] Annotation error:', e);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px"></i>Add Annotation'; }
        if (e.code !== 4001 && e.code !== 'ACTION_REJECTED') {
            showToast(e.message || 'Annotation failed', 'error');
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
// TRANSFER CERTIFICATE
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

    // Use the Web3Modal wallet provider (more reliable than raw window.ethereum)
    const provider = State.web3Provider || window.ethereum;
    if (!provider) {
        showToast('Connect your wallet first', 'error');
        return;
    }

    // First-party image URL — backcoin.org redirects to the actual IPFS/Arweave gateway.
    // More reliable for MetaMask than passing a third-party gateway URL directly.
    const imageUrl = `https://backcoin.org/api/cert-image/${tokenId}`;

    try {
        const result = await provider.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: {
                    address: contractAddress,
                    tokenId: String(tokenId),
                    image: imageUrl,
                },
            },
        });
        if (result) {
            showToast(`Certificate #${tokenId} added to wallet!`, 'success');
        }
    } catch (error) {
        console.warn('[Notary] wallet_watchAsset error:', error);
        // If user rejected, don't show fallback
        if (error.code === 4001) return;
        // Unsupported — try older format without type
        try {
            await provider.request({
                method: 'wallet_watchAsset',
                params: [{
                    type: 'ERC721',
                    options: {
                        address: contractAddress,
                        tokenId: String(tokenId),
                        image: imageUrl,
                    },
                }],
            });
            showToast(`Certificate #${tokenId} added!`, 'success');
        } catch (e2) {
            console.warn('[Notary] fallback also failed:', e2);
            showToast('Open MetaMask → NFTs → Import NFT to add manually', 'info');
        }
    }
}

export function copyHash(hash) {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
        showToast('Hash copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}
