// pages/notary/asset-wizard.js
// Notary V5 — Asset registration wizard (4 steps, guided flow)
// ============================================================================

import { State } from '../../state.js';
import { NT, ASSET_TYPES, TYPE_HINTS } from './state.js';

const ethers = window.ethers;

export function renderAssetWizard(el) {
    if (!State.isConnected) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to register assets</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    const step = NT.assetWizStep;
    const labels = ['Type', 'Details', 'Document', 'Confirm'];

    el.innerHTML = `
        <div class="nt-card" style="margin-top:16px;padding:24px">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:24px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.12);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
                    <i class="fa-solid fa-file-signature" style="font-size:20px;color:var(--nt-accent)"></i>
                </div>
                <div style="font-size:18px;font-weight:800;color:var(--nt-text)">Register Asset</div>
                <div style="font-size:12px;color:var(--nt-text-3);margin-top:4px">On-chain property registration</div>
            </div>

            <!-- Step indicators (4 steps) -->
            <div style="display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:24px">
                ${[1,2,3,4].map((s, i) => `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                        <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;transition:all 0.2s;${
                            step > s ? 'background:var(--nt-accent);color:#000;' :
                            step === s ? 'background:var(--nt-accent);color:#000;box-shadow:0 0 0 3px rgba(245,158,11,0.25);' :
                            'background:var(--nt-bg3);color:var(--nt-text-3);'
                        }">
                            ${step > s ? '<i class="fa-solid fa-check" style="font-size:11px"></i>' : s}
                        </div>
                        <span style="font-size:9px;color:${step >= s ? 'var(--nt-accent)' : 'var(--nt-text-3)'};font-weight:${step === s ? '700' : '500'}">${labels[i]}</span>
                    </div>
                    ${i < 3 ? `<div style="flex:1;max-width:40px;height:2px;background:${step > s ? 'var(--nt-accent)' : 'var(--nt-bg3)'};margin:0 4px 16px;transition:background 0.2s"></div>` : ''}
                `).join('')}
            </div>

            <!-- Step content -->
            <div id="nt-asset-wiz-panel">
                ${step === 1 ? renderStep1() : ''}
                ${step === 2 ? renderStep2() : ''}
                ${step === 3 ? renderStep3() : ''}
                ${step === 4 ? renderStep4() : ''}
            </div>
        </div>
    `;

    // Restore form values after render
    if (step === 2) {
        const descInput = document.getElementById('nt-asset-desc');
        if (descInput && NT.assetWizDescription) descInput.value = NT.assetWizDescription;
        const metaInput = document.getElementById('nt-asset-meta');
        if (metaInput && NT.assetWizMeta) metaInput.value = NT.assetWizMeta;
    }
}

// Step 1: Choose asset type (full-width vertical cards)
function renderStep1() {
    return `
        <div style="animation:nt-fadeIn 0.3s ease">
            <div style="font-size:14px;font-weight:700;color:var(--nt-text);margin-bottom:4px;text-align:center">What are you registering?</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-bottom:16px;text-align:center">Choose the type of asset to register on-chain</div>

            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
                ${ASSET_TYPES.map(t => {
                    const selected = NT.assetWizType === t.id;
                    return `
                    <div onclick="NotaryPage.onAssetTypeChange(${t.id})" style="padding:16px;border-radius:var(--nt-radius-sm);background:${selected ? t.bg : 'var(--nt-bg3)'};border:2px solid ${selected ? t.color : 'var(--nt-border)'};cursor:pointer;transition:all var(--nt-transition);display:flex;align-items:center;gap:14px">
                        <div style="width:44px;height:44px;border-radius:var(--nt-radius-sm);background:${selected ? 'rgba(0,0,0,0.15)' : 'var(--nt-bg)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                            <i class="${t.icon}" style="font-size:20px;color:${t.color}"></i>
                        </div>
                        <div style="flex:1;min-width:0">
                            <div style="font-size:14px;font-weight:700;color:${selected ? t.color : 'var(--nt-text)'}">${t.name}</div>
                            <div style="font-size:11px;color:var(--nt-text-3);margin-top:2px">${t.desc}</div>
                        </div>
                        ${selected ? `<i class="fa-solid fa-circle-check" style="font-size:18px;color:${t.color};flex-shrink:0"></i>` : ''}
                    </div>
                    `;
                }).join('')}
            </div>

            <button class="nt-btn-primary" style="width:100%;padding:14px;font-size:14px" onclick="NotaryPage.assetWizNext()">
                Continue <i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
            </button>
        </div>
    `;
}

