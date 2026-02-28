// pages/notary/verify.js
// Notary V10 — Verify tab (public, no wallet needed)
// ============================================================================

import { NotaryTx } from '../../modules/transactions/index.js';
import { addresses } from '../../config.js';
import { NT, EXPLORER_ADDR } from './state.js';
import { shortenAddress, formatDateFull } from './utils.js';
import { t } from '../../modules/core/index.js';

export function renderVerify(el) {
    el.innerHTML = `
        <div class="nt-card" style="margin-top:16px">
            <div style="text-align:center;margin-bottom:20px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-shield-check" style="font-size:22px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text)">${t('notary.verifyTab.title')}</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px;max-width:380px;margin-left:auto;margin-right:auto">
                    ${t('notary.verifyTab.subtitle')}
                </div>
            </div>

            <div class="nt-dropzone" id="nt-verify-dropzone" style="margin-bottom:16px">
                <input type="file" id="nt-verify-file-input" style="display:none">
                <div style="width:48px;height:48px;border-radius:var(--nt-radius);background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:20px;color:var(--nt-green)"></i>
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--nt-text);margin-bottom:4px">${t('notary.verifyTab.dropzone')}</div>
                <div style="font-size:11px;color:var(--nt-text-3)">${t('notary.verifyTab.hashComputedLocally')}</div>
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

export async function handleVerifyFile(file) {
    if (!file) return;
    NT.verifyFile = file;
    NT.verifyHash = null;
    NT.verifyResult = null;
    NT.verifyIsChecking = true;

    const resultEl = document.getElementById('nt-verify-result');
    if (resultEl) {
        resultEl.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--nt-text-3);font-size:13px">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;color:var(--nt-accent)"></i>${t('notary.verifyTab.verifying')}
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
                    <div style="font-size:13px;color:var(--nt-red)">${t('notary.verifyTab.verificationError', { error: err.message })}</div>
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
                        <div style="font-size:15px;font-weight:700;color:var(--nt-green)">${t('notary.verifyTab.verified')}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${t('notary.verifyTab.verifiedDesc')}</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${t('notary.verifyTab.tokenId')}</div>
                        <div style="font-size:16px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${r.tokenId}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${t('notary.verifyTab.date')}</div>
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${formatDateFull(r.timestamp)}</div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px;margin-bottom:12px">
                    <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${t('notary.assetDetailView.owner')}</div>
                    <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${r.owner}</div>
                </div>

                ${NT.verifyHash ? `
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${t('notary.verifyTab.sha256Hash')}</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${NT.verifyHash}</div>
                    </div>
                ` : ''}

                <div style="margin-top:12px;display:flex;gap:8px">
                    <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${r.tokenId}" target="_blank" class="nt-btn-secondary" style="font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>${t('common.viewOnExplorer')}
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
                        <div style="font-size:15px;font-weight:700;color:var(--nt-red)">${t('notary.verifyTab.notFound')}</div>
                        <div style="font-size:11px;color:var(--nt-text-3)">${t('notary.verifyTab.notFoundDesc')}</div>
                    </div>
                </div>

                ${file ? `<div style="font-size:12px;color:var(--nt-text-3);margin-bottom:8px">${t('notary.verifyTab.file')}: <strong style="color:var(--nt-text-2)">${file.name}</strong></div>` : ''}
                ${NT.verifyHash ? `
                    <div style="background:rgba(0,0,0,0.2);border-radius:var(--nt-radius-sm);padding:10px">
                        <div style="font-size:10px;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${t('notary.verifyTab.sha256Hash')}</div>
                        <div style="font-size:10px;font-family:monospace;color:var(--nt-text-2);word-break:break-all">${NT.verifyHash}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
