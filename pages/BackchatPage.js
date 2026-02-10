// pages/BackchatPage.js
// ✅ V11.0 — Agora Complete Redesign (V9 Contract Alignment)
// ═══════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                     AGORA — Unstoppable Social Network
// ═══════════════════════════════════════════════════════════════════════════
//
// V11.0 Changes (V9 Agora Contract Alignment):
// - Rebranded: Backchat → Agora
// - Removed: Referral system, earnings/withdraw (not in V9)
// - Fixed: createPost uses tag/contentType (not mediaCID)
// - Fixed: createReply has no mediaCID/tipBkc
// - Fixed: createProfile uses metadataURI (JSON) for displayName/bio
// - Fixed: updateProfile uses metadataURI only
// - Added: Tag system (15 tags, filter bar, compose tag picker)
// - Added: Downvote button (100 gwei per, unlimited)
// - Added: Delete post (soft delete, own posts)
// - Added: Pin post (1 per user)
// - Added: Post options menu (three dots)
// - Added: Global stats display in Discover tab
// - Improved: CSS design, mobile UX
//
// ═══════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, ipfsGateway, agoraABI } from '../config.js';
import { formatBigNumber } from '../utils.js';
import { BackchatTx } from '../modules/transactions/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const IPFS_GATEWAY = ipfsGateway || "https://gateway.pinata.cloud/ipfs/";
const MAX_CONTENT = 500;

const TAGS = [
    { id: 0, name: 'General', icon: 'fa-globe', color: '#8b8b9e' },
    { id: 1, name: 'DeFi', icon: 'fa-chart-line', color: '#22c55e' },
    { id: 2, name: 'NFT', icon: 'fa-gem', color: '#8b5cf6' },
    { id: 3, name: 'Gaming', icon: 'fa-gamepad', color: '#ec4899' },
    { id: 4, name: 'Tech', icon: 'fa-microchip', color: '#3b82f6' },
    { id: 5, name: 'News', icon: 'fa-newspaper', color: '#f59e0b' },
    { id: 6, name: 'Meme', icon: 'fa-face-laugh-squint', color: '#facc15' },
    { id: 7, name: 'Alpha', icon: 'fa-fire', color: '#ef4444' },
    { id: 8, name: 'DAO', icon: 'fa-landmark', color: '#06b6d4' },
    { id: 9, name: 'Learn', icon: 'fa-graduation-cap', color: '#14b8a6' },
    { id: 10, name: 'Art', icon: 'fa-palette', color: '#f472b6' },
    { id: 11, name: 'Music', icon: 'fa-music', color: '#a78bfa' },
    { id: 12, name: 'Sports', icon: 'fa-futbol', color: '#fb923c' },
    { id: 13, name: 'Food', icon: 'fa-utensils', color: '#fbbf24' },
    { id: 14, name: 'Other', icon: 'fa-hashtag', color: '#6b7280' }
];

function getBackchatAddress() {
    return addresses.agora || addresses.backchat || addresses.Backchat || null;
}

function getOperatorAddress() {
    return addresses.operator || addresses.treasury || null;
}

const bkcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// ============================================================================
// STATE
// ============================================================================

