// pages/notary/styles.js
// Notary V10 — CSS injection
// ============================================================================

export function injectStyles() {
    if (document.getElementById('notary-styles-v10')) return;
    const style = document.createElement('style');
    style.id = 'notary-styles-v10';
    style.textContent = `
        :root {
            --nt-bg:       #0c0c0e;
            --nt-bg2:      #141417;
            --nt-bg3:      #1c1c21;
            --nt-surface:  #222228;
            --nt-border:   rgba(255,255,255,0.06);
            --nt-border-h: rgba(255,255,255,0.1);
            --nt-text:     #f0f0f2;
            --nt-text-2:   #a0a0ab;
            --nt-text-3:   #5c5c68;
            --nt-accent:   #f59e0b;
            --nt-accent-2: #d97706;
            --nt-accent-glow: rgba(245,158,11,0.15);
            --nt-red:      #ef4444;
            --nt-green:    #22c55e;
            --nt-blue:     #3b82f6;
            --nt-radius:   14px;
            --nt-radius-sm: 10px;
            --nt-radius-lg: 20px;
            --nt-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes nt-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nt-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: none; } }
        @keyframes nt-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes nt-stamp { 0% { transform: scale(1) rotate(0); } 25% { transform: scale(1.2) rotate(-5deg); } 50% { transform: scale(0.9) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes nt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes nt-scan { 0% { top: 0; opacity: 1; } 50% { opacity: 0.5; } 100% { top: 100%; opacity: 1; } }
        @keyframes nt-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 100% { box-shadow: 0 0 0 15px rgba(245,158,11,0); } }

        .nt-shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 0 16px 32px;
            min-height: 100vh;
            background: var(--nt-bg);
        }
        .nt-header {
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 12px 0 0;
            background: var(--nt-bg);
        }
        .nt-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
        }
        .nt-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nt-brand-icon {
            width: 44px; height: 44px;
            border-radius: var(--nt-radius);
            background: var(--nt-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            display: flex; align-items: center; justify-content: center;
            color: var(--nt-accent);
            font-size: 20px;
            animation: nt-float 4s ease-in-out infinite;
        }
        .nt-brand-name {
            font-size: 18px;
            font-weight: 800;
            color: var(--nt-text);
            letter-spacing: -0.02em;
        }
        .nt-brand-sub {
            font-size: 11px;
            color: var(--nt-text-3);
        }

        /* Navigation */
        .nt-nav {
            display: flex;
            gap: 2px;
            padding: 4px;
            background: var(--nt-bg2);
            border-radius: var(--nt-radius);
            border: 1px solid var(--nt-border);
            margin-top: 8px;
        }
        .nt-nav-item {
            flex: 1;
            padding: 10px 6px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: var(--nt-text-3);
            border-radius: var(--nt-radius-sm);
            cursor: pointer;
            transition: all var(--nt-transition);
            border: none;
            background: none;
        }
        .nt-nav-item:hover { color: var(--nt-text-2); background: var(--nt-bg3); }
        .nt-nav-item.active {
            color: var(--nt-text);
            background: var(--nt-surface);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .nt-nav-item i { margin-right: 6px; }

        /* Back header */
        .nt-back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
        }
        .nt-back-btn {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-back-btn:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Card */
        .nt-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 20px;
            animation: nt-fadeIn 0.3s ease;
        }

        /* Certificate grid */
        .nt-cert-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
        }
        @media (max-width: 640px) {
            .nt-cert-grid { grid-template-columns: 1fr; }
        }
        .nt-cert-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            overflow: hidden;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-cert-card:hover {
            border-color: var(--nt-border-h);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .nt-cert-thumb {
            height: 120px;
            background: var(--nt-bg3);
            display: flex; align-items: center; justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .nt-cert-thumb img {
            width: 100%; height: 100%; object-fit: cover; opacity: 0.8;
        }
        .nt-cert-info {
            padding: 14px;
        }
        .nt-card-action {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 600;
            color: var(--nt-text-2);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            border-radius: 8px;
            cursor: pointer;
            transition: all var(--nt-transition);
            text-decoration: none;
            font-family: inherit;
        }
        .nt-card-action:hover {
            color: var(--nt-accent);
            border-color: rgba(245,158,11,0.3);
            background: var(--nt-accent-glow);
        }

        /* Dropzone */
        .nt-dropzone {
            border: 2px dashed var(--nt-border-h);
            border-radius: var(--nt-radius-lg);
            padding: 48px 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(0,0,0,0.15);
        }
        .nt-dropzone:hover {
            border-color: rgba(245,158,11,0.4);
            background: var(--nt-accent-glow);
        }
        .nt-dropzone.drag-over {
            border-color: var(--nt-accent);
            background: var(--nt-accent-glow);
            transform: scale(1.01);
        }

        /* Wizard steps */
        .nt-steps {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            margin-bottom: 28px;
        }
        .nt-step-dot {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        .nt-step-dot.pending {
            background: var(--nt-bg3);
            color: var(--nt-text-3);
            border: 2px solid var(--nt-border);
        }
        .nt-step-dot.active {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            box-shadow: 0 0 20px rgba(245,158,11,0.3);
        }
        .nt-step-dot.done {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #fff;
        }
        .nt-step-line {
            width: 60px; height: 3px;
            background: var(--nt-border);
            border-radius: 2px;
            transition: all 0.4s ease;
        }
        .nt-step-line.done { background: var(--nt-green); }
        .nt-step-line.active { background: linear-gradient(90deg, var(--nt-green), var(--nt-accent)); }

        /* Fee box */
        .nt-fee-box {
            background: rgba(245,158,11,0.06);
            border: 1px solid rgba(245,158,11,0.15);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
        .nt-fee-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .nt-fee-row + .nt-fee-row {
            border-top: 1px solid var(--nt-border);
        }

        /* Verify */
        .nt-verified {
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }
        .nt-not-found {
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: var(--nt-radius);
            padding: 20px;
        }

        /* Stats */
        .nt-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        @media (min-width: 640px) {
            .nt-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .nt-stat-card {
            background: var(--nt-bg2);
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius);
            padding: 16px;
            text-align: center;
            animation: nt-fadeIn 0.3s ease;
        }
        .nt-stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--nt-text);
            font-family: monospace;
        }
        .nt-recent-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-bottom: 1px solid var(--nt-border);
            transition: background var(--nt-transition);
        }
        .nt-recent-item:hover { background: var(--nt-bg3); }
        .nt-recent-item:last-child { border-bottom: none; }

        /* Detail */
        .nt-detail { animation: nt-fadeIn 0.3s ease; }
        .nt-detail-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        @media (max-width: 640px) {
            .nt-detail-meta { grid-template-columns: 1fr; }
        }
        .nt-hash-display {
            font-family: monospace;
            font-size: 11px;
            color: var(--nt-text-2);
            background: var(--nt-bg3);
            padding: 12px;
            border-radius: var(--nt-radius-sm);
            word-break: break-all;
            cursor: pointer;
            border: 1px solid var(--nt-border);
            transition: border-color var(--nt-transition);
        }
        .nt-hash-display:hover { border-color: var(--nt-accent); }

        /* Buttons */
        .nt-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
            border: none;
            border-radius: var(--nt-radius-sm);
            padding: 12px 24px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 14px;
        }
        .nt-btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(245,158,11,0.3);
        }
        .nt-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .nt-btn-secondary {
            background: var(--nt-bg3);
            color: var(--nt-text-2);
            font-weight: 600;
            border: 1px solid var(--nt-border);
            border-radius: var(--nt-radius-sm);
            padding: 10px 20px;
            cursor: pointer;
            transition: all var(--nt-transition);
            font-size: 13px;
        }
        .nt-btn-secondary:hover { background: var(--nt-surface); color: var(--nt-text); }
        .nt-btn-icon {
            width: 36px; height: 36px;
            border-radius: var(--nt-radius-sm);
            background: var(--nt-bg3);
            border: 1px solid var(--nt-border);
            color: var(--nt-text-2);
            display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--nt-transition);
        }
        .nt-btn-icon:hover { background: var(--nt-surface); color: var(--nt-text); }

        /* Overlay */
        .nt-overlay {
            position: fixed; inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.92);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center; justify-content: center;
        }
        .nt-overlay.active { display: flex; }

        /* Shimmer loading */
        .nt-shimmer {
            background: linear-gradient(90deg, var(--nt-bg3) 25%, var(--nt-surface) 50%, var(--nt-bg3) 75%);
            background-size: 200% 100%;
            animation: nt-shimmer 1.5s ease infinite;
            border-radius: var(--nt-radius-sm);
        }

        /* Duplicate warning */
        .nt-duplicate-warn {
            background: rgba(251,191,36,0.08);
            border: 1px solid rgba(251,191,36,0.25);
            border-radius: var(--nt-radius);
            padding: 16px;
        }
    `;
    document.head.appendChild(style);

    // Remove old styles
    const old = document.getElementById('notary-styles-v6');
    if (old) old.remove();
}
