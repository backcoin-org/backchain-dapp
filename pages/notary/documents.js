// pages/notary/documents.js
// Notary V10 — Documents tab
// ============================================================================

import { State } from '../../state.js';
import { NotaryTx } from '../../modules/transactions/index.js';
import { addresses } from '../../config.js';
import { NT, EXPLORER_ADDR } from './state.js';
import { getFileTypeInfo, formatTimestamp, resolveStorageUrl, formatFileSize } from './utils.js';

export function renderDocuments(el) {
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