const BC = {
    view: 'feed',
    activeTab: 'feed',
    viewHistory: [],
    posts: [],
    trendingPosts: [],
    allItems: [],
    replies: new Map(),
    likesMap: new Map(),
    replyCountMap: new Map(),
    repostCountMap: new Map(),
    postsById: new Map(),
    userProfile: null,
    profiles: new Map(),
    hasProfile: null,
    following: new Set(),
    followers: new Set(),
    followCounts: new Map(),
    pendingImage: null,
    pendingImagePreview: null,
    isUploadingImage: false,
    selectedPost: null,
    selectedProfile: null,
    wizStep: 1,
    wizUsername: '',
    wizDisplayName: '',
    wizBio: '',
    wizUsernameOk: null,
    wizFee: null,
    wizChecking: false,
    fees: { post: 0n, reply: 0n, like: 0n, follow: 0n, repost: 0n, superLikeMin: 0n, downvoteMin: 0n, boostMin: 0n, badge: 0n },
    hasBadge: false,
    isBoosted: false,
    boostExpiry: 0,
    badgeExpiry: 0,
    selectedTag: -1,
    composeTag: 0,
    globalStats: null,
    isLoading: false,
    isPosting: false,
    contractAvailable: true,
    error: null
};

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('agora-styles-v11')) return;
    const old = document.getElementById('backchat-styles-v70');
    if (old) old.remove();
    const style = document.createElement('style');
    style.id = 'agora-styles-v11';
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
        .bc-tag-pill.active { background:var(--bc-accent); border-color:var(--bc-accent); color:#000; }
        .bc-tag-pill i { font-size:11px; }

        /* Compose */
        .bc-compose { padding:20px; border-bottom:1px solid var(--bc-border); background:var(--bc-bg2); }
        .bc-compose-row { display:flex; gap:14px; }
        .bc-compose-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,var(--bc-accent),#fbbf24); display:flex; align-items:center; justify-content:center; font-weight:700; color:#000; font-size:15px; flex-shrink:0; }
        .bc-compose-body { flex:1; min-width:0; }
        .bc-compose-textarea { width:100%; min-height:72px; max-height:240px; background:transparent; border:none; color:var(--bc-text); font-size:16px; line-height:1.5; resize:none; outline:none; font-family:inherit; }
        .bc-compose-textarea::placeholder { color:var(--bc-text-3); }
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
        .bc-post { padding:18px 20px; border-bottom:1px solid var(--bc-border); transition:background var(--bc-transition); animation:bc-fadeIn 0.35s ease-out both; cursor:pointer; }
        .bc-post:hover { background:rgba(255,255,255,0.015); }
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
        .bc-post-context { color:var(--bc-text-3); font-size:13px; margin-top:1px; }
        .bc-tag-badge { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; letter-spacing:0.02em; border:1px solid; opacity:0.8; }
        .bc-trending-tag { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:11px; font-weight:700; }
        .bc-trending-tag i { font-size:9px; }
        .bc-post-body { margin-top:10px; margin-left:56px; color:var(--bc-text); font-size:15px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
        .bc-post-media { margin-top:14px; margin-left:56px; border-radius:var(--bc-radius); overflow:hidden; border:1px solid var(--bc-border); }
        .bc-post-media img { width:100%; max-height:420px; object-fit:cover; display:block; }
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
        .bc-profile-handle { margin-top:4px; }
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

        /* Trending/Discover Header */
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

        /* Profile Create Banner */
        .bc-profile-create-banner { margin:16px 20px; padding:16px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:var(--bc-radius); text-align:center; animation:bc-fadeIn 0.4s ease-out; }
        .bc-profile-create-banner p { font-size:13px; color:var(--bc-text-2); margin-bottom:12px; }

        /* Responsive */
        @media (max-width: 640px) {
            .bc-shell { max-width:100%; }
            .bc-actions { margin-left:0; margin-top:14px; }
            .bc-post-body { margin-left:0; margin-top:12px; }
            .bc-post-media { margin-left:0; }
            .bc-compose-avatar { display:none; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// UTILITIES
// ============================================================================

function shortenAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeAgo(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatETH(wei) {
    if (!wei || wei === 0n) return '0';
    const eth = parseFloat(ethers.formatEther(wei));
    if (eth < 0.0001) return '<0.0001';
    if (eth < 0.01) return eth.toFixed(4);
    if (eth < 1) return eth.toFixed(3);
    return eth.toFixed(2);
}

function getInitials(address) {
    if (!address) return '?';
    return address.slice(2, 4).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseMetadata(metadataURI) {
    if (!metadataURI) return { displayName: '', bio: '' };
    try {
        const data = JSON.parse(metadataURI);
        return { displayName: data.displayName || '', bio: data.bio || '' };
    } catch {
        return { displayName: '', bio: '' };
    }
}

function getProfileName(address) {
    if (!address) return '?';
    const profile = BC.profiles.get(address.toLowerCase());
    if (profile?.displayName) return profile.displayName;
    if (profile?.username) return `@${profile.username}`;
    return shortenAddress(address);
}

function getProfileUsername(address) {
    if (!address) return null;
    return BC.profiles.get(address.toLowerCase())?.username || null;
}

function isUserBoosted(address) {
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.isBoosted;
    return false;
}

function isUserBadged(address) {
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.hasBadge;
    return false;
}

function parsePostContent(content) {
    if (!content) return { text: '', mediaCID: '' };
    const imgIdx = content.indexOf('\n[img]');
    if (imgIdx !== -1) {
        return { text: content.slice(0, imgIdx), mediaCID: content.slice(imgIdx + 6).trim() };
    }
    return { text: content, mediaCID: '' };
}

function getTagInfo(tagId) {
    return TAGS[tagId] || TAGS[0];
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateView(view, data) {
    BC.viewHistory.push({ view: BC.view, activeTab: BC.activeTab, selectedPost: BC.selectedPost, selectedProfile: BC.selectedProfile });
    BC.view = view;
    if (data?.post) BC.selectedPost = data.post;
    if (data?.profile) BC.selectedProfile = data.profile;
    render();
}

function goBack() {
    if (BC.viewHistory.length > 0) {
        const prev = BC.viewHistory.pop();
        BC.view = prev.view;
        BC.activeTab = prev.activeTab || BC.view;
        BC.selectedPost = prev.selectedPost;
        BC.selectedProfile = prev.selectedProfile;
    } else {
        BC.view = 'feed';
        BC.activeTab = 'feed';
    }
    render();
}

// ============================================================================
// CONTRACT INTERACTION
// ============================================================================

function getContract() {
    if (State.agoraContract) return State.agoraContract;
    if (State.agoraContractPublic) return State.agoraContractPublic;
    const addr = getBackchatAddress();
    if (!addr) return null;
    if (State.publicProvider) return new ethers.Contract(addr, agoraABI, State.publicProvider);
    return null;
}

async function loadFees() {
    try {
        const contract = getContract();
        if (!contract) return;
        let votePrice = 100000000n;
        try { votePrice = await contract.VOTE_PRICE(); } catch {}
        const defaultFee = ethers.parseEther('0.0001');
        BC.fees = {
            post: defaultFee, reply: defaultFee, like: defaultFee,
            follow: defaultFee, repost: defaultFee,
            superLikeMin: votePrice, downvoteMin: votePrice,
            boostMin: ethers.parseEther('0.0005'),
            badge: ethers.parseEther('0.001')
        };
    } catch (e) {
        console.warn('[Agora] Failed to load fees:', e.message);
    }
}

async function loadUserStatus() {
    if (!State.isConnected || !State.userAddress) return;
    try {
        const contract = getContract();
        if (!contract) return;
        const [profile, hasBadge, isBoosted] = await Promise.all([
            contract.getUserProfile(State.userAddress).catch(() => null),
            contract.hasTrustBadge(State.userAddress).catch(() => false),
            contract.isProfileBoosted(State.userAddress).catch(() => false)
        ]);
        BC.hasBadge = hasBadge;
        BC.isBoosted = isBoosted;
        BC.boostExpiry = profile ? Number(profile.boostExp || profile[5] || 0) : 0;
        BC.badgeExpiry = profile ? Number(profile.badgeExp || profile[6] || 0) : 0;
    } catch (e) {
        console.warn('[Agora] Failed to load user status:', e.message);
    }
}

async function loadGlobalStats() {
    try {
        const stats = await BackchatTx.getGlobalStats();
        BC.globalStats = stats;
    } catch (e) {
        console.warn('[Agora] Failed to load global stats:', e.message);
    }
}

async function loadProfiles() {
    try {
        const contract = getContract();
        if (!contract) { BC.hasProfile = false; return; }

        const createEvents = await contract.queryFilter(contract.filters.ProfileCreated(), -50000).catch(() => []);
        for (const ev of createEvents) {
            const addr = ev.args.user.toLowerCase();
            const meta = parseMetadata(ev.args.metadataURI);
            BC.profiles.set(addr, {
                username: ev.args.username,
                metadataURI: ev.args.metadataURI || '',
                displayName: meta.displayName,
                bio: meta.bio
            });
        }

        if (State.isConnected && State.userAddress) {
            const myAddr = State.userAddress.toLowerCase();
            let myProfile = BC.profiles.get(myAddr);
            if (!myProfile) {
                try {
                    const profile = await contract.getUserProfile(State.userAddress);
                    if (profile && profile.usernameHash && profile.usernameHash !== ethers.ZeroHash) {
                        const meta = parseMetadata(profile.metadataURI || profile[1] || '');
                        myProfile = { username: null, metadataURI: profile.metadataURI || profile[1] || '', displayName: meta.displayName, bio: meta.bio };
                        BC.profiles.set(myAddr, myProfile);
                    }
                } catch {}
            }
            if (myProfile) {
                BC.userProfile = { ...myProfile, address: State.userAddress };
                BC.hasProfile = true;
            } else {
                BC.hasProfile = false;
                BC.userProfile = null;
            }
        } else {
            BC.hasProfile = false;
        }
        console.log('[Agora] Profiles loaded:', BC.profiles.size, '| hasProfile:', BC.hasProfile);
    } catch (e) {
        console.warn('[Agora] Failed to load profiles:', e.message);
        BC.hasProfile = false;
    }
    renderContent();
}

async function loadSocialGraph() {
    BC.following = new Set();
    BC.followers = new Set();
    BC.followCounts = new Map();
}

async function loadPosts() {
    BC.isLoading = true;
    renderContent();

    try {
        const backchatAddress = getBackchatAddress();
        if (!backchatAddress) {
            BC.contractAvailable = false;
            BC.error = 'Agora contract not deployed yet.';
            return;
        }
        const contract = getContract();
        if (!contract) {
            BC.contractAvailable = false;
            BC.error = 'Could not connect to Agora contract';
            return;
        }
        BC.contractAvailable = true;

        const [postEvents, replyEvents, repostEvents] = await Promise.all([
            contract.queryFilter(contract.filters.PostCreated(), -50000).catch(() => []),
            contract.queryFilter(contract.filters.ReplyCreated(), -50000).catch(() => []),
            contract.queryFilter(contract.filters.RepostCreated(), -50000).catch(() => [])
        ]);

        const allEventItems = [];
        for (const ev of postEvents.slice(-80)) allEventItems.push({ ev, type: 'post' });
        for (const ev of replyEvents.slice(-60)) allEventItems.push({ ev, type: 'reply' });
        for (const ev of repostEvents.slice(-30)) allEventItems.push({ ev, type: 'repost' });

        const allItems = [];
        const feedPosts = [];
        BC.postsById = new Map();
        BC.replies = new Map();
        BC.replyCountMap = new Map();
        BC.repostCountMap = new Map();
        BC.likesMap = new Map();

        for (let i = 0; i < allEventItems.length; i += 10) {
            const batch = allEventItems.slice(i, i + 10);
            const metadataBatch = await Promise.all(
                batch.map(({ ev }) => {
                    const pid = ev.args.postId || ev.args.newPostId;
                    return contract.getPost(pid).catch(() => null);
                })
            );

            for (let j = 0; j < batch.length; j++) {
                const { ev, type } = batch[j];
                const meta = metadataBatch[j];
                const pid = (ev.args.postId || ev.args.newPostId).toString();

                if (meta && meta.deleted) continue;

                const timestamp = meta ? Number(meta.createdAt || meta[4] || 0) : 0;
                const likesCount = meta ? Number(meta.likes || meta[7] || 0) : 0;
                const superLikesCount = meta ? BigInt(meta.superLikes || meta[8] || 0) : 0n;
                const downvotesCount = meta ? Number(meta.downvotes || meta[9] || 0) : 0;
                const repliesCount = meta ? Number(meta.replies || meta[10] || 0) : 0;
                const repostsCount = meta ? Number(meta.reposts || meta[11] || 0) : 0;
                const postTag = meta ? Number(meta.tag || meta[1] || 0) : 0;

                if (type === 'post') {
                    const { text, mediaCID } = parsePostContent(ev.args.contentHash || ev.args.content || '');
                    const post = {
                        id: pid, type: 'post',
                        author: ev.args.author,
                        content: text, mediaCID,
                        tag: ev.args.tag != null ? Number(ev.args.tag) : postTag,
                        timestamp, superLikes: superLikesCount,
                        likesCount, downvotesCount, repliesCount, repostsCount,
                        txHash: ev.transactionHash
                    };
                    allItems.push(post);
                    feedPosts.push(post);
                    BC.postsById.set(pid, post);
                } else if (type === 'reply') {
                    const parentId = ev.args.parentId.toString();
                    const { text, mediaCID } = parsePostContent(ev.args.contentHash || ev.args.content || '');
                    const reply = {
                        id: pid, type: 'reply', parentId,
                        author: ev.args.author,
                        content: text, mediaCID,
                        tag: ev.args.tag != null ? Number(ev.args.tag) : postTag,
                        timestamp, superLikes: superLikesCount,
                        likesCount, downvotesCount,
                        txHash: ev.transactionHash
                    };
                    allItems.push(reply);
                    BC.postsById.set(pid, reply);
                    if (!BC.replies.has(parentId)) BC.replies.set(parentId, []);
                    BC.replies.get(parentId).push(reply);
                    BC.replyCountMap.set(parentId, (BC.replyCountMap.get(parentId) || 0) + 1);
                } else if (type === 'repost') {
                    const originalPostId = ev.args.originalId?.toString() || ev.args.originalPostId?.toString() || '0';
                    const repost = {
                        id: pid, type: 'repost', originalPostId,
                        author: ev.args.author || ev.args.reposter,
                        timestamp, superLikes: 0n,
                        txHash: ev.transactionHash
                    };
                    allItems.push(repost);
                    feedPosts.push(repost);
                    BC.postsById.set(pid, repost);
                    BC.repostCountMap.set(originalPostId, (BC.repostCountMap.get(originalPostId) || 0) + 1);
                }
            }
        }

        if (State.isConnected && State.userAddress) {
            const postIds = allItems.filter(p => p.type !== 'repost').map(p => p.id);
            for (let i = 0; i < postIds.length; i += 10) {
                const batch = postIds.slice(i, i + 10);
                const results = await Promise.all(
                    batch.map(pid => contract.hasLiked(pid, State.userAddress).catch(() => false))
                );
                for (let j = 0; j < batch.length; j++) {
                    if (results[j]) {
                        if (!BC.likesMap.has(batch[j])) BC.likesMap.set(batch[j], new Set());
                        BC.likesMap.get(batch[j]).add(State.userAddress.toLowerCase());
                    }
                }
            }
        }

        feedPosts.sort((a, b) => b.timestamp - a.timestamp);
        BC.posts = feedPosts;
        BC.allItems = allItems;
        BC.trendingPosts = [...allItems]
            .filter(p => p.type !== 'repost' && p.superLikes > 0n)
            .sort((a, b) => {
                const aVal = BigInt(a.superLikes || 0);
                const bVal = BigInt(b.superLikes || 0);
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            });

    } catch (e) {
        console.error('[Agora] Failed to load posts:', e);
        BC.error = e.message;
    } finally {
        BC.isLoading = false;
        renderContent();
    }
}

// ============================================================================
// ACTIONS
// ============================================================================

async function doCreatePost() {
    const input = document.getElementById('bc-compose-input');
    const content = input?.value?.trim();
    if (!content) { showToast('Please write something', 'error'); return; }
    if (content.length > MAX_CONTENT) { showToast(`Post too long (max ${MAX_CONTENT} chars)`, 'error'); return; }

    BC.isPosting = true;
    renderContent();

    let finalContent = content;
    let contentType = 0;

    if (BC.pendingImage) {
        try {
            BC.isUploadingImage = true;
            renderContent();
            const result = await uploadImageToIPFS(BC.pendingImage);
            const cid = result.ipfsHash || '';
            if (cid) {
                finalContent = content + '\n[img]' + cid;
                contentType = 1;
            }
        } catch (e) {
            showToast('Image upload failed: ' + e.message, 'error');
            BC.isPosting = false;
            BC.isUploadingImage = false;
            renderContent();
            return;
        } finally {
            BC.isUploadingImage = false;
        }
    }

    const btn = document.getElementById('bc-post-btn');
    await BackchatTx.createPost({
        content: finalContent,
        tag: BC.composeTag,
        contentType,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            BC.pendingImage = null;
            BC.pendingImagePreview = null;
            BC.composeTag = 0;
            BC.isPosting = false;
            showToast('Post created!', 'success');
            await loadPosts();
        },
        onError: () => {
            BC.isPosting = false;
            renderContent();
        }
    });
    BC.isPosting = false;
    renderContent();
}

async function doCreateReply(parentId) {
    const input = document.getElementById('bc-reply-input');
    const content = input?.value?.trim();
    if (!content) { showToast('Please write a reply', 'error'); return; }

    const btn = document.getElementById('bc-reply-btn');
    await BackchatTx.createReply({
        parentId,
        content,
        contentType: 0,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            showToast('Reply posted!', 'success');
            await loadPosts();
            renderContent();
        }
    });
}

async function doRepost(originalPostId) {
    const btn = document.getElementById('bc-repost-confirm-btn');
    await BackchatTx.createRepost({
        originalPostId,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            closeModal('repost');
            showToast('Reposted!', 'success');
            await loadPosts();
        }
    });
}

async function doLike(postId) {
    const myAddr = State.userAddress?.toLowerCase();
    if (myAddr) {
        if (!BC.likesMap.has(postId)) BC.likesMap.set(postId, new Set());
        BC.likesMap.get(postId).add(myAddr);
        renderContent();
    }
    await BackchatTx.like({
        postId,
        operator: getOperatorAddress(),
        onSuccess: () => showToast('Liked!', 'success'),
        onError: () => {
            BC.likesMap.get(postId)?.delete(myAddr);
            renderContent();
        }
    });
}

async function doSuperLike(postId, amount) {
    const ethAmount = ethers.parseEther(amount || '0.001');
    await BackchatTx.superLike({
        postId,
        ethAmount,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast('Super Liked!', 'success');
            await loadPosts();
        }
    });
}

async function doDownvote(postId, amount) {
    const ethAmount = ethers.parseEther(amount || '0.001');
    await BackchatTx.downvote({
        postId,
        ethAmount,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast('Downvoted', 'success');
            await loadPosts();
        }
    });
}

async function doDeletePost(postId) {
    await BackchatTx.deletePost({
        postId,
        onSuccess: async () => {
            showToast('Post deleted', 'success');
            await loadPosts();
        }
    });
}

async function doPinPost(postId) {
    await BackchatTx.pinPost({
        postId,
        onSuccess: async () => {
            showToast('Post pinned!', 'success');
            await loadPosts();
        }
    });
}

async function doFollow(address) {
    await BackchatTx.follow({
        toFollow: address,
        operator: getOperatorAddress(),
        onSuccess: () => {
            BC.following.add(address.toLowerCase());
            showToast('Followed!', 'success');
            renderContent();
        }
    });
}

async function doUnfollow(address) {
    await BackchatTx.unfollow({
        toUnfollow: address,
        onSuccess: () => {
            BC.following.delete(address.toLowerCase());
            showToast('Unfollowed', 'success');
            renderContent();
        }
    });
}

async function doCreateProfile() {
    const metadataURI = JSON.stringify({ displayName: BC.wizDisplayName, bio: BC.wizBio });
    const btn = document.getElementById('bc-wizard-confirm-btn');

    await BackchatTx.createProfile({
        username: BC.wizUsername,
        metadataURI,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            showToast('Profile created!', 'success');
            BC.hasProfile = true;
            BC.userProfile = { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio, address: State.userAddress };
            BC.profiles.set(State.userAddress.toLowerCase(), { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio });
            BC.wizStep = 1; BC.wizUsername = ''; BC.wizDisplayName = ''; BC.wizBio = '';
            BC.view = 'profile';
            BC.activeTab = 'profile';
            render();
        }
    });
}

async function doUpdateProfile() {
    const displayName = document.getElementById('edit-displayname')?.value?.trim() || '';
    const bio = document.getElementById('edit-bio')?.value?.trim() || '';
    const metadataURI = JSON.stringify({ displayName, bio });
    const btn = document.getElementById('bc-edit-profile-btn');

    await BackchatTx.updateProfile({
        metadataURI,
        button: btn,
        onSuccess: () => {
            BC.userProfile.displayName = displayName;
            BC.userProfile.bio = bio;
            BC.profiles.set(State.userAddress.toLowerCase(), { ...BC.profiles.get(State.userAddress.toLowerCase()), displayName, bio });
            closeModal('edit-profile');
            showToast('Profile updated!', 'success');
            renderContent();
        }
    });
}

async function doObtainBadge() {
    await BackchatTx.obtainBadge({
        operator: getOperatorAddress(),
        onSuccess: () => {
            BC.hasBadge = true;
            closeModal('badge');
            showToast('Badge obtained!', 'success');
            renderContent();
        }
    });
}

async function doBoostProfile(amount) {
    const ethAmount = ethers.parseEther(amount || '0.001');
    await BackchatTx.boostProfile({
        ethAmount,
        operator: getOperatorAddress(),
        onSuccess: () => {
            BC.isBoosted = true;
            closeModal('boost');
            showToast('Profile boosted!', 'success');
            renderContent();
        }
    });
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

async function uploadImageToIPFS(file) {
    const formData = new FormData();
    formData.append('image', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
        const resp = await fetch('/api/upload-image', { method: 'POST', body: formData, signal: controller.signal });
        clearTimeout(timeout);
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || `Upload failed (${resp.status})`);
        }
        return await resp.json();
    } catch (e) { clearTimeout(timeout); throw e; }
}