// Step 2: Description + metadata (context-sensitive)
function renderStep2() {
    const typeInfo = ASSET_TYPES[NT.assetWizType] || ASSET_TYPES[3];
    const hints = TYPE_HINTS[NT.assetWizType] || TYPE_HINTS[3];

    return `
        <div style="animation:nt-fadeIn 0.3s ease">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:12px;background:${typeInfo.bg};border-radius:var(--nt-radius-sm)">
                <i class="${typeInfo.icon}" style="font-size:18px;color:${typeInfo.color}"></i>
                <span style="font-size:13px;font-weight:600;color:${typeInfo.color}">${typeInfo.name}</span>
            </div>

            <div style="margin-bottom:16px">
                <label style="font-size:12px;font-weight:600;color:var(--nt-text-2);display:block;margin-bottom:6px">Description *</label>
                <input id="nt-asset-desc" type="text" placeholder="${hints.descPlaceholder}"
                    style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;transition:border-color var(--nt-transition)"
                    onfocus="this.style.borderColor='rgba(245,158,11,0.5)'" onblur="this.style.borderColor='var(--nt-border)'"
                    oninput="NotaryPage.onAssetDescChange(this.value);var b=document.getElementById('nt-asset-continue');if(b)b.disabled=!this.value.trim()"
                    value="${NT.assetWizDescription || ''}">
            </div>

            <div style="margin-bottom:20px">
                <label style="font-size:12px;font-weight:600;color:var(--nt-text-2);display:block;margin-bottom:6px">Additional Info <span style="color:var(--nt-text-3);font-weight:400">(optional)</span></label>
                <textarea id="nt-asset-meta" placeholder="${hints.metaLabel}"
                    style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;resize:vertical;min-height:60px;font-family:inherit;transition:border-color var(--nt-transition)"
                    onfocus="this.style.borderColor='rgba(245,158,11,0.5)'" onblur="this.style.borderColor='var(--nt-border)'"
                    oninput="NotaryPage.onAssetMetaChange(this.value)"
                >${NT.assetWizMeta || ''}</textarea>
            </div>

            <div style="display:flex;gap:8px">
                <button class="nt-btn-secondary" style="flex:1;padding:12px" onclick="NotaryPage.assetWizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button id="nt-asset-continue" class="nt-btn-primary" style="flex:2;padding:12px" onclick="NotaryPage.assetWizToStep3()" ${!NT.assetWizDescription ? 'disabled' : ''}>
                    Continue <i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        </div>
    `;
}

