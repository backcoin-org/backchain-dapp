// pages/notary/asset-detail.js
// Notary V5 — Asset detail view with annotations, transfers, actions
// ============================================================================

import { State } from '../../state.js';
import { addresses } from '../../config.js';
import { NT, ASSET_TYPES, ANNOTATION_TYPES, EXPLORER_ADDR } from './state.js';
import { getAssetTypeInfo, getAnnotationTypeInfo, formatDateFull, shortenAddress } from './utils.js';

const ethers = window.ethers;

export function renderAssetDetail(el) {
    const asset = NT.selectedAsset;
    if (!asset) {
        NT.view = 'assets';
        NT.activeTab = 'assets';
        NT._render();
        NT._renderHeader();
        return;
    }

    const typeInfo = getAssetTypeInfo(asset.assetType);
    const isOwner = asset.owner && State.userAddress &&
        asset.owner.toLowerCase() === State.userAddress.toLowerCase();
    const annotations = NT.selectedAssetAnnotations || [];

    el.innerHTML = `
        <div class="nt-detail" style="margin-top:8px">
            <!-- Asset Header Card -->
            <div style="background:${typeInfo.bg};border-radius:var(--nt-radius);padding:24px;margin-bottom:16px;position:relative;overflow:hidden">
                <div style="position:absolute;top:-20px;right:-20px;font-size:120px;opacity:0.06">
                    <i class="${typeInfo.icon}"></i>
                </div>
                <div style="display:flex;align-items:center;gap:14px;position:relative;z-index:1">
                    <div style="width:52px;height:52px;border-radius:var(--nt-radius-sm);background:rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center">
                        <i class="${typeInfo.icon}" style="font-size:24px;color:${typeInfo.color}"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:16px;font-weight:700;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${asset.description || typeInfo.name}</div>
                        <div style="font-size:12px;color:${typeInfo.color};margin-top:2px">${typeInfo.name} &middot; Token #${asset.id}</div>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
                <div class="nt-card" style="padding:12px;text-align:center">
                    <div style="font-size:18px;font-weight:800;color:var(--nt-text);font-family:monospace">${asset.transferCount || 0}</div>
                    <div style="font-size:10px;color:var(--nt-text-3);margin-top:2px">Transfers</div>
                </div>
                <div class="nt-card" style="padding:12px;text-align:center">
                    <div style="font-size:18px;font-weight:800;color:var(--nt-text);font-family:monospace">${asset.annotationCount || 0}</div>
                    <div style="font-size:10px;color:var(--nt-text-3);margin-top:2px">Annotations</div>
                </div>
                <div class="nt-card" style="padding:12px;text-align:center">
                    <div style="font-size:18px;font-weight:800;color:var(--nt-text);font-family:monospace">${formatDateFull(asset.registeredAt)?.split(',')[0] || '—'}</div>
                    <div style="font-size:10px;color:var(--nt-text-3);margin-top:2px">Registered</div>
                </div>
            </div>

            <!-- Owner -->
            <div class="nt-card" style="margin-bottom:12px;padding:14px">
                <div style="font-size:10px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Owner</div>
                <div style="font-size:12px;font-family:monospace;color:var(--nt-text-2)">${asset.owner || '—'}</div>
                ${isOwner ? '<div style="font-size:10px;color:var(--nt-green);margin-top:4px"><i class="fa-solid fa-check-circle" style="margin-right:3px"></i>You own this asset</div>' : ''}
            </div>

            <!-- Document Hash -->
            ${asset.documentHash && asset.documentHash !== '0x' + '0'.repeat(64) ? `
                <div class="nt-card" style="margin-bottom:12px;padding:14px">
                    <div style="font-size:10px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
                        <i class="fa-solid fa-fingerprint" style="color:var(--nt-accent);margin-right:4px"></i>Document Hash
                    </div>
                    <div class="nt-hash-display" onclick="NotaryPage.copyHash('${asset.documentHash}')" title="Click to copy">
                        ${asset.documentHash}
                        <i class="fa-regular fa-copy" style="float:right;margin-top:2px;color:var(--nt-accent)"></i>
                    </div>
                </div>
            ` : ''}

            <!-- Additional Info -->
            ${asset.parsedMeta?.extra ? `
                <div class="nt-card" style="margin-bottom:12px;padding:14px">
                    <div style="font-size:10px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Additional Info</div>
                    <div style="font-size:13px;color:var(--nt-text-2);line-height:1.5">${asset.parsedMeta.extra}</div>
                </div>
            ` : ''}

            <!-- Actions (owner only) -->
            ${isOwner ? `
                <div style="display:flex;gap:8px;margin-bottom:16px">
                    <button class="nt-btn-primary" style="flex:1;padding:14px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#3b82f6,#6366f1)" onclick="NotaryPage.toggleAssetTransferForm()">
                        <i class="fa-solid fa-paper-plane"></i>Transfer
                    </button>
                    <button class="nt-btn-primary" style="flex:1;padding:14px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="NotaryPage.toggleAnnotationForm()">
                        <i class="fa-solid fa-note-sticky"></i>Annotate
                    </button>
                </div>

                <!-- Transfer Form (hidden by default) -->
                <div id="nt-asset-transfer-form" class="nt-card" style="display:none;margin-bottom:12px;padding:16px">
                    <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
                        <i class="fa-solid fa-paper-plane" style="color:#6366f1;margin-right:4px"></i>Transfer Asset
                    </div>
                    <div style="font-size:12px;color:var(--nt-text-2);margin-bottom:12px">
                        Transfer ownership. This creates a permanent on-chain record.
                    </div>
                    <input id="nt-asset-transfer-addr" type="text" placeholder="New owner address (0x...)"
                        style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;margin-bottom:8px;transition:border-color var(--nt-transition)"
                        onfocus="this.style.borderColor='rgba(99,102,241,0.5)'" onblur="this.style.borderColor='var(--nt-border)'">
                    <input id="nt-asset-transfer-value" type="text" placeholder="Declared value in BNB (optional)"
                        style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;margin-bottom:8px;transition:border-color var(--nt-transition)"
                        onfocus="this.style.borderColor='rgba(99,102,241,0.5)'" onblur="this.style.borderColor='var(--nt-border)'">
                    <input id="nt-asset-transfer-note" type="text" placeholder="Transfer note (optional)"
                        style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;margin-bottom:10px;transition:border-color var(--nt-transition)"
                        onfocus="this.style.borderColor='rgba(99,102,241,0.5)'" onblur="this.style.borderColor='var(--nt-border)'">
                    <div style="display:flex;gap:8px">
                        <button id="nt-btn-transfer-asset" class="nt-btn-primary" style="flex:1;padding:12px;font-size:13px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;gap:6px" onclick="NotaryPage.handleTransferAsset()">
                            <i class="fa-solid fa-paper-plane"></i>Transfer
                        </button>
                        <button class="nt-btn-secondary" style="padding:12px 16px;font-size:13px" onclick="NotaryPage.toggleAssetTransferForm()">Cancel</button>
                    </div>
                </div>

                <!-- Annotation Form (hidden by default) -->
                <div id="nt-annotation-form" class="nt-card" style="display:none;margin-bottom:12px;padding:16px">
                    <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
                        <i class="fa-solid fa-note-sticky" style="color:var(--nt-accent);margin-right:4px"></i>Add Annotation
                    </div>
                    <select id="nt-annotation-type" style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;margin-bottom:8px">
                        ${ANNOTATION_TYPES.map(t => `<option value="${t.id}" style="background:var(--nt-bg)">${t.name}</option>`).join('')}
                    </select>
                    <textarea id="nt-annotation-meta" placeholder="Details about this annotation..."
                        style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;outline:none;box-sizing:border-box;resize:vertical;min-height:60px;font-family:inherit;margin-bottom:10px;transition:border-color var(--nt-transition)"
                        onfocus="this.style.borderColor='rgba(245,158,11,0.5)'" onblur="this.style.borderColor='var(--nt-border)'"></textarea>
                    <div style="display:flex;gap:8px">
                        <button id="nt-btn-add-annotation" class="nt-btn-primary" style="flex:1;padding:12px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="NotaryPage.handleAddAnnotation()">
                            <i class="fa-solid fa-plus"></i>Add Annotation
                        </button>
                        <button class="nt-btn-secondary" style="padding:12px 16px;font-size:13px" onclick="NotaryPage.toggleAnnotationForm()">Cancel</button>
                    </div>
                </div>
            ` : ''}

            <!-- Annotations List -->
            <div class="nt-card" style="margin-bottom:12px;padding:0;overflow:hidden">
                <div style="padding:14px 16px;border-bottom:1px solid var(--nt-border);display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:13px;font-weight:700;color:var(--nt-text)">
                        <i class="fa-solid fa-note-sticky" style="color:var(--nt-accent);margin-right:6px"></i>Annotations
                    </div>
                    <span style="font-size:11px;color:var(--nt-text-3)">${annotations.length} total</span>
                </div>
                ${annotations.length === 0 ? `
                    <div style="text-align:center;padding:24px;color:var(--nt-text-3);font-size:12px">
                        No annotations yet
                    </div>
                ` : annotations.map(ann => {
                    const annType = getAnnotationTypeInfo(ann.annotationType);
                    return `
                        <div style="padding:12px 16px;border-bottom:1px solid var(--nt-border);display:flex;align-items:flex-start;gap:10px">
                            <div style="width:32px;height:32px;border-radius:50%;background:rgba(${hexToRgb(annType.color)},0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                                <i class="${annType.icon}" style="font-size:13px;color:${annType.color}"></i>
                            </div>
                            <div style="flex:1;min-width:0">
                                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                                    <span style="font-size:12px;font-weight:600;color:${annType.color}">${annType.name}</span>
                                    <span style="font-size:10px;color:var(--nt-text-3)">${formatDateFull(ann.timestamp) || ''}</span>
                                </div>
                                ${ann.meta ? `<div style="font-size:12px;color:var(--nt-text-2);line-height:1.4">${ann.meta}</div>` : ''}
                                <div style="font-size:10px;font-family:monospace;color:var(--nt-text-3);margin-top:4px">${shortenAddress(ann.author)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Explorer Link -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${asset.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>View on Explorer
                </a>
                <button class="nt-btn-secondary" style="font-size:12px;display:inline-flex;align-items:center;gap:6px" onclick="NotaryPage.addToWallet('${asset.id}')">
                    <i class="fa-solid fa-wallet"></i>Add to Wallet
                </button>
            </div>
        </div>
    `;
}

// Helper to convert hex color to RGB for rgba() usage
function hexToRgb(hex) {
    if (!hex) return '128,128,128';
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r},${g},${b}`;
}
