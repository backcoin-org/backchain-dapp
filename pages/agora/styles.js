// pages/agora/styles.js
// Agora V13 — CSS injection (design system)
// ============================================================================

export function injectStyles() {
    if (document.getElementById('agora-styles-v13')) return;
    // Clean up old versions
    const oldIds = ['agora-styles-v11', 'backchat-styles-v70'];
    oldIds.forEach(id => document.getElementById(id)?.remove());

    const style = document.createElement('style');
    style.id = 'agora-styles-v13';
    style.textContent = `
        :root {
            --bc-bg: #0a0a0c; --bc-bg2: #111115; --bc-bg3: #1a1a20;
            --bc-surface: #212128; --bc-border: rgba(255,255,255,0.06);
            --bc-border-h: rgba(255,255,255,0.1); --bc-text: #ededf0;
            --bc-text-2: #9898a8; --bc-text-3: #58586a;
            --bc-accent: #f59e0b; --bc-accent-2: #d97706;
            --bc-accent-glow: rgba(245,158,11,0.12);
            --bc-red: #ef4444; --bc-green: #22c55e; --bc-blue: #3b82f6;
            --bc-purple: #8b5cf6; --bc-cyan: #06b6d4;
            --bc-radius: 14px; --bc-radius-sm: 10px; --bc-radius-lg: 20px;
            --bc-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes bc-fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bc-scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes bc-spin { to { transform:rotate(360deg); } }
        @keyframes bc-like-pop { 0% { transform:scale(1); } 40% { transform:scale(1.35); } 100% { transform:scale(1); } }
        @keyframes bc-pulse-ring { 0% { box-shadow:0 0 0 0 rgba(245,158,11,0.4); } 70% { box-shadow:0 0 0 8px rgba(245,158,11,0); } 100% { box-shadow:0 0 0 0 rgba(245,158,11,0); } }
        @keyframes bc-shimmer { 0% { background-position:-200px 0; } 100% { background-position:calc(200px + 100%) 0; } }

        .bc-shell { max-width:640px; margin:0 auto; min-height:100vh; background:var(--bc-bg); position:relative; }

        /* Header */
        .bc-header { position:sticky; top:0; z-index:200; background:rgba(10,10,12,0.85); backdrop-filter:blur(20px) saturate(1.4); -webkit-backdrop-filter:blur(20px) saturate(1.4); border-bottom:1px solid var(--bc-border); }
        .bc-header-bar { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; }
        .bc-brand { display:flex; align-items:center; gap:10px; }
        .bc-brand-icon { width:34px; height:34px; border-radius:10px; object-fit:contain; }
        .bc-brand-name { font-size:20px; font-weight:800; letter-spacing:-0.3px; background:linear-gradient(135deg,#fbbf24,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .bc-header-right { display:flex; align-items:center; gap:6px; }
        .bc-icon-btn { width:36px; height:36px; border-radius:50%; background:transparent; border:1px solid var(--bc-border); color:var(--bc-text-2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-icon-btn:hover { background:var(--bc-bg3); border-color:var(--bc-border-h); color:var(--bc-text); }

        /* Tabs */
        .bc-nav { display:flex; padding:0 20px; }
        .bc-nav-item { flex:1; padding:12px 0; background:none; border:none; border-bottom:2px solid transparent; color:var(--bc-text-3); font-size:13px; font-weight:600; letter-spacing:0.02em; cursor:pointer; transition:all var(--bc-transition); display:flex; align-items:center; justify-content:center; gap:7px; }
        .bc-nav-item:hover { color:var(--bc-text-2); }
        .bc-nav-item.active { color:var(--bc-accent); border-bottom-color:var(--bc-accent); }
        .bc-nav-item i { font-size:14px; }

        /* Tag Bar */
        .bc-tag-bar { display:flex; gap:6px; padding:10px 20px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-tag-bar::-webkit-scrollbar { display:none; }
        .bc-tag-pill { flex-shrink:0; padding:5px 12px; border-radius:20px; border:1px solid var(--bc-border); background:transparent; color:var(--bc-text-3); font-size:12px; font-weight:600; cursor:pointer; transition:all var(--bc-transition); display:flex; align-items:center; gap:5px; white-space:nowrap; }
        .bc-tag-pill:hover { border-color:var(--bc-border-h); color:var(--bc-text-2); }
        .bc-tag-pill.active { background:var(--bc-accent); border-color:var(--bc-accent); color:#000; box-shadow:0 0 10px rgba(245,158,11,0.25); }
        .bc-tag-pill i { font-size:11px; }

        /* Compose */
        .bc-compose { padding:20px; border-bottom:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-compose-row { display:flex; gap:14px; }
        .bc-compose-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,var(--bc-accent),#fbbf24); display:flex; align-items:center; justify-content:center; font-weight:700; color:#000; font-size:15px; flex-shrink:0; }
        .bc-compose-body { flex:1; min-width:0; }
        .bc-compose-textarea { width:100%; min-height:72px; max-height:240px; background:transparent; border:none; color:var(--bc-text); font-size:16px; line-height:1.5; resize:none; outline:none; font-family:inherit; }
        .bc-compose-textarea::placeholder { color:var(--bc-text-3); }
        .bc-upgrade-hint { display:flex; align-items:center; gap:6px; padding:6px 12px; margin:8px 0 0 56px; border-radius:8px; background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.1); font-size:11px; color:var(--bc-text-3); cursor:pointer; transition:all var(--bc-transition); }
        .bc-upgrade-hint:hover { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.2); }
        .bc-compose-divider { height:1px; background:var(--bc-border); margin:12px 0; }
        .bc-compose-tags { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:10px; }
        .bc-compose-tag { padding:3px 10px; border-radius:16px; border:1px solid var(--bc-border); background:transparent; color:var(--bc-text-3); font-size:11px; font-weight:600; cursor:pointer; transition:all var(--bc-transition); }
        .bc-compose-tag:hover { border-color:var(--bc-border-h); }
        .bc-compose-tag.active { border-color:var(--bc-accent); color:var(--bc-accent); background:var(--bc-accent-glow); }
        .bc-compose-bottom { display:flex; align-items:center; justify-content:space-between; }
        .bc-compose-tools { display:flex; gap:4px; }
        .bc-compose-tool { width:34px; height:34px; border-radius:50%; background:none; border:none; color:var(--bc-accent); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; transition:background var(--bc-transition); }
        .bc-compose-tool:hover:not(:disabled) { background:var(--bc-accent-glow); }
        .bc-compose-tool:disabled { color:var(--bc-text-3); cursor:not-allowed; }
        .bc-compose-right { display:flex; align-items:center; gap:14px; }
        .bc-char-count { font-size:12px; color:var(--bc-text-3); font-variant-numeric:tabular-nums; }
        .bc-char-count.warn { color:var(--bc-accent); }
        .bc-char-count.danger { color:var(--bc-red); }
        .bc-compose-fee { font-size:11px; color:var(--bc-text-3); background:var(--bc-bg3); padding:4px 10px; border-radius:20px; }
        .bc-post-btn { padding:9px 22px; background:linear-gradient(135deg,#f59e0b,#d97706); border:none; border-radius:24px; color:#000; font-weight:700; font-size:14px; cursor:pointer; transition:all var(--bc-transition); }
        .bc-post-btn:hover:not(:disabled) { box-shadow:0 4px 20px rgba(245,158,11,0.35); transform:translateY(-1px); }
        .bc-post-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

        /* Post Card */
        .bc-post { padding:18px 20px; border-bottom:1px solid var(--bc-border); transition:all var(--bc-transition); animation:bc-fadeIn 0.35s ease-out both; cursor:pointer; border-left:2px solid transparent; }
        .bc-post:hover { background:rgba(255,255,255,0.02); border-left-color:var(--bc-accent); }
        .bc-post-top { display:flex; gap:12px; }
        .bc-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,var(--bc-accent),#fbbf24); display:flex; align-items:center; justify-content:center; font-weight:700; color:#000; font-size:15px; flex-shrink:0; cursor:pointer; transition:transform var(--bc-transition); }
        .bc-avatar:hover { transform:scale(1.06); }
        .bc-avatar.boosted { box-shadow:0 0 0 2.5px var(--bc-bg), 0 0 0 4.5px var(--bc-accent); animation:bc-pulse-ring 2s infinite; }
        .bc-post-head { flex:1; min-width:0; }
        .bc-post-author-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .bc-author-name { font-weight:700; color:var(--bc-text); font-size:15px; cursor:pointer; transition:color var(--bc-transition); }
        .bc-author-name:hover { color:var(--bc-accent); }
        .bc-verified-icon { color:var(--bc-accent); font-size:13px; }
        .bc-post-time { color:var(--bc-text-3); font-size:13px; }
        .bc-edited-hint { font-size:11px; opacity:0.6; cursor:default; }
        .bc-post-context { color:var(--bc-text-3); font-size:13px; margin-top:1px; }
        .bc-tag-badge { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; letter-spacing:0.02em; border:1px solid; opacity:0.8; }
        .bc-trending-tag { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:11px; font-weight:700; }
        .bc-trending-tag i { font-size:9px; }
        .bc-post-body { margin-top:10px; margin-left:56px; color:var(--bc-text); font-size:15px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
        .bc-post-media { margin-top:14px; margin-left:56px; border-radius:var(--bc-radius); overflow:hidden; border:1px solid var(--bc-border); }
        .bc-post-media img { width:100%; max-height:420px; object-fit:cover; display:block; }
        .bc-post-media video { width:100%; max-height:480px; display:block; background:#000; }
        .bc-post-deleted { margin-top:10px; margin-left:56px; color:var(--bc-text-3); font-size:14px; font-style:italic; }
        .bc-pinned-banner { display:flex; align-items:center; gap:6px; padding:8px 20px 0 68px; font-size:12px; color:var(--bc-accent); font-weight:600; }
        .bc-pinned-banner i { font-size:11px; }
        .bc-repost-banner { display:flex; align-items:center; gap:6px; padding:8px 20px 0 68px; font-size:13px; color:var(--bc-green); font-weight:600; }
        .bc-repost-banner i { font-size:12px; }

        /* Post Menu */
        .bc-post-menu-wrap { position:relative; margin-left:auto; }
        .bc-post-menu-btn { width:30px; height:30px; border-radius:50%; background:transparent; border:none; color:var(--bc-text-3); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-post-menu-btn:hover { background:var(--bc-bg3); color:var(--bc-text-2); }
        .bc-post-dropdown { position:absolute; top:100%; right:0; z-index:100; min-width:160px; background:var(--bc-bg2); border:1px solid var(--bc-border-h); border-radius:var(--bc-radius-sm); padding:6px 0; box-shadow:0 8px 30px rgba(0,0,0,0.5); animation:bc-scaleIn 0.15s ease-out; }
        .bc-post-dropdown-item { display:flex; align-items:center; gap:8px; width:100%; padding:10px 16px; background:none; border:none; color:var(--bc-text-2); font-size:13px; cursor:pointer; transition:all var(--bc-transition); text-align:left; }
        .bc-post-dropdown-item:hover { background:var(--bc-bg3); color:var(--bc-text); }
        .bc-post-dropdown-item.danger { color:var(--bc-red); }
        .bc-post-dropdown-item.danger:hover { background:rgba(239,68,68,0.08); }
        .bc-post-dropdown-item i { width:16px; text-align:center; font-size:13px; }

        /* Engagement Bar */
        .bc-actions { display:flex; gap:2px; margin-top:12px; margin-left:56px; max-width:480px; justify-content:space-between; }
        .bc-action { display:flex; align-items:center; gap:5px; padding:6px 10px; background:none; border:none; border-radius:20px; color:var(--bc-text-3); font-size:13px; cursor:pointer; transition:all var(--bc-transition); }
        .bc-action i { font-size:15px; transition:transform 0.2s; }
        .bc-action .count { font-variant-numeric:tabular-nums; }
        .bc-action.act-reply:hover { color:var(--bc-blue); background:rgba(59,130,246,0.08); }
        .bc-action.act-repost:hover { color:var(--bc-green); background:rgba(34,197,94,0.08); }
        .bc-action.act-like:hover { color:var(--bc-red); background:rgba(239,68,68,0.08); }
        .bc-action.act-like:hover i { transform:scale(1.2); }
        .bc-action.act-like.liked { color:var(--bc-red); }
        .bc-action.act-like.liked i { animation:bc-like-pop 0.3s ease-out; }
        .bc-action.act-down:hover { color:var(--bc-purple); background:rgba(139,92,246,0.08); }
        .bc-action.act-super:hover { color:var(--bc-accent); background:var(--bc-accent-glow); }
        .bc-action.act-super:hover i { transform:scale(1.2) rotate(15deg); }
        .bc-action.act-super .bc-eth-val { font-size:11px; color:var(--bc-accent); font-weight:700; font-family:'SF Mono',monospace; }

        /* Profile */
        .bc-profile-section { animation:bc-fadeIn 0.4s ease-out; }
        .bc-profile-banner { height:120px; background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.08),rgba(10,10,12,0)); position:relative; }
        .bc-profile-main { padding:0 20px 20px; margin-top:-40px; position:relative; }
        .bc-profile-top-row { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:16px; }
        .bc-profile-pic { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,var(--bc-accent),#fbbf24); display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#000; border:4px solid var(--bc-bg); }
        .bc-profile-pic.boosted { box-shadow:0 0 0 3px var(--bc-bg), 0 0 0 5px var(--bc-accent); }
        .bc-profile-actions { display:flex; gap:8px; padding-bottom:6px; }
        .bc-profile-name-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .bc-profile-name { font-size:22px; font-weight:800; color:var(--bc-text); letter-spacing:-0.3px; }
        .bc-profile-badge { color:var(--bc-accent); font-size:16px; }
        .bc-boosted-tag { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:11px; font-weight:700; }
        .bc-profile-handle { margin-top:8px; }
        .bc-profile-handle a { color:var(--bc-text-3); text-decoration:none; font-size:13px; transition:color var(--bc-transition); }
        .bc-profile-handle a:hover { color:var(--bc-accent); }
        .bc-profile-handle a i { font-size:10px; margin-left:4px; }
        .bc-profile-bio { margin-top:8px; font-size:14px; color:var(--bc-text-2); line-height:1.5; }
        .bc-profile-username { color:var(--bc-text-3); font-size:14px; margin-top:2px; }
        .bc-profile-stats { display:grid; grid-template-columns:repeat(3, 1fr); gap:1px; margin-top:20px; background:var(--bc-border); border-radius:var(--bc-radius); overflow:hidden; }
        .bc-stat-cell { background:var(--bc-bg2); padding:16px 12px; text-align:center; }
        .bc-stat-cell:first-child { border-radius:var(--bc-radius) 0 0 var(--bc-radius); }
        .bc-stat-cell:last-child { border-radius:0 var(--bc-radius) var(--bc-radius) 0; }
        .bc-stat-value { font-size:20px; font-weight:800; color:var(--bc-text); }
        .bc-stat-label { font-size:12px; color:var(--bc-text-3); margin-top:2px; font-weight:500; }

        /* Section Header */
        .bc-section-head { padding:16px 20px; border-bottom:1px solid var(--bc-border); display:flex; align-items:center; justify-content:space-between; }
        .bc-section-title { font-size:15px; font-weight:700; color:var(--bc-text); display:flex; align-items:center; gap:8px; }
        .bc-section-title i { color:var(--bc-accent); font-size:14px; }
        .bc-section-subtitle { font-size:13px; color:var(--bc-text-3); }

        /* Discover Header */
        .bc-discover-header { padding:24px 20px; border-bottom:1px solid var(--bc-border); background:linear-gradient(180deg,rgba(245,158,11,0.06),transparent); }
        .bc-discover-header h2 { font-size:18px; font-weight:800; color:var(--bc-text); display:flex; align-items:center; gap:8px; margin:0; }
        .bc-discover-header h2 i { color:var(--bc-accent); }
        .bc-discover-header p { margin:4px 0 0; font-size:13px; color:var(--bc-text-3); }
        .bc-stats-row { display:flex; gap:16px; margin-top:16px; }
        .bc-mini-stat { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--bc-text-2); }
        .bc-mini-stat strong { color:var(--bc-text); font-weight:700; }

        /* Buttons */
        .bc-btn { padding:9px 18px; border-radius:24px; font-weight:700; font-size:13px; cursor:pointer; transition:all var(--bc-transition); border:none; display:inline-flex; align-items:center; gap:6px; letter-spacing:0.01em; }
        .bc-btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; }
        .bc-btn-primary:hover { box-shadow:0 4px 16px rgba(245,158,11,0.3); transform:translateY(-1px); }
        .bc-btn-primary:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .bc-btn-outline { background:transparent; border:1px solid var(--bc-border-h); color:var(--bc-text); }
        .bc-btn-outline:hover { background:var(--bc-bg3); border-color:rgba(255,255,255,0.15); }
        .bc-btn-follow { background:var(--bc-text); color:var(--bc-bg); }
        .bc-btn-follow:hover { opacity:0.9; }
        .bc-follow-toggle { padding:8px 20px; border-radius:24px; font-weight:700; font-size:13px; cursor:pointer; transition:all var(--bc-transition); border:none; }
        .bc-follow-toggle.do-follow { background:var(--bc-text); color:var(--bc-bg); }
        .bc-follow-toggle.do-follow:hover { opacity:0.9; }
        .bc-follow-toggle.do-unfollow { background:transparent; border:1px solid var(--bc-border-h); color:var(--bc-text); }
        .bc-follow-toggle.do-unfollow:hover { border-color:var(--bc-red); color:var(--bc-red); background:rgba(239,68,68,0.08); }

        /* Empty State */
        .bc-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:72px 24px; text-align:center; animation:bc-fadeIn 0.5s ease-out; }
        .bc-empty-glyph { width:72px; height:72px; border-radius:50%; background:var(--bc-bg3); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
        .bc-empty-glyph i { font-size:28px; color:var(--bc-text-3); }
        .bc-empty-glyph.accent { background:var(--bc-accent-glow); }
        .bc-empty-glyph.accent i { color:var(--bc-accent); }
        .bc-empty-title { font-size:18px; font-weight:700; color:var(--bc-text); margin-bottom:8px; }
        .bc-empty-text { color:var(--bc-text-3); font-size:14px; max-width:280px; line-height:1.5; }

        /* Loading */
        .bc-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:56px; gap:16px; }
        .bc-spinner { width:36px; height:36px; border:3px solid var(--bc-bg3); border-top-color:var(--bc-accent); border-radius:50%; animation:bc-spin 0.8s linear infinite; }
        .bc-loading-text { font-size:13px; color:var(--bc-text-3); }

        /* Modal */
        .bc-modal-overlay { display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:20px; }
        .bc-modal-overlay.active { display:flex; }
        .bc-modal-box { background:var(--bc-bg2); border:1px solid var(--bc-border-h); border-radius:var(--bc-radius-lg); width:100%; max-width:440px; max-height:90vh; overflow-y:auto; animation:bc-scaleIn 0.25s ease-out; }
        .bc-modal-top { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid var(--bc-border); }
        .bc-modal-title { font-size:17px; font-weight:700; color:var(--bc-text); display:flex; align-items:center; gap:8px; }
        .bc-modal-x { width:32px; height:32px; border-radius:50%; background:var(--bc-bg3); border:none; color:var(--bc-text-2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-modal-x:hover { background:var(--bc-surface); color:var(--bc-text); }
        .bc-modal-inner { padding:20px; }
        .bc-modal-desc { color:var(--bc-text-2); font-size:14px; line-height:1.5; margin-bottom:20px; }

        /* Form */
        .bc-field { margin-bottom:18px; }
        .bc-label { display:block; margin-bottom:8px; color:var(--bc-text-2); font-size:13px; font-weight:600; }
        .bc-input { width:100%; padding:12px 16px; background:var(--bc-bg3); border:1px solid var(--bc-border-h); border-radius:var(--bc-radius-sm); color:var(--bc-text); font-size:15px; outline:none; transition:border-color var(--bc-transition); font-family:inherit; box-sizing:border-box; }
        .bc-input:focus { border-color:rgba(245,158,11,0.5); }
        .bc-fee-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.15); border-radius:var(--bc-radius-sm); }
        .bc-fee-label { font-size:13px; color:var(--bc-accent); font-weight:500; }
        .bc-fee-val { font-size:14px; font-weight:700; color:var(--bc-text); }

        /* Back Header */
        .bc-back-header { display:flex; align-items:center; gap:12px; padding:14px 20px; }
        .bc-back-btn { width:34px; height:34px; border-radius:50%; background:transparent; border:1px solid var(--bc-border); color:var(--bc-text); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-back-btn:hover { background:var(--bc-bg3); border-color:var(--bc-border-h); }
        .bc-back-title { font-size:17px; font-weight:700; color:var(--bc-text); }

        /* Wizard */
        .bc-wizard { padding:24px 20px; animation:bc-fadeIn 0.4s ease-out; }
        .bc-wizard-title { font-size:22px; font-weight:800; color:var(--bc-text); margin-bottom:6px; }
        .bc-wizard-desc { font-size:14px; color:var(--bc-text-3); margin-bottom:24px; line-height:1.5; }
        .bc-wizard-dots { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:28px; }
        .bc-wizard-dot { width:10px; height:10px; border-radius:50%; background:var(--bc-bg3); transition:all var(--bc-transition); }
        .bc-wizard-dot.active { background:var(--bc-accent); width:28px; border-radius:10px; }
        .bc-wizard-dot.done { background:var(--bc-green); }
        .bc-wizard-card { background:var(--bc-bg2); border:1px solid var(--bc-border); border-radius:var(--bc-radius-lg); padding:24px; margin-bottom:20px; }
        .bc-username-row { display:flex; align-items:center; gap:8px; margin-top:8px; min-height:24px; }
        .bc-username-ok { color:var(--bc-green); font-size:13px; display:flex; align-items:center; gap:4px; }
        .bc-username-taken { color:var(--bc-red); font-size:13px; display:flex; align-items:center; gap:4px; }
        .bc-username-checking { color:var(--bc-text-3); font-size:13px; }
        .bc-username-fee { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.15); border-radius:20px; color:var(--bc-accent); font-size:12px; font-weight:600; margin-left:8px; }
        .bc-wizard-nav { display:flex; gap:12px; margin-top:20px; }
        .bc-wizard-nav .bc-btn { flex:1; justify-content:center; }

        /* Thread */
        .bc-thread-parent { border-bottom:1px solid var(--bc-border); }
        .bc-thread-divider { padding:12px 20px; font-size:13px; font-weight:700; color:var(--bc-text-2); border-bottom:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-thread-reply { position:relative; padding-left:36px; }
        .bc-thread-reply::before { content:''; position:absolute; left:40px; top:0; bottom:0; width:2px; background:var(--bc-border); }
        .bc-thread-reply:last-child::before { bottom:50%; }
        .bc-reply-compose { padding:16px 20px; border-top:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-reply-label { font-size:13px; color:var(--bc-text-3); margin-bottom:8px; }
        .bc-reply-row { display:flex; gap:12px; align-items:flex-start; }
        .bc-reply-input { flex:1; min-height:48px; max-height:160px; background:var(--bc-bg3); border:1px solid var(--bc-border-h); border-radius:var(--bc-radius-sm); color:var(--bc-text); font-size:14px; padding:10px 14px; resize:none; outline:none; font-family:inherit; }
        .bc-reply-input:focus { border-color:rgba(245,158,11,0.5); }
        .bc-reply-send { padding:10px 18px; }

        /* Image Upload */
        .bc-image-preview { position:relative; margin-top:12px; border-radius:var(--bc-radius); overflow:hidden; border:1px solid var(--bc-border); max-height:200px; }
        .bc-image-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
        .bc-image-remove { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.7); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; }
        .bc-image-remove:hover { background:var(--bc-red); }
        .bc-uploading-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:12px; margin-top:8px; }
        .bc-video-badge { position:absolute; bottom:8px; left:8px; display:flex; align-items:center; gap:4px; padding:3px 10px; background:rgba(0,0,0,0.75); border-radius:12px; color:#fff; font-size:11px; font-weight:600; }
        .bc-video-badge i { font-size:9px; }

        /* Profile Create Banner */
        .bc-profile-create-banner { margin:16px 20px; padding:16px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:var(--bc-radius); text-align:center; animation:bc-fadeIn 0.4s ease-out; }
        .bc-profile-create-banner p { font-size:13px; color:var(--bc-text-2); margin-bottom:12px; }

        /* Live Streaming */
        .bc-live-bar { padding:16px 20px; background:linear-gradient(135deg, rgba(239,68,68,0.08), rgba(0,0,0,0.4)); border-bottom:1px solid rgba(239,68,68,0.2); }
        .bc-live-bar-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .bc-live-indicator { display:flex; align-items:center; gap:8px; }
        .bc-live-dot { width:10px; height:10px; border-radius:50%; background:#ef4444; animation:bc-pulse-ring 1.5s infinite; }
        .bc-live-label { font-weight:700; color:#ef4444; font-size:14px; }
        .bc-live-viewers { font-size:12px; color:var(--bc-text-3); }
        .bc-live-video { width:100%; border-radius:var(--bc-radius); background:#000; max-height:400px; object-fit:cover; }
        .bc-live-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:12px; color:#ef4444; font-size:10px; font-weight:700; margin-left:6px; }
        .bc-live-badge-dot { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:bc-pulse-ring 1.5s infinite; }
        .bc-live-join { padding:16px 20px; background:rgba(239,68,68,0.05); border-bottom:1px solid rgba(239,68,68,0.2); text-align:center; }
        .bc-go-live-btn { background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:8px 16px; border-radius:var(--bc-radius-sm); cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s; }
        .bc-go-live-btn:hover { filter:brightness(1.1); transform:scale(1.02); }
        .bc-go-live-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        /* Skeleton Loader */
        .bc-skeleton-post { padding:18px 20px; border-bottom:1px solid var(--bc-border); display:flex; gap:12px; }
        .bc-skeleton-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; }
        .bc-skeleton-body { flex:1; display:flex; flex-direction:column; gap:10px; }
        .bc-skeleton-line { height:12px; border-radius:6px; }
        .bc-skeleton-line.short { width:40%; }
        .bc-skeleton-line.medium { width:75%; }
        .bc-skeleton-line.long { width:90%; }
        .bc-skeleton-actions { display:flex; gap:24px; margin-top:4px; }
        .bc-skeleton-dot { width:18px; height:12px; border-radius:6px; }
        .bc-skeleton-avatar, .bc-skeleton-line, .bc-skeleton-dot {
            background:linear-gradient(90deg, var(--bc-bg3) 25%, rgba(255,255,255,0.06) 50%, var(--bc-bg3) 75%);
            background-size:200px 100%;
            animation:bc-shimmer 1.5s infinite linear;
        }

        /* Trending Rank Badge */
        .bc-rank-badge { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; font-size:11px; font-weight:800; flex-shrink:0; margin-right:4px; }
        .bc-rank-1 { background:linear-gradient(135deg,#fbbf24,#f59e0b); color:#000; box-shadow:0 0 12px rgba(245,158,11,0.4); }
        .bc-rank-2 { background:linear-gradient(135deg,#d1d5db,#9ca3af); color:#000; }
        .bc-rank-3 { background:linear-gradient(135deg,#f59e0b,#92400e); color:#fff; }

        /* Media Grid (composer multi-upload) */
        .bc-media-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:8px; margin-top:12px; }
        .bc-media-thumb { position:relative; aspect-ratio:1; border-radius:var(--bc-radius-sm); overflow:hidden; border:1px solid var(--bc-border); }
        .bc-media-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .bc-media-thumb .bc-image-remove { position:absolute; top:4px; right:4px; width:22px; height:22px; font-size:11px; }
        .bc-media-thumb .bc-video-badge { bottom:4px; left:4px; padding:2px 6px; font-size:9px; }
        .bc-media-add { display:flex; align-items:center; justify-content:center; background:var(--bc-bg3); border:2px dashed var(--bc-border-h); cursor:pointer; color:var(--bc-text-3); font-size:20px; transition:all var(--bc-transition); }
        .bc-media-add:hover { border-color:var(--bc-accent); color:var(--bc-accent); background:var(--bc-accent-glow); }

        /* Read More */
        .bc-read-more { color:var(--bc-accent); cursor:pointer; font-weight:600; font-size:14px; margin-left:4px; transition:opacity var(--bc-transition); }
        .bc-read-more:hover { opacity:0.8; text-decoration:underline; }

        /* Media Carousel */
        .bc-carousel { position:relative; user-select:none; -webkit-user-select:none; }
        .bc-carousel-track { position:relative; overflow:hidden; }
        .bc-carousel-slide { width:100%; }
        .bc-carousel-slide img, .bc-carousel-slide video { width:100%; max-height:480px; object-fit:cover; display:block; background:#000; }
        .bc-carousel-dots { display:flex; justify-content:center; gap:5px; padding:8px 0; position:absolute; bottom:8px; left:50%; transform:translateX(-50%); z-index:5; }
        .bc-carousel-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.35); cursor:pointer; transition:all 0.2s; border:none; padding:0; }
        .bc-carousel-dot.active { background:#fff; width:20px; border-radius:10px; }
        .bc-carousel-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:5; width:32px; height:32px; border-radius:50%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.15); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:all var(--bc-transition); }
        .bc-carousel-arrow:hover { background:rgba(0,0,0,0.8); border-color:rgba(255,255,255,0.3); }
        .bc-carousel-prev { left:8px; }
        .bc-carousel-next { right:8px; }
        .bc-carousel-counter { position:absolute; top:10px; right:10px; z-index:5; padding:3px 10px; border-radius:12px; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); color:#fff; font-size:11px; font-weight:600; letter-spacing:0.02em; }

        /* Video overlay for auto-play */
        .bc-video-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:3; cursor:pointer; }
        .bc-video-mute-btn { position:absolute; bottom:12px; right:12px; width:32px; height:32px; border-radius:50%; background:rgba(0,0,0,0.6); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; z-index:4; transition:all var(--bc-transition); }
        .bc-video-mute-btn:hover { background:rgba(0,0,0,0.85); }
        .bc-video-progress { position:absolute; bottom:0; left:0; height:3px; background:var(--bc-accent); z-index:4; transition:width 0.25s linear; border-radius:0 2px 0 0; }

        /* Discover Mode Toggle */
        .bc-discover-mode-toggle { display:inline-flex; gap:2px; background:var(--bc-bg3); border-radius:8px; padding:2px; margin-left:12px; vertical-align:middle; }
        .bc-mode-btn { width:30px; height:28px; border:none; background:transparent; color:var(--bc-text-3); cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:13px; transition:all var(--bc-transition); }
        .bc-mode-btn.active { background:var(--bc-accent); color:#000; }
        .bc-mode-btn:hover:not(.active) { color:var(--bc-text); }

        /* TikTok Feed */
        .bc-tiktok-feed { scroll-snap-type:y mandatory; overflow-y:auto; height:calc(100vh - 110px); scroll-behavior:smooth; }
        .bc-tiktok-card { position:relative; width:100%; height:calc(100vh - 110px); scroll-snap-align:start; scroll-snap-stop:always; overflow:hidden; cursor:pointer; }
        .bc-tiktok-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .bc-tiktok-img-overlay { position:absolute; inset:0; background:linear-gradient(transparent 40%, rgba(0,0,0,0.7)); z-index:1; }
        .bc-tiktok-overlay { position:absolute; inset:0; z-index:2; display:flex; flex-direction:column; justify-content:flex-end; background:linear-gradient(transparent 50%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.85)); pointer-events:none; }
        .bc-tiktok-bottom { display:flex; align-items:flex-end; gap:12px; padding:20px 16px 24px; pointer-events:auto; }
        .bc-tiktok-info { flex:1; min-width:0; }
        .bc-tiktok-author { font-size:15px; color:#fff; cursor:pointer; display:flex; align-items:center; gap:8px; }
        .bc-tiktok-author strong { font-weight:700; }
        .bc-tiktok-time { font-size:12px; color:rgba(255,255,255,0.5); }
        .bc-tiktok-caption { font-size:14px; color:rgba(255,255,255,0.85); line-height:1.4; margin-top:6px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .bc-tiktok-actions { display:flex; flex-direction:column; align-items:center; gap:18px; flex-shrink:0; }
        .bc-tiktok-action { display:flex; flex-direction:column; align-items:center; gap:2px; color:rgba(255,255,255,0.85); cursor:pointer; transition:all 0.15s; }
        .bc-tiktok-action:hover { transform:scale(1.15); }
        .bc-tiktok-action.liked { color:var(--bc-red); }
        .bc-tiktok-action i { font-size:24px; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5)); }
        .bc-tiktok-action span { font-size:11px; font-weight:600; }
        .bc-tiktok-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,var(--bc-accent),#fbbf24); display:flex; align-items:center; justify-content:center; font-weight:700; color:#000; font-size:14px; border:2px solid #fff; overflow:hidden; }
        .bc-tiktok-avatar img { width:100%; height:100%; object-fit:cover; }

        /* Double-tap like animation */
        @keyframes bc-float-heart { 0% { opacity:1; transform:scale(0) translateY(0); } 30% { opacity:1; transform:scale(1.2) translateY(-20px); } 100% { opacity:0; transform:scale(0.8) translateY(-120px); } }
        .bc-float-heart { position:absolute; font-size:60px; color:var(--bc-red); pointer-events:none; z-index:10; animation:bc-float-heart 0.8s ease-out forwards; }

        /* Feed Sentinel (infinite scroll) */
        .bc-feed-sentinel { padding:24px 0; }

        /* Responsive */
        @media (max-width: 640px) {
            .bc-shell { max-width:100%; }
            .bc-actions { margin-left:0; margin-top:14px; }
            .bc-post-body { margin-left:0; margin-top:12px; }
            .bc-post-media { margin-left:0; }
            .bc-compose-avatar { display:none; }
        }
        @media (max-width: 480px) {
            .bc-tag-pill { font-size:11px; padding:4px 9px; }
            .bc-tag-pill i { font-size:10px; }
            .bc-action { padding:5px 6px; font-size:12px; gap:3px; }
            .bc-action i { font-size:13px; }
            .bc-stat-value { font-size:17px; }
            .bc-stat-label { font-size:11px; }
            .bc-compose-bottom { flex-wrap:wrap; gap:8px; }
            .bc-profile-pic { width:64px; height:64px; font-size:22px; }
        }

        /* Action Cart */
        .bc-cart-bar { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:640px; z-index:500; background:rgba(17,17,21,0.95); backdrop-filter:blur(20px) saturate(1.4); -webkit-backdrop-filter:blur(20px) saturate(1.4); border-top:1px solid var(--bc-border-h); animation:bc-slideUp 0.3s ease-out; }
        @keyframes bc-slideUp { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }
        .bc-cart-summary { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; cursor:pointer; }
        .bc-cart-summary:hover { background:var(--bc-bg3); }
        .bc-cart-info { display:flex; align-items:center; gap:10px; }
        .bc-cart-badge { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:50%; background:var(--bc-accent); color:#000; font-size:12px; font-weight:800; padding:0 4px; }
        .bc-cart-label { font-size:13px; color:var(--bc-text-2); }
        .bc-cart-label strong { color:var(--bc-text); font-weight:700; }
        .bc-cart-fee { display:none; }
        .bc-cart-actions { display:flex; align-items:center; gap:8px; }
        .bc-cart-submit-btn { padding:8px 18px; border-radius:24px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; font-weight:700; font-size:12px; border:none; cursor:pointer; transition:all var(--bc-transition); display:inline-flex; align-items:center; gap:6px; }
        .bc-cart-submit-btn:hover { box-shadow:0 4px 16px rgba(245,158,11,0.3); transform:translateY(-1px); }
        .bc-cart-submit-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .bc-cart-toggle { width:28px; height:28px; border-radius:50%; background:transparent; border:1px solid var(--bc-border); color:var(--bc-text-2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all var(--bc-transition); }
        .bc-cart-toggle:hover { background:var(--bc-bg3); color:var(--bc-text); }

        .bc-cart-panel { border-top:1px solid var(--bc-border); max-height:300px; overflow-y:auto; }
        .bc-cart-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--bc-border); }
        .bc-cart-title { font-size:13px; font-weight:700; color:var(--bc-text); }
        .bc-cart-clear { font-size:12px; color:var(--bc-red); cursor:pointer; background:none; border:none; font-weight:600; padding:4px 8px; border-radius:8px; transition:all var(--bc-transition); }
        .bc-cart-clear:hover { background:rgba(239,68,68,0.1); }

        .bc-cart-item { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; border-bottom:1px solid var(--bc-border); transition:background var(--bc-transition); }
        .bc-cart-item:hover { background:var(--bc-bg3); }
        .bc-cart-item-info { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .bc-cart-item-icon { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
        .bc-cart-item-icon.like { background:rgba(239,68,68,0.1); color:var(--bc-red); }
        .bc-cart-item-icon.follow { background:rgba(59,130,246,0.1); color:var(--bc-blue); }
        .bc-cart-item-icon.downvote { background:rgba(139,92,246,0.1); color:var(--bc-purple); }
        .bc-cart-item-label { font-size:13px; color:var(--bc-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bc-cart-item-type { font-size:11px; color:var(--bc-text-3); text-transform:capitalize; }
        .bc-cart-item-remove { width:24px; height:24px; border-radius:50%; background:transparent; border:none; color:var(--bc-text-3); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all var(--bc-transition); flex-shrink:0; }
        .bc-cart-item-remove:hover { background:rgba(239,68,68,0.1); color:var(--bc-red); }

        .bc-cart-footer { padding:12px 20px; border-top:1px solid var(--bc-border); }
        .bc-cart-warning { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--bc-accent); margin-top:8px; }
    `;
    document.head.appendChild(style);
}
