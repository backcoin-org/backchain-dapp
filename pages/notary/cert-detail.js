// pages/notary/cert-detail.js
// Notary V10 — Certificate detail view
// ============================================================================

import { State } from '../../state.js';
import { addresses } from '../../config.js';
import { NT, EXPLORER_ADDR, EXPLORER_TX } from './state.js';
import { getFileTypeInfo, formatDateFull, shortenAddress, resolveStorageUrl } from './utils.js';

export function renderCertDetail(el) {
    const cert = NT.selectedCert;
    if (!cert) {
        NT.view = 'documents';
        NT.activeTab = 'documents';
        NT._render();
        NT._renderHeader();
        return;
    }

    const ipfsUrl = resolveStorageUrl(cert.ipfs);
    const fileInfo = getFileTypeInfo(cert.mimeType || '', cert.description || '');
    const isOwner = cert.owner && State.userAddress &&
        cert.owner.toLowerCase() === State.userAddress.toLowerCase();
    const isReceived = cert.received === true;

    el.innerHTML = `
        <div class="nt-detail" style="margin-top:8px">
            <!-- Image Preview (clickable → NFT card overlay) -->
            <div onclick="NotaryPage.showCertCard()" style="display:block;margin-bottom:16px;cursor:pointer">
                <div style="min-height:240px;max-height:400px;background:var(--nt-bg3);border-radius:var(--nt-radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid var(--nt-border);transition:border-color var(--nt-transition)" onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'" onmouseout="this.style.borderColor='var(--nt-border)'">
                    ${ipfsUrl ? `
                        <img src="${ipfsUrl}" style="width:100%;height:100%;object-fit:contain;max-height:400px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="Certificate #${cert.id}">
                        <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:240px;position:absolute;inset:0;background:var(--nt-bg3)">
                            <i class="${fileInfo.icon}" style="font-size:48px;color:${fileInfo.color};margin-bottom:8px"></i>
                            <span style="font-size:12px;color:var(--nt-text-3)">${fileInfo.label} file</span>
                        </div>
                    ` : `
                        <div style="text-align:center">
                            <i class="${fileInfo.icon}" style="font-size:48px;color:${fileInfo.color};margin-bottom:8px"></i>
                            <div style="font-size:12px;color:var(--nt-text-3)">${fileInfo.label} file</div>
                        </div>
                    `}
                    <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:var(--nt-accent);font-family:monospace">#${cert.id}</div>
                    ${isReceived ? `
                        <div style="position:absolute;top:12px;left:12px;background:rgba(99,102,241,0.9);padding:4px 10px;border-radius:20px;font-size:10px;font-weight:600;color:#fff;display:flex;align-items:center;gap:4px">
                            <i class="fa-solid fa-inbox"></i>Received
                        </div>
                    ` : ''}
                    <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.75);padding:4px 10px;border-radius:8px;font-size:10px;color:var(--nt-text-2)">
                        <i class="fa-solid fa-id-card" style="margin-right:4px"></i>Tap to view NFT card
                    </div>
                </div>
            </div>

            <!-- Primary Actions -->
            <div style="display:flex;gap:8px;margin-bottom:16px">
                <button class="nt-btn-primary" style="flex:1;padding:14px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="NotaryPage.addToWallet('${cert.id}')">
                    <i class="fa-brands fa-ethereum"></i>Add to Wallet
                </button>
                ${isOwner ? `
                    <button class="nt-btn-primary" style="flex:1;padding:14px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#3b82f6,#6366f1)" onclick="NotaryPage.toggleTransferForm()">
                        <i class="fa-solid fa-paper-plane"></i>Transfer
                    </button>
                ` : ''}
            </div>

            <!-- Transfer Form (hidden by default) -->
            ${isOwner ? `
                <div id="nt-transfer-form" class="nt-card" style="display:none;margin-bottom:12px;padding:16px">
                    <div style="font-size:11px;font-weight:600;color:var(--nt-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
                        <i class="fa-solid fa-paper-plane" style="color:#6366f1;margin-right:4px"></i>Transfer Certificate
                    </div>
                    <div style="font-size:12px;color:var(--nt-text-2);margin-bottom:12px">
                        Transfer ownership of this certificate to another wallet. This action is permanent and requires a small fee.
                    </div>
                    <input id="nt-transfer-addr" type="text" placeholder="Recipient address (0x...)"
                        style="width:100%;padding:12px 14px;background:var(--nt-bg);border:1px solid var(--nt-border);border-radius:10px;color:var(--nt-text);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;margin-bottom:10px;transition:border-color var(--nt-transition)"
                        onfocus="this.style.borderColor='rgba(99,102,241,0.5)'" onblur="this.style.borderColor='var(--nt-border)'"
                    >
                    <div style="display:flex;gap:8px">
                        <button id="nt-btn-transfer" class="nt-btn-primary" style="flex:1;padding:12px;font-size:13px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;gap:6px" onclick="NotaryPage.handleTransfer()">
                            <i class="fa-solid fa-paper-plane"></i>Transfer
                        </button>
                        <button class="nt-btn-secondary" style="padding:12px 16px;font-size:13px" onclick="NotaryPage.toggleTransferForm()">Cancel</button>
                    </div>
                </div>
            ` : ''}

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
                        <i class="fa-solid fa-eye"></i>View Original
                    </a>
                ` : ''}
                <a href="${EXPLORER_ADDR}${addresses?.notary}?a=${cert.id}" target="_blank" class="nt-btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>Explorer
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
