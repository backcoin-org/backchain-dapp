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

/**
 * Shows a fullscreen NFT card overlay — "Add to Collection" experience.
 * Gives the user a sense of ownership/belonging for their certificate.
 */
export function showNftCard(cert, imageUrl, fileInfo) {
    const overlay = document.getElementById('nt-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    const shortHash = cert.hash ? `${cert.hash.slice(0, 10)}...${cert.hash.slice(-8)}` : '';
    const shortOwner = cert.owner ? `${cert.owner.slice(0, 6)}...${cert.owner.slice(-4)}` : '';
    const date = cert.timestamp ? new Date((cert.timestamp > 1e12 ? cert.timestamp : cert.timestamp * 1000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    overlay.innerHTML = `
        <div style="padding:20px;max-width:360px;width:100%;animation:nt-card-in 0.4s ease" onclick="event.stopPropagation()">
            <!-- NFT Card -->
            <div style="background:linear-gradient(145deg,rgba(15,15,20,0.98),rgba(25,20,40,0.98));border-radius:20px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);box-shadow:0 0 60px rgba(245,158,11,0.15),0 20px 60px rgba(0,0,0,0.5)">
                <!-- Image -->
                <div style="height:280px;background:var(--nt-bg3);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
                    ${imageUrl ? `
                        <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <div style="display:none;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:absolute;inset:0">
                            <i class="${fileInfo?.icon || 'fa-regular fa-file'}" style="font-size:64px;color:${fileInfo?.color || '#fbbf24'}"></i>
                        </div>
                    ` : `
                        <i class="${fileInfo?.icon || 'fa-regular fa-file'}" style="font-size:64px;color:${fileInfo?.color || '#fbbf24'}"></i>
                    `}
                    <div style="position:absolute;top:0;left:0;right:0;height:60px;background:linear-gradient(to bottom,rgba(0,0,0,0.6),transparent)"></div>
                    <div style="position:absolute;top:12px;left:14px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em">Backchain Notary</div>
                    <div style="position:absolute;top:12px;right:14px;background:rgba(245,158,11,0.9);padding:3px 12px;border-radius:20px;font-size:13px;font-weight:800;color:#000;font-family:monospace">#${cert.id}</div>
                    <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,rgba(15,15,20,1),transparent)"></div>
                </div>

                <!-- Info -->
                <div style="padding:20px">
                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cert.description || cert.fileName || 'Certified Document'}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:16px">${date}</div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
                        <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px">
                            <div style="font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Owner</div>
                            <div style="font-size:11px;font-family:monospace;color:var(--nt-accent)">${shortOwner}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px">
                            <div style="font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">SHA-256</div>
                            <div style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.6)">${shortHash}</div>
                        </div>
                    </div>

                    <!-- Chain badge -->
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px">
                        <div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#28a0f0,#1b6cb0);display:flex;align-items:center;justify-content:center">
                            <span style="font-size:10px;font-weight:800;color:#fff">A</span>
                        </div>
                        <span style="font-size:11px;color:rgba(255,255,255,0.5)">Arbitrum Sepolia</span>
                        <span style="font-size:10px;color:var(--nt-green);margin-left:auto"><i class="fa-solid fa-shield-check" style="margin-right:3px"></i>On-chain</span>
                    </div>

                    <!-- Actions -->
                    <div style="display:flex;gap:8px">
                        <button onclick="NotaryPage.addToWallet('${cert.id}')" style="flex:1;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--nt-accent),#f59e0b);color:#000;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
                            <i class="fa-brands fa-ethereum"></i>Add to Wallet
                        </button>
                        ${imageUrl ? `
                            <a href="${imageUrl}" target="_blank" style="flex:1;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,0.1);color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none">
                                <i class="fa-solid fa-eye"></i>View
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Close -->
            <button onclick="NotaryPage.hideNftCard()" style="display:block;margin:16px auto 0;padding:10px 32px;border:1px solid rgba(255,255,255,0.15);border-radius:12px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;cursor:pointer">
                Close
            </button>
        </div>
    `;

    // Click backdrop to close
    overlay.onclick = (e) => {
        if (e.target === overlay) hideOverlay();
    };

    // Card entrance animation
    if (!document.getElementById('nt-card-kf')) {
        const s = document.createElement('style');
        s.id = 'nt-card-kf';
        s.textContent = '@keyframes nt-card-in { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }';
        document.head.appendChild(s);
    }
}
