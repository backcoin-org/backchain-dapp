// pages/notary/wizard.js
// Notary V10 — Notarize wizard (3-step)
// ============================================================================

import { State } from '../../state.js';
import { NotaryTx } from '../../modules/transactions/index.js';
import { showToast } from '../../ui-feedback.js';
import { NT, MAX_FILE_SIZE } from './state.js';
import { getFileTypeInfo, formatFileSize, shortenAddress, formatDateFull } from './utils.js';

const ethers = window.ethers;

export function renderNotarize(el) {
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

// ── Step 2: Description + Fee Breakdown ──
export function renderWizStep2(panel) {
    const file = NT.wizFile;
    const fileInfo = getFileTypeInfo(file?.type || '', file?.name || '');

    const ethFmt = NT.feesLoaded ? (ethers ? ethers.formatEther(NT.ethFee) : '0.0001') : '...';
    const uploadCostFmt = NT.wizUploadCost ? NT.wizUploadCost.costFormatted : '...';

    const ethBalance = State.currentUserNativeBalance || 0n;
    const totalEthNeeded = (NT.ethFee || 0n) + (NT.wizUploadCost?.cost || 0n) + (ethers?.parseEther('0.001') || 0n);
    const hasEth = NT.feesLoaded ? ethBalance >= totalEthNeeded : true;
    const canProceed = hasEth;

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

export async function handleWizFileSelect(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 5MB)', 'error');
        return;
    }

    NT.wizFile = file;
    NT.wizFileHash = null;
    NT.wizDuplicateCheck = null;
    NT.wizIsHashing = true;
    NT._render();

    try {
        const hash = await NotaryTx.calculateFileHash(file);
        NT.wizFileHash = hash;
        NT.wizIsHashing = false;
        NT._render();

        // Check for duplicates
        NT.wizDuplicateCheck = null;
        NT._render();
        const dupResult = await NotaryTx.verifyByHash(hash);
        NT.wizDuplicateCheck = dupResult;
        NT._render();
    } catch (err) {
        console.error('[NotaryPage] Hash error:', err);
        NT.wizIsHashing = false;
        NT.wizFile = null;
        showToast('Error computing file hash', 'error');
        NT._render();
    }
}