function handleImageSelect(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large. Maximum 5MB.', 'error'); return; }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { showToast('Invalid image type.', 'error'); return; }
    BC.pendingImage = file;
    const reader = new FileReader();
    reader.onload = (ev) => { BC.pendingImagePreview = ev.target.result; renderContent(); };
    reader.readAsDataURL(file);
}

function removeImage() {
    BC.pendingImage = null;
    BC.pendingImagePreview = null;
    const input = document.getElementById('bc-image-input');
    if (input) input.value = '';
    renderContent();
}

// ============================================================================
// USERNAME CHECK
// ============================================================================

let _usernameTimer = null;
function onWizUsernameInput(value) {
    BC.wizUsername = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    BC.wizUsernameOk = null;
    BC.wizFee = null;
    clearTimeout(_usernameTimer);
    const input = document.getElementById('wiz-username-input');
    if (input) input.value = BC.wizUsername;

    if (BC.wizUsername.length >= 1 && BC.wizUsername.length <= 15) {
        BC.wizChecking = true;
        renderWizardStatus();
        _usernameTimer = setTimeout(async () => {
            try {
                const [available, feeData] = await Promise.all([
                    BackchatTx.isUsernameAvailable(BC.wizUsername),
                    BackchatTx.getUsernamePrice(BC.wizUsername.length)
                ]);
                BC.wizUsernameOk = available;
                BC.wizFee = feeData.formatted;
            } catch (e) { console.warn('Username check failed:', e); }
            BC.wizChecking = false;
            renderWizardStatus();
        }, 600);
    } else {
        BC.wizChecking = false;
        renderWizardStatus();
    }
}

