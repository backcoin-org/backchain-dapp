// pages/notary/assets.js
// Notary V5 — Assets tab
// ============================================================================

import { State } from '../../state.js';
import { NT, ASSET_TYPES, EXPLORER_ADDR } from './state.js';
import { getAssetTypeInfo, formatTimestamp, resolveStorageUrl } from './utils.js';
import { addresses } from '../../config.js';

export function renderAssets(el) {
    if (!State.isConnected) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:var(--nt-bg3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-wallet" style="font-size:24px;color:var(--nt-text-3)"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">Connect Wallet</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Connect to view your assets</div>
                <button class="nt-btn-primary" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet" style="margin-right:8px"></i>Connect Wallet
                </button>
            </div>
        `;
        return;
    }

    if (NT.assetsLoading) {
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

    if (!NT.assets.length) {
        el.innerHTML = `
            <div class="nt-card" style="margin-top:16px;text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;border-radius:var(--nt-radius);background:rgba(245,158,11,0.08);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <i class="fa-solid fa-house" style="font-size:24px;color:var(--nt-accent);opacity:0.5"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--nt-text);margin-bottom:8px">No Assets Registered</div>
                <div style="font-size:13px;color:var(--nt-text-3);margin-bottom:20px">Register your first asset to get started</div>
                <button class="nt-btn-primary" onclick="NotaryPage.setTab('register-asset')">
                    <i class="fa-solid fa-plus" style="margin-right:8px"></i>Register Asset
                </button>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;margin-bottom:4px">
            <div style="font-size:13px;color:var(--nt-text-2)">${NT.assets.length} asset${NT.assets.length > 1 ? 's' : ''}</div>
            <div style="display:flex;gap:8px;align-items:center">
                <button class="nt-btn-primary" style="padding:6px 14px;font-size:12px" onclick="NotaryPage.setTab('register-asset')">
                    <i class="fa-solid fa-plus" style="margin-right:6px"></i>Register Asset
                </button>
                <button class="nt-btn-icon" onclick="NotaryPage.refreshAssets()" title="Refresh">
                    <i class="fa-solid fa-rotate-right" style="font-size:12px"></i>
                </button>
            </div>
        </div>
        <div class="nt-cert-grid">
            ${NT.assets.map(asset => renderAssetCard(asset)).join('')}
        </div>
    `;
}

function renderAssetCard(asset) {
    const typeInfo = getAssetTypeInfo(asset.assetType);
    const timeAgo = formatTimestamp(asset.registeredAt);
    const desc = asset.description || typeInfo.name;
    const docUrl = resolveStorageUrl(asset.parsedMeta?.uri);

    return `
        <div class="nt-cert-card" onclick="NotaryPage.viewAsset(${asset.id})">
            <div class="nt-cert-thumb" style="background:${typeInfo.bg}">
                ${docUrl ? `
                    <img src="${docUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
                    <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:absolute;inset:0;background:${typeInfo.bg}">
                        <i class="${typeInfo.icon}" style="font-size:32px;color:${typeInfo.color}"></i>
                    </div>
                ` : `
                    <i class="${typeInfo.icon}" style="font-size:32px;color:${typeInfo.color}"></i>
                `}
                <span style="position:absolute;top:8px;right:8px;font-size:10px;font-family:monospace;color:var(--nt-accent);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px;font-weight:700">#${asset.id}</span>
                ${timeAgo ? `<span style="position:absolute;top:8px;left:8px;font-size:10px;color:var(--nt-text-3);background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:20px"><i class="fa-regular fa-clock" style="margin-right:4px"></i>${timeAgo}</span>` : ''}
            </div>
            <div class="nt-cert-info">
                <div style="font-size:13px;font-weight:600;color:var(--nt-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${desc}</div>
                <div style="font-size:10px;color:${typeInfo.color};margin-bottom:4px"><i class="${typeInfo.icon}" style="margin-right:3px;font-size:9px"></i>${typeInfo.name}</div>
                <div style="display:flex;gap:8px;font-size:10px;color:var(--nt-text-3)">
                    <span><i class="fa-solid fa-right-left" style="margin-right:2px"></i>${asset.transferCount || 0} transfers</span>
                    <span><i class="fa-solid fa-note-sticky" style="margin-right:2px"></i>${asset.annotationCount || 0} annotations</span>
                </div>
            </div>
        </div>
    `;
}
