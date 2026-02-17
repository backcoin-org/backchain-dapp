// pages/notary/overlay.js
// Notary V10 — Processing overlay
// ============================================================================

export function showOverlay(step, tokenId) {
    const overlay = document.getElementById('nt-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    const configs = {
        uploading: { icon: 'fa-solid fa-cloud-arrow-up', text: 'Uploading to Arweave...', sub: 'Permanent decentralized storage', pct: 20 },
        funding: { icon: 'fa-solid fa-wallet', text: 'Funding storage...', sub: 'Confirm in MetaMask', pct: 15, animate: true },
        minting: { icon: 'fa-solid fa-stamp', text: 'Certifying on Blockchain...', sub: 'Waiting for confirmation', pct: 65, animate: true },
        success: { icon: 'fa-solid fa-check', text: 'Certified!', sub: tokenId ? `Certificate #${tokenId}` : 'Certificate created', pct: 100, success: true }
    };

    const cfg = configs[step] || configs.uploading;

    overlay.innerHTML = `
        <div style="text-align:center;padding:24px;max-width:360px">
            <div style="width:100px;height:100px;margin:0 auto 24px;position:relative">
                ${!cfg.success ? `
                    <div style="position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--nt-accent);border-right-color:rgba(245,158,11,0.3);animation:nt-spin 1s linear infinite"></div>
                ` : ''}
                <div style="width:100%;height:100%;border-radius:50%;background:${cfg.success ? 'rgba(34,197,94,0.15)' : 'var(--nt-bg3)'};display:flex;align-items:center;justify-content:center;border:2px solid ${cfg.success ? 'var(--nt-green)' : 'rgba(245,158,11,0.2)'}">
                    <i class="${cfg.icon}" style="font-size:36px;color:${cfg.success ? 'var(--nt-green)' : 'var(--nt-accent)'};${cfg.animate ? 'animation:nt-stamp 0.6s ease' : ''}"></i>
                </div>
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--nt-text);margin-bottom:6px">${cfg.text}</div>
            <div style="font-size:12px;color:${cfg.success ? 'var(--nt-green)' : 'var(--nt-accent)'};font-family:monospace;margin-bottom:16px">${cfg.sub}</div>
            <div style="width:100%;height:4px;background:var(--nt-bg3);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${cfg.pct}%;background:linear-gradient(90deg,var(--nt-accent),${cfg.success ? 'var(--nt-green)' : '#fbbf24'});border-radius:2px;transition:width 0.5s ease"></div>
            </div>
            ${!cfg.success ? '<div style="font-size:10px;color:var(--nt-text-3);margin-top:12px">Do not close this window</div>' : ''}
        </div>
    `;

    // Add spin keyframe if not present
    if (!document.getElementById('nt-spin-kf')) {
        const s = document.createElement('style');
        s.id = 'nt-spin-kf';
        s.textContent = '@keyframes nt-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(s);
    }
}

export function hideOverlay() {
    const overlay = document.getElementById('nt-overlay');
    if (overlay) overlay.classList.remove('active');
}