function renderWizardStatus() {
    const row = document.getElementById('wiz-username-status');
    if (row) {
        if (BC.wizChecking) {
            row.innerHTML = '<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>';
        } else if (BC.wizUsernameOk === true) {
            row.innerHTML = `<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${BC.wizFee && BC.wizFee !== '0.0' ? `<span class="bc-username-fee">${BC.wizFee} ETH</span>` : '<span class="bc-username-fee">FREE</span>'}`;
        } else if (BC.wizUsernameOk === false) {
            row.innerHTML = '<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>';
        } else {
            row.innerHTML = '';
        }
    }
    const nextBtn = document.querySelector('.bc-wizard-nav .bc-btn-primary');
    if (nextBtn && BC.wizStep === 1) nextBtn.disabled = !BC.wizUsernameOk;
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderHeader() {
    const isDetailView = ['post-detail', 'user-profile', 'profile-setup'].includes(BC.view);
    if (isDetailView) {
        let title = 'Post';
        if (BC.view === 'user-profile') title = getProfileName(BC.selectedProfile);
        if (BC.view === 'profile-setup') title = 'Create Profile';
        return `
            <div class="bc-header">
                <div class="bc-back-header">
                    <button class="bc-back-btn" onclick="BackchatPage.goBack()"><i class="fa-solid fa-arrow-left"></i></button>
                    <span class="bc-back-title">${title}</span>
                </div>
            </div>`;
    }
    return `
        <div class="bc-header">
            <div class="bc-header-bar">
                <div class="bc-brand">
                    <img src="assets/backchat.png" alt="Agora" class="bc-brand-icon" onerror="this.style.display='none'">
                    <span class="bc-brand-name">Agora</span>
                </div>
                <div class="bc-header-right">
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()" title="Refresh"><i class="fa-solid fa-arrows-rotate"></i></button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${BC.activeTab === 'feed' ? 'active' : ''}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'discover' ? 'active' : ''}" onclick="BackchatPage.setTab('discover')">
                    <i class="fa-solid fa-fire"></i> Discover
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'profile' ? 'active' : ''}" onclick="BackchatPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>`;
}

function renderTagBar() {
    const allActive = BC.selectedTag === -1 ? 'active' : '';
    let html = `<div class="bc-tag-bar">
        <button class="bc-tag-pill ${allActive}" onclick="BackchatPage.filterTag(-1)"><i class="fa-solid fa-layer-group"></i> All</button>`;
    for (const tag of TAGS) {
        const active = BC.selectedTag === tag.id ? 'active' : '';
        html += `<button class="bc-tag-pill ${active}" onclick="BackchatPage.filterTag(${tag.id})" style="${active ? '' : `color:${tag.color}`}"><i class="fa-solid ${tag.icon}"></i> ${tag.name}</button>`;
    }
    html += `</div>`;
    return html;
}

function renderComposeTagPicker() {
    let html = '<div class="bc-compose-tags">';
    for (const tag of TAGS) {
        const active = BC.composeTag === tag.id ? 'active' : '';
        html += `<button class="bc-compose-tag ${active}" onclick="BackchatPage.setComposeTag(${tag.id})">${tag.name}</button>`;
    }
    html += '</div>';
    return html;
}

function renderCompose() {
    if (!State.isConnected) return '';
    const fee = formatETH(BC.fees.post);
    const profileBanner = (!BC.hasProfile && State.isConnected) ? `
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and start posting</p>
            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>` : '';

    return `
        ${profileBanner}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea id="bc-compose-input" class="bc-compose-textarea" placeholder="What's happening on-chain?" maxlength="${MAX_CONTENT}" oninput="BackchatPage._updateCharCount(this)"></textarea>
                    ${BC.pendingImagePreview ? `
                        <div class="bc-image-preview">
                            <img src="${BC.pendingImagePreview}" alt="Preview">
                            <button class="bc-image-remove" onclick="BackchatPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>` : ''}
                    ${BC.isUploadingImage ? '<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading image...</div>' : ''}
                    ${renderComposeTagPicker()}
                </div>
            </div>
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add image" onclick="document.getElementById('bc-image-input').click()"><i class="fa-solid fa-image"></i></button>
                    <input type="file" id="bc-image-input" hidden accept="image/jpeg,image/png,image/gif,image/webp" onchange="BackchatPage.handleImageSelect(event)">
                </div>
                <div class="bc-compose-right">
                    <span class="bc-char-count" id="bc-char-counter">0/${MAX_CONTENT}</span>
                    <span class="bc-compose-fee">${fee} ETH</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="BackchatPage.createPost()" ${BC.isPosting ? 'disabled' : ''}>
                        ${BC.isPosting ? '<i class="fa-solid fa-spinner fa-spin"></i> Posting' : 'Post'}
                    </button>
                </div>
            </div>
        </div>`;
}

function renderPostMenu(post) {
    const isOwn = post.author?.toLowerCase() === State.userAddress?.toLowerCase();
    if (!isOwn || !State.isConnected) return '';
    return `
        <div class="bc-post-menu-wrap">
            <button class="bc-post-menu-btn" onclick="event.stopPropagation(); BackchatPage.togglePostMenu('${post.id}')" title="Options">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
            <div class="bc-post-dropdown" id="post-menu-${post.id}" style="display:none;">
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); BackchatPage.pinPost('${post.id}')">
                    <i class="fa-solid fa-thumbtack"></i> Pin to profile
                </button>
                <button class="bc-post-dropdown-item danger" onclick="event.stopPropagation(); BackchatPage.deletePost('${post.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>`;
}