// Step 3: Supporting document (optional, standalone step)
function renderStep3() {
    const typeInfo = ASSET_TYPES[NT.assetWizType] || ASSET_TYPES[3];
    const hints = TYPE_HINTS[NT.assetWizType] || TYPE_HINTS[3];

    return `
        <div style="animation:nt-fadeIn 0.3s ease">
            <div style="font-size:14px;font-weight:700;color:var(--nt-text);margin-bottom:4px;text-align:center">Supporting Document</div>
            <div style="font-size:12px;color:var(--nt-text-3);margin-bottom:16px;text-align:center">
                Attach a document to anchor its hash on-chain <span style="color:var(--nt-text-3);font-weight:400">(optional)</span>
            </div>

            <div style="background:${typeInfo.bg};border-radius:var(--nt-radius-sm);padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                <i class="fa-solid fa-lightbulb" style="font-size:13px;color:${typeInfo.color}"></i>
                <span style="font-size:12px;color:${typeInfo.color}">${hints.docHint}</span>
            </div>

            <div id="nt-asset-dropzone" class="nt-dropzone" style="padding:32px 16px;margin-bottom:12px"
                ondragover="event.preventDefault();this.classList.add('drag-over')"
                ondragleave="this.classList.remove('drag-over')"
                ondrop="event.preventDefault();this.classList.remove('drag-over');NotaryPage.onAssetFileSelect(event.dataTransfer.files[0])"
                onclick="document.getElementById('nt-asset-file-input').click()">
                ${NT.assetWizFile ? `
                    <div style="display:flex;align-items:center;gap:12px;text-align:left">
                        <i class="fa-regular fa-file" style="font-size:24px;color:var(--nt-accent)"></i>
                        <div style="flex:1;min-width:0">
                            <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${NT.assetWizFile.name}</div>
                            <div style="font-size:11px;color:var(--nt-text-3)">${(NT.assetWizFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button onclick="event.stopPropagation();NotaryPage.removeAssetFile()" style="width:28px;height:28px;border-radius:50%;background:rgba(239,68,68,0.15);border:none;color:var(--nt-red);cursor:pointer;display:flex;align-items:center;justify-content:center">
                            <i class="fa-solid fa-xmark" style="font-size:12px"></i>
                        </button>
                    </div>
                ` : `
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size:28px;color:var(--nt-text-3);margin-bottom:8px"></i>
                    <div style="font-size:13px;color:var(--nt-text-2);font-weight:600">Drop file here or click to browse</div>
                    <div style="font-size:11px;color:var(--nt-text-3);margin-top:4px">Max 5MB — PDF, images, documents</div>
                `}
                <input type="file" id="nt-asset-file-input" style="display:none" onchange="NotaryPage.onAssetFileSelect(this.files[0])">
            </div>

            <div style="text-align:center;margin-bottom:16px">
                <button onclick="NotaryPage.assetWizSkipDoc()" style="background:none;border:none;color:var(--nt-text-3);font-size:12px;cursor:pointer;text-decoration:underline;padding:4px 8px">
                    Skip this step
                </button>
            </div>

            <div style="display:flex;gap:8px">
                <button class="nt-btn-secondary" style="flex:1;padding:12px" onclick="NotaryPage.assetWizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button class="nt-btn-primary" style="flex:2;padding:12px" onclick="NotaryPage.assetWizToReview()">
                    Review <i class="fa-solid fa-arrow-right" style="margin-left:6px"></i>
                </button>
            </div>
        </div>
    `;
}

// Step 4: Review + sign
function renderStep4() {
    const typeInfo = ASSET_TYPES[NT.assetWizType] || ASSET_TYPES[3];
    const fee = NT.assetRegisterFee || 0n;
    const feeFormatted = ethers ? ethers.formatEther(fee) : '0';

    return `
        <div style="animation:nt-fadeIn 0.3s ease">
            <div style="font-size:14px;font-weight:700;color:var(--nt-text);margin-bottom:16px;text-align:center">Review & Sign</div>

            <!-- Summary card -->
            <div style="background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:var(--nt-radius);padding:16px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--nt-border)">
                    <div style="width:40px;height:40px;border-radius:var(--nt-radius-sm);background:${typeInfo.bg};display:flex;align-items:center;justify-content:center">
                        <i class="${typeInfo.icon}" style="font-size:18px;color:${typeInfo.color}"></i>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:var(--nt-text)">${NT.assetWizDescription || 'Asset'}</div>
                        <div style="font-size:11px;color:${typeInfo.color}">${typeInfo.name}</div>
                    </div>
                </div>
                ${NT.assetWizMeta ? `
                    <div style="font-size:11px;color:var(--nt-text-3);margin-bottom:8px">
                        <i class="fa-solid fa-info-circle" style="margin-right:4px"></i>${NT.assetWizMeta}
                    </div>
                ` : ''}
                ${NT.assetWizFile ? `
                    <div style="font-size:11px;color:var(--nt-text-3)">
                        <i class="fa-regular fa-file" style="margin-right:4px"></i>${NT.assetWizFile.name}
                    </div>
                ` : `
                    <div style="font-size:11px;color:var(--nt-text-3);font-style:italic">
                        No supporting document
                    </div>
                `}
            </div>

            <!-- Fee -->
            <div class="nt-fee-box" style="margin-bottom:16px">
                <div class="nt-fee-row">
                    <span style="font-size:12px;color:var(--nt-text-2)">Registration Fee</span>
                    <span style="font-size:13px;font-weight:700;color:var(--nt-accent);font-family:monospace">${parseFloat(feeFormatted).toFixed(4)} BNB</span>
                </div>
            </div>

            <div style="font-size:11px;color:var(--nt-text-3);text-align:center;margin-bottom:16px">
                <i class="fa-solid fa-shield-check" style="color:var(--nt-green);margin-right:4px"></i>
                Permanently recorded on opBNB blockchain
            </div>

            <div style="display:flex;gap:8px">
                <button class="nt-btn-secondary" style="flex:1;padding:12px" onclick="NotaryPage.assetWizBack()">
                    <i class="fa-solid fa-arrow-left" style="margin-right:6px"></i>Back
                </button>
                <button id="nt-btn-register-asset" class="nt-btn-primary" style="flex:2;padding:14px;font-size:14px" onclick="NotaryPage.handleRegisterAsset()">
                    <i class="fa-solid fa-file-signature" style="margin-right:6px"></i>Register Asset
                </button>
            </div>
        </div>
    `;
}