function renderPost(post, index = 0, options = {}) {
    if (post.type === 'repost' && !options.isRepostContent) {
        const originalPost = BC.postsById.get(post.originalPostId);
        return `
            <div class="bc-post" data-post-id="${post.id}" style="animation-delay:${Math.min(index * 0.04, 0.4)}s">
                <div class="bc-repost-banner"><i class="fa-solid fa-retweet"></i> <span>${getProfileName(post.author)} reposted</span></div>
                ${originalPost ? renderPost(originalPost, index, { isRepostContent: true, noAnimation: true }) : '<div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>'}
            </div>`;
    }

    const authorName = getProfileName(post.author);
    const username = getProfileUsername(post.author);
    const boosted = isUserBoosted(post.author);
    const badged = isUserBadged(post.author);
    const superLikesETH = formatETH(post.superLikes);
    const replyCount = post.repliesCount || BC.replyCountMap.get(post.id) || 0;
    const repostCount = post.repostsCount || BC.repostCountMap.get(post.id) || 0;
    const likeCount = post.likesCount || BC.likesMap.get(post.id)?.size || 0;
    const downCount = post.downvotesCount || 0;
    const isLiked = BC.likesMap.get(post.id)?.has(State.userAddress?.toLowerCase()) || false;
    const animStyle = options.noAnimation ? '' : `style="animation-delay:${Math.min(index * 0.04, 0.4)}s"`;
    const tagInfo = getTagInfo(post.tag || 0);

    return `
        <div class="bc-post" data-post-id="${post.id}" ${animStyle} onclick="BackchatPage.viewPost('${post.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${boosted ? 'boosted' : ''}" onclick="event.stopPropagation(); BackchatPage.viewProfile('${post.author}')">
                    ${username ? username.charAt(0).toUpperCase() : getInitials(post.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); BackchatPage.viewProfile('${post.author}')">${authorName}</span>
                        ${badged ? '<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>' : ''}
                        ${username ? `<span class="bc-post-time">@${username}</span>` : ''}
                        <span class="bc-post-time">&middot; ${formatTimeAgo(post.timestamp)}</span>
                        ${post.tag > 0 ? `<span class="bc-tag-badge" style="color:${tagInfo.color};border-color:${tagInfo.color}30"><i class="fa-solid ${tagInfo.icon}"></i> ${tagInfo.name}</span>` : ''}
                        ${post.superLikes > 0n ? `<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${superLikesETH}</span>` : ''}
                    </div>
                    ${post.type === 'reply' ? `<div class="bc-post-context">Replying to ${getProfileName(BC.postsById.get(post.parentId)?.author)}</div>` : ''}
                </div>
                ${renderPostMenu(post)}
            </div>
            ${post.content ? `<div class="bc-post-body">${escapeHtml(post.content)}</div>` : ''}
            ${post.mediaCID ? `<div class="bc-post-media"><img src="${IPFS_GATEWAY}${post.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'"></div>` : ''}
            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${post.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>${replyCount > 0 ? `<span class="count">${replyCount}</span>` : ''}
                </button>
                <button class="bc-action act-repost" onclick="BackchatPage.openRepostConfirm('${post.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>${repostCount > 0 ? `<span class="count">${repostCount}</span>` : ''}
                </button>
                <button class="bc-action act-like ${isLiked ? 'liked' : ''}" onclick="BackchatPage.like('${post.id}')" title="Like">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>${likeCount > 0 ? `<span class="count">${likeCount}</span>` : ''}
                </button>
                <button class="bc-action act-down" onclick="BackchatPage.openDownvote('${post.id}')" title="Downvote">
                    <i class="fa-solid fa-arrow-down"></i>${downCount > 0 ? `<span class="count">${downCount}</span>` : ''}
                </button>
                <button class="bc-action act-super" onclick="BackchatPage.openSuperLike('${post.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>`;
}

function renderFeed() {
    if (!BC.contractAvailable) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph accent"><i class="fa-solid fa-rocket"></i></div>
            <div class="bc-empty-title">Coming Soon!</div>
            <div class="bc-empty-text">${BC.error || 'Agora is being deployed. The unstoppable social network will be live soon!'}</div>
            <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="BackchatPage.refresh()"><i class="fa-solid fa-arrows-rotate"></i> Retry</button>
        </div>`;
    }
    if (BC.isLoading) {
        return `<div class="bc-loading"><div class="bc-spinner"></div><span class="bc-loading-text">Loading feed...</span></div>`;
    }

    let filteredPosts = BC.posts;
    if (BC.selectedTag >= 0) {
        filteredPosts = BC.posts.filter(p => {
            if (p.type === 'repost') {
                const orig = BC.postsById.get(p.originalPostId);
                return orig && orig.tag === BC.selectedTag;
            }
            return p.tag === BC.selectedTag;
        });
    }

    if (filteredPosts.length === 0) {
        const tagName = BC.selectedTag >= 0 ? TAGS[BC.selectedTag]?.name || '' : '';
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-regular fa-comment-dots"></i></div>
            <div class="bc-empty-title">${BC.selectedTag >= 0 ? `No ${tagName} posts` : 'No posts yet'}</div>
            <div class="bc-empty-text">${BC.selectedTag >= 0 ? 'Try a different tag or be the first to post!' : 'Be the first to post on the unstoppable social network!'}</div>
        </div>`;
    }
    return filteredPosts.map((post, i) => renderPost(post, i)).join('');
}

function renderDiscover() {
    const stats = BC.globalStats;
    const statsHtml = stats ? `
        <div class="bc-stats-row">
            <div class="bc-mini-stat"><i class="fa-solid fa-pen-to-square" style="color:var(--bc-accent)"></i> <strong>${stats.totalPosts}</strong> posts</div>
            <div class="bc-mini-stat"><i class="fa-solid fa-users" style="color:var(--bc-blue)"></i> <strong>${stats.totalProfiles}</strong> profiles</div>
        </div>` : '';

    if (BC.trendingPosts.length === 0) {
        return `
            <div class="bc-discover-header">
                <h2><i class="fa-solid fa-fire"></i> Discover</h2>
                <p>Ranked by Super Like value — pure organic discovery</p>
                ${statsHtml}
            </div>
            <div class="bc-empty">
                <div class="bc-empty-glyph accent"><i class="fa-solid fa-fire"></i></div>
                <div class="bc-empty-title">No trending posts</div>
                <div class="bc-empty-text">Super Like posts to make them trend! Ranking is 100% organic, based on ETH spent.</div>
            </div>`;
    }
    return `
        <div class="bc-discover-header">
            <h2><i class="fa-solid fa-fire"></i> Discover</h2>
            <p>Ranked by Super Like value — pure organic discovery</p>
            ${statsHtml}
        </div>
        ${BC.trendingPosts.map((post, i) => renderPost(post, i)).join('')}`;
}

function renderProfile() {
    if (!State.isConnected) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
            <div class="bc-empty-title">Connect Wallet</div>
            <div class="bc-empty-text">Connect your wallet to view your profile.</div>
            <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()"><i class="fa-solid fa-wallet"></i> Connect Wallet</button>
        </div>`;
    }

    const myAddr = State.userAddress?.toLowerCase();
    const userPosts = BC.allItems.filter(p => p.author?.toLowerCase() === myAddr && p.type !== 'repost');
    const followersCount = BC.followers.size;
    const followingCount = BC.following.size;
    const displayName = BC.userProfile?.displayName || BC.userProfile?.username || shortenAddress(State.userAddress);
    const avatarChar = BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress);

    return `
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${BC.isBoosted ? 'boosted' : ''}">${avatarChar}</div>
                    <div class="bc-profile-actions">
                        ${BC.hasProfile ? `<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openEditProfile()"><i class="fa-solid fa-pen"></i> Edit</button>` : `<button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()"><i class="fa-solid fa-user-plus"></i> Create Profile</button>`}
                        ${!BC.hasBadge ? `<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBadge()"><i class="fa-solid fa-circle-check"></i> Badge</button>` : ''}
                        ${!BC.isBoosted ? `<button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBoost()"><i class="fa-solid fa-rocket"></i> Boost</button>` : ''}
                    </div>
                </div>
                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${escapeHtml(displayName)}</span>
                    ${BC.hasBadge ? '<i class="fa-solid fa-circle-check bc-profile-badge"></i>' : ''}
                    ${BC.isBoosted ? '<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>' : ''}
                </div>
                ${BC.userProfile?.username ? `<div class="bc-profile-username">@${BC.userProfile.username}</div>` : ''}
                ${BC.userProfile?.bio ? `<div class="bc-profile-bio">${escapeHtml(BC.userProfile.bio)}</div>` : ''}
                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${State.userAddress}" target="_blank" rel="noopener">View on Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
                <div class="bc-profile-stats">
                    <div class="bc-stat-cell"><div class="bc-stat-value">${userPosts.length}</div><div class="bc-stat-label">Posts</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${followersCount}</div><div class="bc-stat-label">Followers</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${followingCount}</div><div class="bc-stat-label">Following</div></div>
                </div>
            </div>
            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${userPosts.length} total</span>
            </div>
            ${userPosts.length === 0
                ? '<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>'
                : userPosts.sort((a, b) => b.timestamp - a.timestamp).map((p, i) => renderPost(p, i)).join('')}
        </div>`;
}

function renderContent() {
    const container = document.getElementById('backchat-content');
    if (!container) return;
    let content = '';
    switch (BC.view) {
        case 'feed':
            content = renderCompose() + renderTagBar() + renderFeed();
            break;
        case 'discover':
            content = renderDiscover();
            break;
        case 'profile':
            content = (!BC.hasProfile && State.isConnected) ? renderProfileSetup() : renderProfile();
            break;
        case 'post-detail':
            content = renderPostDetail();
            break;
        case 'user-profile':
            content = renderUserProfile();
            break;
        case 'profile-setup':
            content = renderProfileSetup();
            break;
        default:
            content = renderCompose() + renderTagBar() + renderFeed();
    }
    container.innerHTML = content;
}

function renderPostDetail() {
    const post = BC.selectedPost ? BC.postsById.get(BC.selectedPost) : null;
    if (!post) return '<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>';

    const replies = BC.replies.get(post.id) || [];
    replies.sort((a, b) => a.timestamp - b.timestamp);
    const parentAuthor = getProfileName(post.author);

    return `
        <div class="bc-thread-parent">${renderPost(post, 0, { noAnimation: true })}</div>
        <div class="bc-thread-divider">Replies ${replies.length > 0 ? `(${replies.length})` : ''}</div>
        ${replies.length === 0
            ? '<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No replies yet. Be the first!</div></div>'
            : replies.map((r, i) => `<div class="bc-thread-reply">${renderPost(r, i, { noAnimation: true })}</div>`).join('')}
        ${State.isConnected ? `
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${parentAuthor}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${MAX_CONTENT}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${post.id}')">Reply</button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${formatETH(BC.fees.reply)} ETH</div>
            </div>` : ''}`;
}

function renderUserProfile() {
    const addr = BC.selectedProfile;
    if (!addr) return '<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';

    const addrLower = addr.toLowerCase();
    const profile = BC.profiles.get(addrLower);
    const displayName = profile?.displayName || profile?.username || shortenAddress(addr);
    const username = profile?.username;
    const bio = profile?.bio;
    const avatarChar = username ? username.charAt(0).toUpperCase() : getInitials(addr);
    const isMe = addrLower === State.userAddress?.toLowerCase();
    const isFollowing = BC.following.has(addrLower);
    const counts = BC.followCounts.get(addrLower) || { followers: 0, following: 0 };
    const userPosts = BC.allItems.filter(p => p.author?.toLowerCase() === addrLower && p.type !== 'repost');

    return `
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${avatarChar}</div>
                    <div class="bc-profile-actions">
                        ${!isMe && State.isConnected ? `
                            <button class="bc-follow-toggle ${isFollowing ? 'do-unfollow' : 'do-follow'}"
                                onclick="BackchatPage.${isFollowing ? 'unfollow' : 'follow'}('${addr}')">
                                ${isFollowing ? 'Following' : 'Follow'}
                            </button>` : ''}
                    </div>
                </div>
                <div class="bc-profile-name-row"><span class="bc-profile-name">${escapeHtml(displayName)}</span></div>
                ${username ? `<div class="bc-profile-username">@${username}</div>` : ''}
                ${bio ? `<div class="bc-profile-bio">${escapeHtml(bio)}</div>` : ''}
                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${addr}" target="_blank" rel="noopener">${shortenAddress(addr)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
                <div class="bc-profile-stats">
                    <div class="bc-stat-cell"><div class="bc-stat-value">${userPosts.length}</div><div class="bc-stat-label">Posts</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${counts.followers}</div><div class="bc-stat-label">Followers</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${counts.following}</div><div class="bc-stat-label">Following</div></div>
                </div>
            </div>
            <div class="bc-section-head"><span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Posts</span><span class="bc-section-subtitle">${userPosts.length}</span></div>
            ${userPosts.length === 0
                ? '<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>'
                : userPosts.sort((a, b) => b.timestamp - a.timestamp).map((p, i) => renderPost(p, i)).join('')}
        </div>`;
}

function renderProfileSetup() {
    if (!State.isConnected) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
            <div class="bc-empty-title">Connect Wallet</div>
            <div class="bc-empty-text">Connect your wallet to create your profile.</div>
        </div>`;
    }
    const step = BC.wizStep;
    return `
        <div class="bc-wizard">
            <div class="bc-wizard-title">Create Your Profile</div>
            <div class="bc-wizard-desc">Set up your on-chain identity on Agora</div>
            <div class="bc-wizard-dots">
                <div class="bc-wizard-dot ${step === 1 ? 'active' : step > 1 ? 'done' : ''}"></div>
                <div class="bc-wizard-dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}"></div>
                <div class="bc-wizard-dot ${step === 3 ? 'active' : ''}"></div>
            </div>
            <div class="bc-wizard-card">
                ${step === 1 ? `
                    <div class="bc-field">
                        <label class="bc-label">Choose a Username</label>
                        <input type="text" id="wiz-username-input" class="bc-input" placeholder="e.g. satoshi"
                            value="${BC.wizUsername}" maxlength="15" oninput="BackchatPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more ETH.</div>
                    </div>
                ` : step === 2 ? `
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${escapeHtml(BC.wizDisplayName)}" maxlength="30">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3" style="resize:none;">${escapeHtml(BC.wizBio)}</textarea>
                    </div>
                    <div style="font-size:12px;color:var(--bc-text-3);">Display name and bio are stored as metadata and can be updated anytime for free.</div>
                ` : `
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${BC.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${BC.wizUsername}</div>
                        ${BC.wizDisplayName ? `<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${escapeHtml(BC.wizDisplayName)}</div>` : ''}
                        ${BC.wizBio ? `<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${escapeHtml(BC.wizBio)}</div>` : ''}
                        <div class="bc-fee-row" style="margin-top:20px;">
                            <span class="bc-fee-label">Username Fee</span>
                            <span class="bc-fee-val">${BC.wizFee || '0'} ETH</span>
                        </div>
                    </div>
                `}
            </div>
            <div class="bc-wizard-nav">
                ${step > 1 ? '<button class="bc-btn bc-btn-outline" onclick="BackchatPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>' : ''}
                ${step < 3 ? `
                    <button class="bc-btn bc-btn-primary" onclick="BackchatPage.wizNext()" ${step === 1 && !BC.wizUsernameOk ? 'disabled' : ''}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                ` : `
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="BackchatPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>`;
}

// ============================================================================
// MODALS
// ============================================================================

function renderModals() {
    return `
        <!-- Super Like Modal -->
        <div class="bc-modal-overlay" id="modal-superlike">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-star" style="color:var(--bc-accent)"></i> Super Like</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('superlike')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Super Likes boost posts to trending. The more ETH you contribute, the higher it ranks.</p>
                    <div class="bc-field"><label class="bc-label">Amount (ETH)</label><input type="number" id="superlike-amount" class="bc-input" value="0.001" min="0.0001" step="0.0001"></div>
                    <div class="bc-fee-row"><span class="bc-fee-label">Minimum</span><span class="bc-fee-val">0.0001 ETH</span></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmSuperLike()"><i class="fa-solid fa-star"></i> Super Like</button>
                </div>
            </div>
        </div>

        <!-- Downvote Modal -->
        <div class="bc-modal-overlay" id="modal-downvote">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-arrow-down" style="color:var(--bc-purple)"></i> Downvote</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('downvote')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Downvote posts you disagree with. Each 100 gwei = 1 downvote. Unlimited.</p>
                    <div class="bc-field"><label class="bc-label">Amount (ETH)</label><input type="number" id="downvote-amount" class="bc-input" value="0.001" min="0.0001" step="0.0001"></div>
                    <div class="bc-fee-row"><span class="bc-fee-label">Minimum</span><span class="bc-fee-val">0.0001 ETH (100 gwei)</span></div>
                    <button class="bc-btn bc-btn-outline" style="width:100%;margin-top:20px;justify-content:center;border-color:var(--bc-purple);color:var(--bc-purple);" onclick="BackchatPage.confirmDownvote()"><i class="fa-solid fa-arrow-down"></i> Downvote</button>
                </div>
            </div>
        </div>

        <!-- Badge Modal -->
        <div class="bc-modal-overlay" id="modal-badge">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-circle-check" style="color:var(--bc-accent)"></i> Trust Badge</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('badge')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Get a verified trust badge for 1 year. Show the community you're committed.</p>
                    <div class="bc-fee-row"><span class="bc-fee-label">Badge Fee</span><span class="bc-fee-val">${formatETH(BC.fees.badge)} ETH</span></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBadge()"><i class="fa-solid fa-circle-check"></i> Get Badge (1 Year)</button>
                </div>
            </div>
        </div>

        <!-- Boost Modal -->
        <div class="bc-modal-overlay" id="modal-boost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:var(--bc-accent)"></i> Profile Boost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('boost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Boost your profile visibility. Each 0.0005 ETH gives 1 day of boost.</p>
                    <div class="bc-field"><label class="bc-label">Amount (ETH)</label><input type="number" id="boost-amount" class="bc-input" value="0.001" min="0.0005" step="0.0005"></div>
                    <div class="bc-fee-row"><span class="bc-fee-label">Minimum</span><span class="bc-fee-val">0.0005 ETH (1 day)</span></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBoost()"><i class="fa-solid fa-rocket"></i> Boost Profile</button>
                </div>
            </div>
        </div>

        <!-- Repost Modal -->
        <div class="bc-modal-overlay" id="modal-repost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-retweet" style="color:var(--bc-green)"></i> Repost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('repost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${formatETH(BC.fees.repost)} ETH</p>
                    <button id="bc-repost-confirm-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmRepost()"><i class="fa-solid fa-retweet"></i> Repost</button>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div class="bc-modal-overlay" id="modal-edit-profile">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-pen" style="color:var(--bc-accent)"></i> Edit Profile</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('edit-profile')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <div class="bc-field"><label class="bc-label">Display Name</label><input type="text" id="edit-displayname" class="bc-input" value="${escapeHtml(BC.userProfile?.displayName || '')}" maxlength="30" placeholder="Your display name"></div>
                    <div class="bc-field"><label class="bc-label">Bio</label><textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${escapeHtml(BC.userProfile?.bio || '')}</textarea></div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()"><i class="fa-solid fa-check"></i> Save Changes</button>
                </div>
            </div>
        </div>`;
}

// ============================================================================
// MAIN RENDER
// ============================================================================

function render() {
    injectStyles();
    const section = document.getElementById('backchat');
    if (!section) return;
    section.innerHTML = `
        <div class="bc-shell">
            ${renderHeader()}
            <div id="backchat-content"></div>
        </div>
        ${renderModals()}`;
    renderContent();
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

let selectedPostForAction = null;

function openSuperLike(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-superlike')?.classList.add('active');
}

async function confirmSuperLike() {
    const amount = document.getElementById('superlike-amount')?.value || '0.001';
    closeModal('superlike');
    await doSuperLike(selectedPostForAction, amount);
}

function openDownvote(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-downvote')?.classList.add('active');
}

async function confirmDownvote() {
    const amount = document.getElementById('downvote-amount')?.value || '0.001';
    closeModal('downvote');
    await doDownvote(selectedPostForAction, amount);
}

function openBadge() { document.getElementById('modal-badge')?.classList.add('active'); }
async function confirmBadge() { closeModal('badge'); await doObtainBadge(); }
function openBoost() { document.getElementById('modal-boost')?.classList.add('active'); }
async function confirmBoost() {
    const amount = document.getElementById('boost-amount')?.value || '0.001';
    closeModal('boost');
    await doBoostProfile(amount);
}

function openRepostConfirm(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-repost')?.classList.add('active');
}
async function confirmRepost() { await doRepost(selectedPostForAction); }

function openEditProfile() {
    render();
    document.getElementById('modal-edit-profile')?.classList.add('active');
}
async function confirmEditProfile() { await doUpdateProfile(); }

function closeModal(name) { document.getElementById(`modal-${name}`)?.classList.remove('active'); }

function togglePostMenu(postId) {
    const menu = document.getElementById(`post-menu-${postId}`);
    if (!menu) return;
    const isVisible = menu.style.display !== 'none';
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
    menu.style.display = isVisible ? 'none' : 'block';
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _updateCharCount(textarea) {
    const counter = document.getElementById('bc-char-counter');
    if (!counter) return;
    const len = textarea.value.length;
    counter.textContent = `${len}/${MAX_CONTENT}`;
    counter.className = 'bc-char-count';
    if (len > MAX_CONTENT - 50) counter.classList.add('danger');
    else if (len > MAX_CONTENT - 150) counter.classList.add('warn');
}

// Close post menus on click outside
document.addEventListener('click', () => {
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
});

// ============================================================================
// EXPORT
// ============================================================================

export const BackchatPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadGlobalStats(),
            loadProfiles(),
            loadPosts(),
            loadSocialGraph()
        ]);
    },

    async refresh() {
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadGlobalStats(),
            loadProfiles(),
            loadPosts(),
            loadSocialGraph()
        ]);
    },

    setTab(tab) {
        BC.activeTab = tab;
        BC.view = tab;
        BC.selectedTag = -1;
        render();
    },

    filterTag(tagId) {
        BC.selectedTag = tagId;
        renderContent();
    },

    setComposeTag(tagId) {
        BC.composeTag = tagId;
        renderContent();
    },

    goBack,
    viewPost(postId) { navigateView('post-detail', { post: postId }); },
    viewProfile(address) {
        if (address?.toLowerCase() === State.userAddress?.toLowerCase()) {
            BC.activeTab = 'profile';
            BC.view = 'profile';
            render();
        } else {
            navigateView('user-profile', { profile: address });
        }
    },
    openReply(postId) { navigateView('post-detail', { post: postId }); },
    openProfileSetup() {
        BC.wizStep = 1;
        BC.wizUsername = '';
        BC.wizDisplayName = '';
        BC.wizBio = '';
        BC.wizUsernameOk = null;
        BC.wizFee = null;
        navigateView('profile-setup');
    },

    createPost: doCreatePost,
    submitReply: doCreateReply,
    like: doLike,
    follow: doFollow,
    unfollow: doUnfollow,
    deletePost: doDeletePost,
    pinPost: doPinPost,
    openSuperLike,
    confirmSuperLike,
    openDownvote,
    confirmDownvote,
    openRepostConfirm,
    confirmRepost,

    openBadge,
    confirmBadge,
    openBoost,
    confirmBoost,
    openEditProfile,
    confirmEditProfile,
    closeModal,
    togglePostMenu,

    handleImageSelect,
    removeImage,

    onWizUsernameInput,
    wizNext() {
        if (BC.wizStep === 1 && !BC.wizUsernameOk) return;
        if (BC.wizStep === 1) {
            BC.wizStep = 2;
        } else if (BC.wizStep === 2) {
            BC.wizDisplayName = document.getElementById('wiz-displayname-input')?.value?.trim() || '';
            BC.wizBio = document.getElementById('wiz-bio-input')?.value?.trim() || '';
            BC.wizStep = 3;
        }
        renderContent();
    },
    wizBack() {
        if (BC.wizStep > 1) {
            if (BC.wizStep === 2) {
                BC.wizDisplayName = document.getElementById('wiz-displayname-input')?.value?.trim() || '';
                BC.wizBio = document.getElementById('wiz-bio-input')?.value?.trim() || '';
            }
            BC.wizStep--;
            renderContent();
        }
    },
    wizConfirm: doCreateProfile,

    _updateCharCount
};

// Expose globally for inline onclick handlers
window.BackchatPage = BackchatPage;
