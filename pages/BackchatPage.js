// js/pages/BackchatPage.js
// ✅ PRODUCTION V10.0 — V9 Agora Contract Alignment (fees, profile, no referrals)
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    BACKCHAT - Unstoppable Social Network
// ═══════════════════════════════════════════════════════════════════════════════
//
// V7.0 Changes:
// - COMPLETE UI REDESIGN — Professional layout aligned with system design
// - CSS Variables for theming consistency with other pages
// - Glassmorphism cards with depth and layered backgrounds
// - Improved visual hierarchy: better spacing, typography, contrast
// - Refined compose box with character counter
// - Polished post cards with hover depth
// - Better profile section with stats grid
// - Upgraded modals with better form design
// - Micro-interactions and smooth transitions
// - Responsive 3-column concept (sidebar-friendly)
// - All V6.9 functionality preserved
//
// Features:
// - 📝 Posts (max 500 chars + IPFS media)
// - 💬 Replies with tips
// - 🔁 Reposts
// - ❤️ Likes (1 per user per post)
// - ⭐ Super Likes (unlimited, ETH-based trending)
// - 👥 Follow/Unfollow
// - 💰 BKC Tips (90% to creator)
// - 👤 Profiles with vanity usernames
// - ✅ Trust Badges (1 year)
// - 🚀 Profile Boost (visibility)
// - 💸 ETH Earnings withdrawal
//
// Resilience: Works even if ecosystem contracts fail
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

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

// Get addresses from config (loaded from deployment-addresses.json)
function getBackchatAddress() {
    // V9: agora replaces backchat
    return addresses.agora || addresses.backchat || addresses.Backchat || null;
}

// Operator address for fee distribution (your frontend earns 30-60% of fees!)
function getOperatorAddress() {
    return addresses.operator || addresses.treasury || null;
}

// ============================================================================
// ABI - Backchat V8.0.0 (imported from config.js — single source of truth)
// ============================================================================

const bkcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// ============================================================================
// STATE
// ============================================================================

const BC = {
    // View routing
    view: 'feed',            // feed | trending | profile | post-detail | user-profile | profile-setup
    activeTab: 'feed',       // feed | trending | profile (for tab highlight)
    viewHistory: [],         // Stack for back navigation

    // Data
    posts: [],               // Top-level posts (no replies) for feed
    trendingPosts: [],       // Posts sorted by super likes
    allItems: [],            // All items (posts + replies + reposts) raw
    replies: new Map(),      // postId → [reply1, reply2, ...]
    likesMap: new Map(),     // postId → Set<address>
    replyCountMap: new Map(),// postId → count
    repostCountMap: new Map(),// postId → count
    postsById: new Map(),    // postId → post object (for repost lookup)

    // Profiles
    userProfile: null,       // { username, displayName, bio, address }
    profiles: new Map(),     // address → { username, displayName, bio }
    hasProfile: null,        // null=not checked, true/false

    // Social graph
    following: new Set(),    // Set of addresses (lowercase) user follows
    followers: new Set(),    // Set of addresses (lowercase) following user
    followCounts: new Map(), // address → { followers, following }

    // Image upload
    pendingImage: null,      // File object
    pendingImagePreview: null, // data URL for preview
    isUploadingImage: false,

    // Selected
    selectedPost: null,      // For viewing single post with replies
    selectedProfile: null,   // For viewing other user's profile (address)

    // Profile wizard
    wizStep: 1,
    wizUsername: '',
    wizDisplayName: '',
    wizBio: '',
    wizUsernameOk: null,     // null=unchecked, true/false
    wizFee: null,            // formatted string like "0.01"
    wizChecking: false,      // debounce check in progress

    // Fees
    fees: { post: 0n, reply: 0n, like: 0n, follow: 0n, repost: 0n, superLikeMin: 0n, boostMin: 0n, badge: 0n },

    // User stats
    pendingEth: 0n,
    hasBadge: false,
    isBoosted: false,
    boostExpiry: 0,
    badgeExpiry: 0,

    // Referral (V8)
    referralStats: null,
    referredBy: null,

    // Loading
    isLoading: false,
    isPosting: false,
    contractAvailable: true,
    error: null
};

// ============================================================================
// STYLES — V7.0 Professional Redesign
// ============================================================================

function injectStyles() {
    if (document.getElementById('backchat-styles-v70')) return;
    
    // Remove old styles
    const old = document.getElementById('backchat-styles-v69');
    if (old) old.remove();
    
    const style = document.createElement('style');
    style.id = 'backchat-styles-v70';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V7.0 Backchat — Decentralized Social Network
           Professional UI aligned with Backchain system design
           ═══════════════════════════════════════════════════════════════════ */
        
        :root {
            --bc-bg:        #0c0c0e;
            --bc-bg2:       #141417;
            --bc-bg3:       #1c1c21;
            --bc-surface:   #222228;
            --bc-border:    rgba(255,255,255,0.06);
            --bc-border-h:  rgba(255,255,255,0.1);
            --bc-text:      #f0f0f2;
            --bc-text-2:    #a0a0ab;
            --bc-text-3:    #5c5c68;
            --bc-accent:    #f59e0b;
            --bc-accent-2:  #d97706;
            --bc-accent-glow: rgba(245,158,11,0.15);
            --bc-red:       #ef4444;
            --bc-green:     #22c55e;
            --bc-blue:      #3b82f6;
            --bc-purple:    #8b5cf6;
            --bc-radius:    14px;
            --bc-radius-sm: 10px;
            --bc-radius-lg: 20px;
            --bc-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Animations */
        @keyframes bc-fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bc-scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bc-spin {
            to { transform: rotate(360deg); }
        }
        @keyframes bc-shimmer {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes bc-like-pop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.35); }
            100% { transform: scale(1); }
        }
        @keyframes bc-pulse-ring {
            0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
            70%  { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
            100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        
        /* ─── Layout ─── */
        .bc-shell {
            max-width: 640px;
            margin: 0 auto;
            min-height: 100vh;
            background: var(--bc-bg);
            position: relative;
        }
        
        /* ─── Header ─── */
        .bc-header {
            position: sticky;
            top: 0;
            z-index: 200;
            background: rgba(12,12,14,0.82);
            backdrop-filter: blur(20px) saturate(1.4);
            -webkit-backdrop-filter: blur(20px) saturate(1.4);
            border-bottom: 1px solid var(--bc-border);
        }
        
        .bc-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
        }
        
        .bc-brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bc-brand-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            object-fit: contain;
        }
        
        .bc-brand-name {
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.3px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .bc-header-right {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .bc-icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: transparent;
            border: 1px solid var(--bc-border);
            color: var(--bc-text-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all var(--bc-transition);
            position: relative;
        }
        .bc-icon-btn:hover {
            background: var(--bc-bg3);
            border-color: var(--bc-border-h);
            color: var(--bc-text);
        }
        .bc-icon-btn.earnings-btn {
            border-color: rgba(34,197,94,0.3);
            color: var(--bc-green);
        }
        .bc-icon-btn.earnings-btn:hover {
            background: rgba(34,197,94,0.1);
        }
        
        /* ─── Tabs ─── */
        .bc-nav {
            display: flex;
            padding: 0 20px;
        }
        
        .bc-nav-item {
            flex: 1;
            padding: 12px 0;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--bc-text-3);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
            cursor: pointer;
            transition: all var(--bc-transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
        }
        .bc-nav-item:hover {
            color: var(--bc-text-2);
        }
        .bc-nav-item.active {
            color: var(--bc-accent);
            border-bottom-color: var(--bc-accent);
        }
        .bc-nav-item i {
            font-size: 14px;
        }
        
        /* ─── Compose ─── */
        .bc-compose {
            padding: 20px;
            border-bottom: 1px solid var(--bc-border);
            background: var(--bc-bg2);
        }
        
        .bc-compose-row {
            display: flex;
            gap: 14px;
        }
        
        .bc-compose-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent), #fbbf24);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
            font-size: 15px;
            flex-shrink: 0;
        }
        
        .bc-compose-body {
            flex: 1;
            min-width: 0;
        }
        
        .bc-compose-textarea {
            width: 100%;
            min-height: 72px;
            max-height: 240px;
            background: transparent;
            border: none;
            color: var(--bc-text);
            font-size: 16px;
            line-height: 1.5;
            resize: none;
            outline: none;
            font-family: inherit;
        }
        .bc-compose-textarea::placeholder {
            color: var(--bc-text-3);
        }
        
        .bc-compose-divider {
            height: 1px;
            background: var(--bc-border);
            margin: 12px 0;
        }
        
        .bc-compose-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .bc-compose-tools {
            display: flex;
            gap: 4px;
        }
        
        .bc-compose-tool {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: none;
            border: none;
            color: var(--bc-accent);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transition: background var(--bc-transition);
        }
        .bc-compose-tool:hover:not(:disabled) {
            background: var(--bc-accent-glow);
        }
        .bc-compose-tool:disabled {
            color: var(--bc-text-3);
            cursor: not-allowed;
        }
        
        .bc-compose-right {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        
        .bc-char-count {
            font-size: 12px;
            color: var(--bc-text-3);
            font-variant-numeric: tabular-nums;
        }
        .bc-char-count.warn { color: var(--bc-accent); }
        .bc-char-count.danger { color: var(--bc-red); }
        
        .bc-compose-fee {
            font-size: 11px;
            color: var(--bc-text-3);
            background: var(--bc-bg3);
            padding: 4px 10px;
            border-radius: 20px;
        }
        
        .bc-post-btn {
            padding: 9px 22px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            border-radius: 24px;
            color: #000;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all var(--bc-transition);
            letter-spacing: 0.01em;
        }
        .bc-post-btn:hover:not(:disabled) {
            box-shadow: 0 4px 20px rgba(245,158,11,0.35);
            transform: translateY(-1px);
        }
        .bc-post-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        /* ─── Post Card ─── */
        .bc-post {
            padding: 18px 20px;
            border-bottom: 1px solid var(--bc-border);
            transition: background var(--bc-transition);
            animation: bc-fadeIn 0.35s ease-out both;
        }
        .bc-post:hover {
            background: rgba(255,255,255,0.015);
        }
        
        .bc-post-top {
            display: flex;
            gap: 12px;
        }
        
        .bc-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent) 0%, #fbbf24 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
            font-size: 15px;
            flex-shrink: 0;
            cursor: pointer;
            transition: transform var(--bc-transition);
        }
        .bc-avatar:hover {
            transform: scale(1.06);
        }
        .bc-avatar.boosted {
            box-shadow: 0 0 0 2.5px var(--bc-bg), 0 0 0 4.5px var(--bc-accent);
            animation: bc-pulse-ring 2s infinite;
        }
        
        .bc-post-head {
            flex: 1;
            min-width: 0;
        }
        
        .bc-post-author-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        .bc-author-name {
            font-weight: 700;
            color: var(--bc-text);
            font-size: 15px;
            cursor: pointer;
            transition: color var(--bc-transition);
        }
        .bc-author-name:hover {
            color: var(--bc-accent);
        }
        
        .bc-verified-icon {
            color: var(--bc-accent);
            font-size: 13px;
        }
        
        .bc-post-time {
            color: var(--bc-text-3);
            font-size: 13px;
        }
        
        .bc-post-context {
            color: var(--bc-text-3);
            font-size: 13px;
            margin-top: 1px;
        }
        
        .bc-trending-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 9px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 20px;
            color: var(--bc-accent);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .bc-trending-tag i { font-size: 9px; }
        
        .bc-post-body {
            margin-top: 10px;
            margin-left: 56px;
            color: var(--bc-text);
            font-size: 15px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .bc-post-media {
            margin-top: 14px;
            margin-left: 56px;
            border-radius: var(--bc-radius);
            overflow: hidden;
            border: 1px solid var(--bc-border);
        }
        .bc-post-media img {
            width: 100%;
            max-height: 420px;
            object-fit: cover;
            display: block;
        }
        
        /* ─── Engagement Bar ─── */
        .bc-actions {
            display: flex;
            gap: 2px;
            margin-top: 12px;
            margin-left: 56px;
            max-width: 420px;
            justify-content: space-between;
        }
        
        .bc-action {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            background: none;
            border: none;
            border-radius: 24px;
            color: var(--bc-text-3);
            font-size: 13px;
            cursor: pointer;
            transition: all var(--bc-transition);
        }
        .bc-action i { font-size: 15px; transition: transform 0.2s; }
        
        .bc-action.act-reply:hover    { color: var(--bc-blue);   background: rgba(59,130,246,0.08); }
        .bc-action.act-repost:hover   { color: var(--bc-green);  background: rgba(34,197,94,0.08); }
        .bc-action.act-like:hover     { color: var(--bc-red);    background: rgba(239,68,68,0.08); }
        .bc-action.act-like:hover i   { transform: scale(1.2); }
        .bc-action.act-like.liked     { color: var(--bc-red); }
        .bc-action.act-like.liked i   { animation: bc-like-pop 0.3s ease-out; }
        .bc-action.act-super:hover    { color: var(--bc-accent); background: var(--bc-accent-glow); }
        .bc-action.act-super:hover i  { transform: scale(1.2) rotate(15deg); }
        .bc-action.act-tip:hover      { color: var(--bc-purple); background: rgba(139,92,246,0.08); }
        
        /* ─── Profile ─── */
        .bc-profile-section {
            animation: bc-fadeIn 0.4s ease-out;
        }
        
        .bc-profile-banner {
            height: 120px;
            background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.08), rgba(12,12,14,0));
            position: relative;
        }
        
        .bc-profile-main {
            padding: 0 20px 20px;
            margin-top: -40px;
            position: relative;
        }
        
        .bc-profile-top-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .bc-profile-pic {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--bc-accent), #fbbf24);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #000;
            border: 4px solid var(--bc-bg);
        }
        .bc-profile-pic.boosted {
            box-shadow: 0 0 0 3px var(--bc-bg), 0 0 0 5px var(--bc-accent);
        }
        
        .bc-profile-actions {
            display: flex;
            gap: 8px;
            padding-bottom: 6px;
        }
        
        .bc-profile-name-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .bc-profile-name {
            font-size: 22px;
            font-weight: 800;
            color: var(--bc-text);
            letter-spacing: -0.3px;
        }
        
        .bc-profile-badge {
            color: var(--bc-accent);
            font-size: 16px;
        }
        
        .bc-boosted-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 20px;
            color: var(--bc-accent);
            font-size: 11px;
            font-weight: 700;
        }
        
        .bc-profile-handle {
            margin-top: 4px;
        }
        .bc-profile-handle a {
            color: var(--bc-text-3);
            text-decoration: none;
            font-size: 13px;
            transition: color var(--bc-transition);
        }
        .bc-profile-handle a:hover { color: var(--bc-accent); }
        .bc-profile-handle a i { font-size: 10px; margin-left: 4px; }
        
        .bc-profile-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
            gap: 1px;
            margin-top: 20px;
            background: var(--bc-border);
            border-radius: var(--bc-radius);
            overflow: hidden;
        }
        
        .bc-stat-cell {
            background: var(--bc-bg2);
            padding: 16px 12px;
            text-align: center;
        }
        .bc-stat-cell:first-child { border-radius: var(--bc-radius) 0 0 var(--bc-radius); }
        .bc-stat-cell:last-child  { border-radius: 0 var(--bc-radius) var(--bc-radius) 0; }
        
        .bc-stat-value {
            font-size: 20px;
            font-weight: 800;
            color: var(--bc-text);
        }
        .bc-stat-label {
            font-size: 12px;
            color: var(--bc-text-3);
            margin-top: 2px;
            font-weight: 500;
        }
        
        /* ─── Earnings ─── */
        .bc-earnings-card {
            margin: 20px;
            padding: 20px;
            background: linear-gradient(145deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05));
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: var(--bc-radius-lg);
            animation: bc-fadeIn 0.4s ease-out 0.1s both;
        }
        
        .bc-earnings-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--bc-green);
            margin-bottom: 12px;
        }
        
        .bc-earnings-value {
            font-size: 32px;
            font-weight: 800;
            color: var(--bc-text);
            letter-spacing: -0.5px;
        }
        .bc-earnings-value small {
            font-size: 16px;
            color: var(--bc-text-3);
            font-weight: 600;
        }
        
        /* ─── Referral Card (V8) ─── */
        .bc-referral-card {
            margin: 20px;
            padding: 20px;
            background: linear-gradient(145deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05));
            border: 1px solid rgba(139,92,246,0.2);
            border-radius: var(--bc-radius-lg);
            animation: bc-fadeIn 0.4s ease-out 0.15s both;
        }
        .bc-referral-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--bc-purple);
            margin-bottom: 16px;
        }
        .bc-referral-link-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bc-bg);
            border: 1px solid var(--bc-border);
            border-radius: var(--bc-radius-sm);
            padding: 10px 12px;
            margin-bottom: 16px;
        }
        .bc-referral-link-text {
            flex: 1;
            font-size: 12px;
            color: var(--bc-text-2);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: monospace;
        }
        .bc-referral-link-box button {
            flex-shrink: 0;
            background: var(--bc-surface);
            border: 1px solid var(--bc-border);
            color: var(--bc-text);
            padding: 6px 12px;
            border-radius: var(--bc-radius-sm);
            font-size: 12px;
            cursor: pointer;
            transition: all var(--bc-transition);
        }
        .bc-referral-link-box button:hover {
            background: var(--bc-accent);
            color: #000;
            border-color: var(--bc-accent);
        }
        .bc-referral-stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .bc-referral-stat {
            background: var(--bc-bg2);
            border-radius: var(--bc-radius-sm);
            padding: 12px;
            text-align: center;
        }
        .bc-referral-stat-value {
            font-size: 22px;
            font-weight: 800;
            color: var(--bc-text);
        }
        .bc-referral-stat-label {
            font-size: 11px;
            color: var(--bc-text-3);
            margin-top: 2px;
        }
        .bc-referral-info {
            font-size: 12px;
            color: var(--bc-text-3);
            line-height: 1.5;
            text-align: center;
        }

        /* ─── Section Header ─── */
        .bc-section-head {
            padding: 16px 20px;
            border-bottom: 1px solid var(--bc-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .bc-section-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bc-section-title i {
            color: var(--bc-accent);
            font-size: 14px;
        }
        
        .bc-section-subtitle {
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Trending Header ─── */
        .bc-trending-header {
            padding: 24px 20px;
            border-bottom: 1px solid var(--bc-border);
            background: linear-gradient(180deg, rgba(245,158,11,0.06), transparent);
        }
        .bc-trending-header h2 {
            font-size: 18px;
            font-weight: 800;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
        }
        .bc-trending-header h2 i { color: var(--bc-accent); }
        .bc-trending-header p {
            margin: 4px 0 0;
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Buttons ─── */
        .bc-btn {
            padding: 9px 18px;
            border-radius: 24px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all var(--bc-transition);
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            letter-spacing: 0.01em;
        }
        
        .bc-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
        }
        .bc-btn-primary:hover {
            box-shadow: 0 4px 16px rgba(245,158,11,0.3);
            transform: translateY(-1px);
        }
        
        .bc-btn-outline {
            background: transparent;
            border: 1px solid var(--bc-border-h);
            color: var(--bc-text);
        }
        .bc-btn-outline:hover {
            background: var(--bc-bg3);
            border-color: rgba(255,255,255,0.15);
        }
        
        .bc-btn-follow {
            background: var(--bc-text);
            color: var(--bc-bg);
        }
        .bc-btn-follow:hover { opacity: 0.9; }
        
        /* ─── Empty State ─── */
        .bc-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 72px 24px;
            text-align: center;
            animation: bc-fadeIn 0.5s ease-out;
        }
        
        .bc-empty-glyph {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: var(--bc-bg3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .bc-empty-glyph i {
            font-size: 28px;
            color: var(--bc-text-3);
        }
        .bc-empty-glyph.accent {
            background: var(--bc-accent-glow);
        }
        .bc-empty-glyph.accent i {
            color: var(--bc-accent);
        }
        
        .bc-empty-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--bc-text);
            margin-bottom: 8px;
        }
        
        .bc-empty-text {
            color: var(--bc-text-3);
            font-size: 14px;
            max-width: 280px;
            line-height: 1.5;
        }
        
        /* ─── Loading ─── */
        .bc-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 56px;
            gap: 16px;
        }
        
        .bc-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid var(--bc-bg3);
            border-top-color: var(--bc-accent);
            border-radius: 50%;
            animation: bc-spin 0.8s linear infinite;
        }
        
        .bc-loading-text {
            font-size: 13px;
            color: var(--bc-text-3);
        }
        
        /* ─── Modal ─── */
        .bc-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .bc-modal-overlay.active {
            display: flex;
        }
        
        .bc-modal-box {
            background: var(--bc-bg2);
            border: 1px solid var(--bc-border-h);
            border-radius: var(--bc-radius-lg);
            width: 100%;
            max-width: 440px;
            max-height: 90vh;
            overflow-y: auto;
            animation: bc-scaleIn 0.25s ease-out;
        }
        
        .bc-modal-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 20px;
            border-bottom: 1px solid var(--bc-border);
        }
        
        .bc-modal-title {
            font-size: 17px;
            font-weight: 700;
            color: var(--bc-text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .bc-modal-x {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--bc-bg3);
            border: none;
            color: var(--bc-text-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all var(--bc-transition);
        }
        .bc-modal-x:hover {
            background: var(--bc-surface);
            color: var(--bc-text);
        }
        
        .bc-modal-inner {
            padding: 20px;
        }
        
        .bc-modal-desc {
            color: var(--bc-text-2);
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        /* ─── Form Fields ─── */
        .bc-field {
            margin-bottom: 18px;
        }
        
        .bc-label {
            display: block;
            margin-bottom: 8px;
            color: var(--bc-text-2);
            font-size: 13px;
            font-weight: 600;
        }
        
        .bc-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--bc-bg3);
            border: 1px solid var(--bc-border-h);
            border-radius: var(--bc-radius-sm);
            color: var(--bc-text);
            font-size: 15px;
            outline: none;
            transition: border-color var(--bc-transition);
            font-family: inherit;
        }
        .bc-input:focus {
            border-color: rgba(245,158,11,0.5);
        }
        
        .bc-fee-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: var(--bc-accent-glow);
            border: 1px solid rgba(245,158,11,0.15);
            border-radius: var(--bc-radius-sm);
        }
        
        .bc-fee-label {
            font-size: 13px;
            color: var(--bc-accent);
            font-weight: 500;
        }
        
        .bc-fee-val {
            font-size: 14px;
            font-weight: 700;
            color: var(--bc-text);
        }
        
        /* ─── Back Header ─── */
        .bc-back-header { display:flex; align-items:center; gap:12px; padding:14px 20px; }
        .bc-back-btn { width:34px; height:34px; border-radius:50%; background:transparent; border:1px solid var(--bc-border); color:var(--bc-text); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all var(--bc-transition); }
        .bc-back-btn:hover { background:var(--bc-bg3); border-color:var(--bc-border-h); }
        .bc-back-title { font-size:17px; font-weight:700; color:var(--bc-text); }

        /* ─── Profile Wizard ─── */
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

        /* ─── Thread View ─── */
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

        /* ─── Repost Banner ─── */
        .bc-repost-banner { display:flex; align-items:center; gap:6px; padding:8px 20px 0 68px; font-size:13px; color:var(--bc-green); font-weight:600; }
        .bc-repost-banner i { font-size:12px; }

        /* ─── Image Upload ─── */
        .bc-image-preview { position:relative; margin-top:12px; border-radius:var(--bc-radius); overflow:hidden; border:1px solid var(--bc-border); max-height:200px; }
        .bc-image-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
        .bc-image-remove { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.7); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; }
        .bc-image-remove:hover { background:var(--bc-red); }
        .bc-uploading-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:20px; color:var(--bc-accent); font-size:12px; margin-top:8px; }

        /* ─── User Profile Page ─── */
        .bc-profile-bio { margin-top:8px; font-size:14px; color:var(--bc-text-2); line-height:1.5; }
        .bc-profile-username { color:var(--bc-text-3); font-size:14px; margin-top:2px; }
        .bc-follow-toggle { padding:8px 20px; border-radius:24px; font-weight:700; font-size:13px; cursor:pointer; transition:all var(--bc-transition); border:none; }
        .bc-follow-toggle.do-follow { background:var(--bc-text); color:var(--bc-bg); }
        .bc-follow-toggle.do-follow:hover { opacity:0.9; }
        .bc-follow-toggle.do-unfollow { background:transparent; border:1px solid var(--bc-border-h); color:var(--bc-text); }
        .bc-follow-toggle.do-unfollow:hover { border-color:var(--bc-red); color:var(--bc-red); background:rgba(239,68,68,0.08); }
        .bc-profile-create-banner { margin:16px 20px; padding:16px; background:var(--bc-accent-glow); border:1px solid rgba(245,158,11,0.2); border-radius:var(--bc-radius); text-align:center; animation:bc-fadeIn 0.4s ease-out; }
        .bc-profile-create-banner p { font-size:13px; color:var(--bc-text-2); margin-bottom:12px; }

        /* ─── Engagement Count ─── */
        .bc-action .count { font-variant-numeric:tabular-nums; }

        /* ─── Responsive ─── */
        @media (max-width: 640px) {
            .bc-shell {
                max-width: 100%;
            }
            .bc-actions {
                margin-left: 0;
                margin-top: 14px;
            }
            .bc-post-body {
                margin-left: 0;
                margin-top: 12px;
            }
            .bc-post-media {
                margin-left: 0;
            }
            .bc-compose-avatar {
                display: none;
            }
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

function getProfileName(address) {
    if (!address) return '?';
    const profile = BC.profiles.get(address.toLowerCase());
    if (profile?.displayName) return profile.displayName;
    if (profile?.username) return `@${profile.username}`;
    return shortenAddress(address);
}

function getProfileUsername(address) {
    if (!address) return null;
    const profile = BC.profiles.get(address.toLowerCase());
    return profile?.username || null;
}

function isUserBoosted(address) {
    // For now return false for other users; could cache from events
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.isBoosted;
    return false;
}

function isUserBadged(address) {
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.hasBadge;
    return false;
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateView(view, data) {
    BC.viewHistory.push({
        view: BC.view,
        activeTab: BC.activeTab,
        selectedPost: BC.selectedPost,
        selectedProfile: BC.selectedProfile
    });
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
    // V9: agoraContract replaces backchatContract
    if (State.agoraContract) return State.agoraContract;
    if (State.agoraContractPublic) return State.agoraContractPublic;

    const backchatAddress = getBackchatAddress();
    if (!backchatAddress) {
        console.warn('Agora/Backchat address not found in deployment-addresses.json');
        return null;
    }

    if (State.publicProvider) {
        return new ethers.Contract(backchatAddress, agoraABI, State.publicProvider);
    }

    return null;
}

async function loadFees() {
    try {
        const contract = getContract();
        if (!contract) return;

        // V9: No getCurrentFees(). Fees are gas-based via ecosystem.
        // SuperLike/Downvote have fixed VOTE_PRICE (100 gwei per vote).
        // Other fees are estimated at tx time by txEngine.
        let votePrice = 100000000n; // 100 gwei default
        try {
            votePrice = await contract.VOTE_PRICE();
        } catch(e) {}

        // Gas-based fee estimates (ecosystem calculates actual fee at tx time)
        const defaultFee = window.ethers.parseEther('0.0001');
        BC.fees = {
            post: defaultFee,
            reply: defaultFee,
            like: defaultFee,
            follow: defaultFee,
            repost: defaultFee,
            superLikeMin: votePrice,
            boostMin: window.ethers.parseEther('0.0005'), // 0.0005 ETH per day
            badge: window.ethers.parseEther('0.001')       // 0.001 ETH for 1 year
        };
    } catch (e) {
        console.warn('Failed to load fees:', e.message);
    }
}

async function loadUserStatus() {
    if (!State.isConnected || !State.userAddress) return;

    try {
        const contract = getContract();
        if (!contract) return;

        // V9: Use getUserProfile() 7-tuple for boost/badge info
        // No getPendingBalance, no referral system in V9 Agora
        const [profile, hasBadge, isBoosted] = await Promise.all([
            contract.getUserProfile(State.userAddress).catch(() => null),
            contract.hasTrustBadge(State.userAddress).catch(() => false),
            contract.isProfileBoosted(State.userAddress).catch(() => false)
        ]);

        BC.pendingEth = 0n; // V9: No earnings/withdraw in Agora
        BC.hasBadge = hasBadge;
        BC.isBoosted = isBoosted;
        BC.boostExpiry = profile ? Number(profile.boostExp || profile[5] || 0) : 0;
        BC.badgeExpiry = profile ? Number(profile.badgeExp || profile[6] || 0) : 0;
        BC.referredBy = null;  // V9: No referral system
        BC.referralStats = { totalReferred: 0, totalEarned: 0n, totalEarnedFormatted: '0.0' };
    } catch (e) {
        console.warn('Failed to load user status:', e.message);
    }

    // V9: No referral system in Agora
}

// ============================================================================
// PROFILE + SOCIAL LOADING
// ============================================================================

async function loadProfiles() {
    try {
        const contract = getContract();
        if (!contract) {
            BC.hasProfile = false;
            return;
        }

        const [createEvents, updateEvents] = await Promise.all([
            contract.queryFilter(contract.filters.ProfileCreated(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.ProfileUpdated(), -100000).catch(() => [])
        ]);

        // Build profiles map from creation events
        for (const ev of createEvents) {
            const addr = ev.args.user.toLowerCase();
            BC.profiles.set(addr, {
                username: ev.args.username,
                displayName: ev.args.displayName || '',
                bio: ev.args.bio || ''
            });
        }

        // Apply updates (overwrite displayName/bio)
        for (const ev of updateEvents) {
            const addr = ev.args.user.toLowerCase();
            const existing = BC.profiles.get(addr);
            if (existing) {
                existing.displayName = ev.args.displayName || existing.displayName;
                existing.bio = ev.args.bio || existing.bio;
            }
        }

        // Check if current user has a profile
        if (State.isConnected && State.userAddress) {
            const myAddr = State.userAddress.toLowerCase();
            const myProfile = BC.profiles.get(myAddr);
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

        console.log('[Backchat] Profiles loaded:', BC.profiles.size, '| hasProfile:', BC.hasProfile);
    } catch (e) {
        console.warn('Failed to load profiles:', e.message);
        BC.hasProfile = false;
    }

    renderContent();
}

async function loadSocialGraph() {
    if (!State.isConnected || !State.userAddress) return;

    try {
        const contract = getContract();
        if (!contract) return;

        const [followEvents, unfollowEvents] = await Promise.all([
            contract.queryFilter(contract.filters.Followed(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.Unfollowed(), -100000).catch(() => [])
        ]);

        // Build follow maps
        const followMap = new Map(); // follower → Set<followed>
        for (const ev of followEvents) {
            const follower = ev.args.follower.toLowerCase();
            const followed = ev.args.followed.toLowerCase();
            if (!followMap.has(follower)) followMap.set(follower, new Set());
            followMap.get(follower).add(followed);
        }
        // Remove unfollows
        for (const ev of unfollowEvents) {
            const follower = ev.args.follower.toLowerCase();
            const followed = ev.args.followed.toLowerCase();
            followMap.get(follower)?.delete(followed);
        }

        // Current user's following set
        const myAddr = State.userAddress.toLowerCase();
        BC.following = followMap.get(myAddr) || new Set();

        // Count followers for current user
        BC.followers = new Set();
        for (const [follower, followedSet] of followMap) {
            if (followedSet.has(myAddr)) BC.followers.add(follower);
        }

        // Build follow counts for all addresses
        BC.followCounts = new Map();
        for (const [follower, followedSet] of followMap) {
            for (const followed of followedSet) {
                if (!BC.followCounts.has(followed)) BC.followCounts.set(followed, { followers: 0, following: 0 });
                BC.followCounts.get(followed).followers++;
            }
            if (!BC.followCounts.has(follower)) BC.followCounts.set(follower, { followers: 0, following: 0 });
            BC.followCounts.get(follower).following = followedSet.size;
        }
    } catch (e) {
        console.warn('Failed to load social graph:', e.message);
    }
}

// V9: No referral system in Agora — tryAutoSetReferrer removed
async function tryAutoSetReferrer() {
    // V9: No-op, referral system removed from Agora contract
    localStorage.removeItem('backchain_referrer');
}

async function loadPosts() {
    BC.isLoading = true;
    renderContent();

    try {
        const backchatAddress = getBackchatAddress();
        if (!backchatAddress) {
            BC.contractAvailable = false;
            BC.error = 'Backchat contract not deployed yet.';
            return;
        }

        const contract = getContract();
        if (!contract) {
            BC.contractAvailable = false;
            BC.error = 'Could not connect to Backchat contract';
            return;
        }

        BC.contractAvailable = true;

        // Query all content events in parallel
        const [postEvents, replyEvents, repostEvents, likeEvents, superLikeEvents] = await Promise.all([
            contract.queryFilter(contract.filters.PostCreated(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.ReplyCreated(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.RepostCreated(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.Liked(), -100000).catch(() => []),
            contract.queryFilter(contract.filters.SuperLiked(), -100000).catch(() => [])
        ]);

        // Build likes map: postId → Set<address>
        BC.likesMap = new Map();
        for (const ev of likeEvents) {
            const pid = ev.args.postId.toString();
            if (!BC.likesMap.has(pid)) BC.likesMap.set(pid, new Set());
            BC.likesMap.get(pid).add(ev.args.user.toLowerCase());
        }

        // Build super likes map: postId → totalETH
        const superLikesMap = new Map();
        for (const ev of superLikeEvents) {
            const pid = ev.args.postId.toString();
            superLikesMap.set(pid, (superLikesMap.get(pid) || 0n) + ev.args.ethAmount);
        }

        // Process posts (top-level)
        const allItems = [];
        const feedPosts = [];
        BC.postsById = new Map();
        BC.replies = new Map();
        BC.replyCountMap = new Map();
        BC.repostCountMap = new Map();

        for (const ev of postEvents.slice(-80)) {
            const block = await ev.getBlock();
            const post = {
                id: ev.args.postId.toString(),
                type: 'post',
                author: ev.args.author,
                content: ev.args.content,
                mediaCID: ev.args.mediaCID,
                timestamp: block.timestamp,
                superLikes: superLikesMap.get(ev.args.postId.toString()) || 0n,
                txHash: ev.transactionHash
            };
            allItems.push(post);
            feedPosts.push(post);
            BC.postsById.set(post.id, post);
        }

        // Process replies → build replies map
        for (const ev of replyEvents.slice(-60)) {
            const block = await ev.getBlock();
            const reply = {
                id: ev.args.postId.toString(),
                type: 'reply',
                parentId: ev.args.parentId.toString(),
                author: ev.args.author,
                content: ev.args.content,
                mediaCID: ev.args.mediaCID,
                tipBkc: ev.args.tipBkc,
                timestamp: block.timestamp,
                superLikes: superLikesMap.get(ev.args.postId.toString()) || 0n,
                txHash: ev.transactionHash
            };
            allItems.push(reply);
            BC.postsById.set(reply.id, reply);

            // Add to replies map
            const parentId = reply.parentId;
            if (!BC.replies.has(parentId)) BC.replies.set(parentId, []);
            BC.replies.get(parentId).push(reply);

            // Count
            BC.replyCountMap.set(parentId, (BC.replyCountMap.get(parentId) || 0) + 1);
        }

        // Process reposts
        for (const ev of repostEvents.slice(-30)) {
            const block = await ev.getBlock();
            const repost = {
                id: ev.args.newPostId.toString(),
                type: 'repost',
                originalPostId: ev.args.originalPostId.toString(),
                author: ev.args.reposter,
                timestamp: block.timestamp,
                txHash: ev.transactionHash
            };
            allItems.push(repost);
            feedPosts.push(repost);
            BC.postsById.set(repost.id, repost);

            // Count reposts on original
            const oid = repost.originalPostId;
            BC.repostCountMap.set(oid, (BC.repostCountMap.get(oid) || 0) + 1);
        }

        // Sort
        feedPosts.sort((a, b) => b.timestamp - a.timestamp);
        BC.posts = feedPosts;
        BC.allItems = allItems;

        // Trending: posts with super likes, sorted by value
        BC.trendingPosts = [...allItems]
            .filter(p => p.type !== 'repost' && p.superLikes > 0n)
            .sort((a, b) => {
                const aVal = BigInt(a.superLikes || 0);
                const bVal = BigInt(b.superLikes || 0);
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            });

    } catch (e) {
        console.error('Failed to load posts:', e);
        BC.error = e.message;
    } finally {
        BC.isLoading = false;
        renderContent();
    }
}

// ============================================================================
// ACTIONS (via BackchatTx — txEngine pattern)
// ============================================================================

async function doCreatePost() {
    const input = document.getElementById('bc-compose-input');
    const content = input?.value?.trim();
    if (!content) { showToast('Please write something', 'error'); return; }
    if (content.length > MAX_CONTENT) { showToast(`Post too long (max ${MAX_CONTENT} chars)`, 'error'); return; }

    BC.isPosting = true;
    renderContent();

    let mediaCID = '';

    // Upload image first if pending
    if (BC.pendingImage) {
        try {
            BC.isUploadingImage = true;
            renderContent();
            const result = await uploadImageToIPFS(BC.pendingImage);
            mediaCID = result.ipfsHash || '';
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

    const capturedContent = content;
    const btn = document.getElementById('bc-post-btn');

    await BackchatTx.createPost({
        content: capturedContent,
        mediaCID,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            BC.pendingImage = null;
            BC.pendingImagePreview = null;
            BC.isPosting = false;
            showToast('Post created!', 'success');
            await loadPosts();
        },
        onError: (e) => {
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
        mediaCID: '',
        tipBkc: 0,
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
        tipBkc: 0,
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
    // Optimistic UI update
    const myAddr = State.userAddress?.toLowerCase();
    if (myAddr) {
        if (!BC.likesMap.has(postId)) BC.likesMap.set(postId, new Set());
        BC.likesMap.get(postId).add(myAddr);
        renderContent();
    }

    await BackchatTx.like({
        postId,
        tipBkc: 0,
        operator: getOperatorAddress(),
        onSuccess: () => {
            showToast('Liked!', 'success');
        },
        onError: () => {
            // Revert optimistic update
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
        tipBkc: 0,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast('Super Liked!', 'success');
            await loadPosts();
        }
    });
}

async function doFollow(address) {
    await BackchatTx.follow({
        toFollow: address,
        tipBkc: 0,
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

async function doWithdraw() {
    // V9: No withdraw/earnings system in Agora
    showToast('Withdraw not available in V9', 'warning');
}

async function doCreateProfile() {
    const btn = document.getElementById('bc-wizard-confirm-btn');

    await BackchatTx.createProfile({
        username: BC.wizUsername,
        displayName: BC.wizDisplayName,
        bio: BC.wizBio,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            showToast('Profile created!', 'success');
            BC.hasProfile = true;
            BC.userProfile = { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio, address: State.userAddress };
            BC.profiles.set(State.userAddress.toLowerCase(), { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio });
            // Reset wizard
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
    const btn = document.getElementById('bc-edit-profile-btn');

    await BackchatTx.updateProfile({
        displayName,
        bio,
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
        const resp = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || `Upload failed (${resp.status})`);
        }
        return await resp.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

function handleImageSelect(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Maximum 5MB.', 'error');
        return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        showToast('Invalid image type. Use JPG, PNG, GIF, or WebP.', 'error');
        return;
    }

    BC.pendingImage = file;

    const reader = new FileReader();
    reader.onload = (ev) => {
        BC.pendingImagePreview = ev.target.result;
        renderContent();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    BC.pendingImage = null;
    BC.pendingImagePreview = null;
    const input = document.getElementById('bc-image-input');
    if (input) input.value = '';
    renderContent();
}

// Username check debounce
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
                    BackchatTx.getUsernameFee(BC.wizUsername.length)
                ]);
                BC.wizUsernameOk = available;
                BC.wizFee = feeData.formatted;
            } catch (e) {
                console.warn('Username check failed:', e);
            }
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

    // Update Next button disabled state (it was rendered with disabled, need to re-enable)
    const nextBtn = document.querySelector('.bc-wizard-nav .bc-btn-primary');
    if (nextBtn && BC.wizStep === 1) {
        nextBtn.disabled = !BC.wizUsernameOk;
    }
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
                    <button class="bc-back-btn" onclick="BackchatPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <span class="bc-back-title">${title}</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="bc-header">
            <div class="bc-header-bar">
                <div class="bc-brand">
                    <img src="assets/backchat.png" alt="Backchat" class="bc-brand-icon" onerror="this.style.display='none'">
                    <span class="bc-brand-name">Backchat</span>
                </div>
                <div class="bc-header-right">
                    ${State.isConnected && BC.pendingEth > 0n ? `
                        <button class="bc-icon-btn earnings-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${formatETH(BC.pendingEth)} ETH">
                            <i class="fa-solid fa-coins"></i>
                        </button>
                    ` : ''}
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()" title="Refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${BC.activeTab === 'feed' ? 'active' : ''}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'trending' ? 'active' : ''}" onclick="BackchatPage.setTab('trending')">
                    <i class="fa-solid fa-fire"></i> Trending
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'profile' ? 'active' : ''}" onclick="BackchatPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>
    `;
}

function renderCompose() {
    if (!State.isConnected) return '';

    const fee = formatETH(BC.fees.post);
    const profileBanner = (!BC.hasProfile && State.isConnected) ? `
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and bio</p>
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
                    <textarea
                        id="bc-compose-input"
                        class="bc-compose-textarea"
                        placeholder="What's happening on-chain?"
                        maxlength="${MAX_CONTENT}"
                        oninput="BackchatPage._updateCharCount(this)"
                    ></textarea>
                    ${BC.pendingImagePreview ? `
                        <div class="bc-image-preview">
                            <img src="${BC.pendingImagePreview}" alt="Preview">
                            <button class="bc-image-remove" onclick="BackchatPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    ` : ''}
                    ${BC.isUploadingImage ? '<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading image...</div>' : ''}
                </div>
            </div>
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add image" onclick="document.getElementById('bc-image-input').click()">
                        <i class="fa-solid fa-image"></i>
                    </button>
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
        </div>
    `;
}

function renderPost(post, index = 0, options = {}) {
    // Handle repost wrapper
    if (post.type === 'repost' && !options.isRepostContent) {
        const originalPost = BC.postsById.get(post.originalPostId);
        return `
            <div class="bc-post" data-post-id="${post.id}" style="animation-delay:${Math.min(index * 0.04, 0.4)}s">
                <div class="bc-repost-banner">
                    <i class="fa-solid fa-retweet"></i>
                    <span>${getProfileName(post.author)} reposted</span>
                </div>
                ${originalPost ? renderPost(originalPost, index, { isRepostContent: true, noAnimation: true }) : `
                    <div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>
                `}
            </div>
        `;
    }

    const authorName = getProfileName(post.author);
    const username = getProfileUsername(post.author);
    const boosted = isUserBoosted(post.author);
    const badged = isUserBadged(post.author);
    const superLikesETH = formatETH(post.superLikes);
    const replyCount = BC.replyCountMap.get(post.id) || 0;
    const repostCount = BC.repostCountMap.get(post.id) || 0;
    const likeCount = BC.likesMap.get(post.id)?.size || 0;
    const isLiked = BC.likesMap.get(post.id)?.has(State.userAddress?.toLowerCase()) || false;
    const animStyle = options.noAnimation ? '' : `style="animation-delay:${Math.min(index * 0.04, 0.4)}s"`;

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
                        ${post.superLikes > 0n ? `<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${superLikesETH}</span>` : ''}
                    </div>
                    ${post.type === 'reply' ? `<div class="bc-post-context">Replying to ${getProfileName(BC.postsById.get(post.parentId)?.author)}</div>` : ''}
                </div>
            </div>

            ${post.content ? `<div class="bc-post-body">${escapeHtml(post.content)}</div>` : ''}

            ${post.mediaCID ? `
                <div class="bc-post-media">
                    <img src="${IPFS_GATEWAY}${post.mediaCID}" alt="Media" loading="lazy" onerror="this.style.display='none'">
                </div>
            ` : ''}

            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${post.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>
                    ${replyCount > 0 ? `<span class="count">${replyCount}</span>` : ''}
                </button>
                <button class="bc-action act-repost" onclick="BackchatPage.openRepostConfirm('${post.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>
                    ${repostCount > 0 ? `<span class="count">${repostCount}</span>` : ''}
                </button>
                <button class="bc-action act-like ${isLiked ? 'liked' : ''}" onclick="BackchatPage.like('${post.id}')" title="Like">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    ${likeCount > 0 ? `<span class="count">${likeCount}</span>` : ''}
                </button>
                <button class="bc-action act-super" onclick="BackchatPage.openSuperLike('${post.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `;
}

function renderFeed() {
    if (!BC.contractAvailable) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="bc-empty-title">Coming Soon!</div>
                <div class="bc-empty-text">
                    ${BC.error || 'Backchat is being deployed. The unstoppable social network will be live soon!'}
                </div>
                <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `;
    }
    
    if (BC.isLoading) {
        return `
            <div class="bc-loading">
                <div class="bc-spinner"></div>
                <span class="bc-loading-text">Loading feed...</span>
            </div>
        `;
    }
    
    if (BC.posts.length === 0) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-glyph">
                    <i class="fa-regular fa-comment-dots"></i>
                </div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post on the unstoppable social network!</div>
            </div>
        `;
    }
    
    return BC.posts.map((post, i) => renderPost(post, i)).join('');
}

function renderTrending() {
    if (BC.trendingPosts.length === 0) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-glyph accent">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <div class="bc-empty-title">No trending posts</div>
                <div class="bc-empty-text">Super Like posts to make them trend! Ranking is 100% organic, based on ETH spent.</div>
            </div>
        `;
    }
    
    return `
        <div class="bc-trending-header">
            <h2><i class="fa-solid fa-fire"></i> Trending</h2>
            <p>Ranked by Super Like value — pure organic discovery</p>
        </div>
        ${BC.trendingPosts.map((post, i) => renderPost(post, i)).join('')}
    `;
}

function renderProfile() {
    if (!State.isConnected) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;
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
                        ${BC.hasProfile ? `
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openEditProfile()">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                        ` : `
                            <button class="bc-btn bc-btn-primary" onclick="BackchatPage.openProfileSetup()">
                                <i class="fa-solid fa-user-plus"></i> Create Profile
                            </button>
                        `}
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
                    <a href="${EXPLORER_ADDRESS}${State.userAddress}" target="_blank" rel="noopener">
                        View on Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${userPosts.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${followersCount}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${followingCount}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${formatETH(BC.pendingEth)}</div>
                        <div class="bc-stat-label">Earned</div>
                    </div>
                </div>
            </div>

            ${BC.pendingEth > 0n ? `
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header"><i class="fa-solid fa-coins"></i> Pending Earnings</div>
                    <div class="bc-earnings-value">${formatETH(BC.pendingEth)} <small>ETH</small></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                        <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                    </button>
                </div>
            ` : ''}

            ${renderReferralCard()}

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${userPosts.length} total</span>
            </div>

            ${userPosts.length === 0
                ? `<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>`
                : userPosts.map((p, i) => renderPost(p, i)).join('')
            }
        </div>
    `;
}

function renderReferralCard() {
    if (!State.isConnected) return '';

    const refLink = `${window.location.origin}/#backchat?ref=${State.userAddress}`;
    const referred = BC.referralStats?.totalReferred || 0;
    const earned = BC.referralStats?.totalEarnedFormatted || '0.0';

    return `
        <div class="bc-referral-card">
            <div class="bc-referral-header">
                <i class="fa-solid fa-link"></i> Viral Referral
            </div>
            <div class="bc-referral-link-box">
                <span class="bc-referral-link-text" id="referral-link-text">${refLink}</span>
                <button onclick="BackchatPage.copyReferralLink()">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
            </div>
            <div class="bc-referral-stats-row">
                <div class="bc-referral-stat">
                    <div class="bc-referral-stat-value">${referred}</div>
                    <div class="bc-referral-stat-label">Referred</div>
                </div>
                <div class="bc-referral-stat">
                    <div class="bc-referral-stat-value">${earned}</div>
                    <div class="bc-referral-stat-label">ETH Earned</div>
                </div>
            </div>
            <button class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.shareReferral()">
                <i class="fa-solid fa-share-nodes"></i> Share Referral Link
            </button>
            <div class="bc-referral-info" style="margin-top:12px;">
                Earn 30% of all fees from users who join through your link.
                ${BC.referredBy ? `<br>You were referred by <code style="font-size:11px;color:var(--bc-accent);">${shortenAddress(BC.referredBy)}</code>` : ''}
            </div>
        </div>
    `;
}

function renderContent() {
    const container = document.getElementById('backchat-content');
    if (!container) return;

    let content = '';

    switch (BC.view) {
        case 'feed':
            content = renderCompose() + renderFeed();
            break;
        case 'trending':
            content = renderTrending();
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
            content = renderCompose() + renderFeed();
    }

    container.innerHTML = content;
}

// ============================================================================
// NEW VIEW RENDERERS
// ============================================================================

function renderPostDetail() {
    const post = BC.selectedPost ? BC.postsById.get(BC.selectedPost) : null;
    if (!post) {
        return `<div class="bc-empty"><div class="bc-empty-title">Post not found</div></div>`;
    }

    const replies = BC.replies.get(post.id) || [];
    replies.sort((a, b) => a.timestamp - b.timestamp);
    const parentAuthor = getProfileName(post.author);

    return `
        <div class="bc-thread-parent">
            ${renderPost(post, 0, { noAnimation: true })}
        </div>
        <div class="bc-thread-divider">
            Replies ${replies.length > 0 ? `(${replies.length})` : ''}
        </div>
        ${replies.length === 0 ? `
            <div class="bc-empty" style="padding:40px 20px;">
                <div class="bc-empty-text">No replies yet. Be the first!</div>
            </div>
        ` : replies.map((r, i) => `
            <div class="bc-thread-reply">
                ${renderPost(r, i, { noAnimation: true })}
            </div>
        `).join('')}
        ${State.isConnected ? `
            <div class="bc-reply-compose">
                <div class="bc-reply-label">Replying to ${parentAuthor}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="Write a reply..." maxlength="${MAX_CONTENT}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="BackchatPage.submitReply('${post.id}')">
                        Reply
                    </button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">Fee: ${formatETH(BC.fees.reply)} ETH</div>
            </div>
        ` : ''}
    `;
}

function renderUserProfile() {
    const addr = BC.selectedProfile;
    if (!addr) return `<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>`;

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
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${escapeHtml(displayName)}</span>
                </div>
                ${username ? `<div class="bc-profile-username">@${username}</div>` : ''}
                ${bio ? `<div class="bc-profile-bio">${escapeHtml(bio)}</div>` : ''}

                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${addr}" target="_blank" rel="noopener">
                        ${shortenAddress(addr)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>

                <div class="bc-profile-stats">
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${userPosts.length}</div>
                        <div class="bc-stat-label">Posts</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${counts.followers}</div>
                        <div class="bc-stat-label">Followers</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${counts.following}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                </div>
            </div>

            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Posts</span>
                <span class="bc-section-subtitle">${userPosts.length}</span>
            </div>
            ${userPosts.length === 0
                ? `<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>`
                : userPosts.sort((a, b) => b.timestamp - a.timestamp).map((p, i) => renderPost(p, i)).join('')
            }
        </div>
    `;
}

function renderProfileSetup() {
    if (!State.isConnected) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to create your profile.</div>
            </div>
        `;
    }

    const step = BC.wizStep;

    return `
        <div class="bc-wizard">
            <div class="bc-wizard-title">Create Your Profile</div>
            <div class="bc-wizard-desc">Set up your on-chain identity in ${step === 3 ? 'one last step' : 'a few steps'}</div>

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
                            value="${BC.wizUsername}" maxlength="15"
                            oninput="BackchatPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more ETH.</div>
                    </div>
                ` : step === 2 ? `
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${escapeHtml(BC.wizDisplayName)}" maxlength="30"
                            oninput="BackchatPage._wizSave()">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3"
                            oninput="BackchatPage._wizSave()" style="resize:none;">${escapeHtml(BC.wizBio)}</textarea>
                    </div>
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
                ${step > 1 ? `<button class="bc-btn bc-btn-outline" onclick="BackchatPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>` : ''}
                ${step < 3 ? `
                    <button class="bc-btn bc-btn-primary" onclick="BackchatPage.wizNext()"
                        ${step === 1 && !BC.wizUsernameOk ? 'disabled' : ''}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                ` : `
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="BackchatPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>
    `;
}

function renderModals() {
    return `
        <!-- Super Like Modal -->
        <div class="bc-modal-overlay" id="modal-superlike">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-star" style="color:var(--bc-accent)"></i> Super Like</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('superlike')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Super Likes boost posts to trending. The more ETH you contribute, the higher it ranks — a fully organic discovery system.
                    </p>
                    <div class="bc-field">
                        <label class="bc-label">Amount (ETH)</label>
                        <input type="number" id="superlike-amount" class="bc-input" value="0.001" min="0.0001" step="0.0001">
                    </div>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-val">0.0001 ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmSuperLike()">
                        <i class="fa-solid fa-star"></i> Super Like
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Badge Modal -->
        <div class="bc-modal-overlay" id="modal-badge">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-circle-check" style="color:var(--bc-accent)"></i> Trust Badge</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('badge')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Get a verified trust badge for 1 year. Show the community you're a committed, trusted member.
                    </p>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Badge Fee</span>
                        <span class="bc-fee-val">${formatETH(BC.fees.badge)} ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBadge()">
                        <i class="fa-solid fa-circle-check"></i> Get Badge (1 Year)
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Boost Modal -->
        <div class="bc-modal-overlay" id="modal-boost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:var(--bc-accent)"></i> Profile Boost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('boost')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">
                        Boost your profile visibility for increased exposure. Each 0.0005 ETH gives you 1 day of boost.
                    </p>
                    <div class="bc-field">
                        <label class="bc-label">Amount (ETH)</label>
                        <input type="number" id="boost-amount" class="bc-input" value="0.001" min="0.0005" step="0.0005">
                    </div>
                    <div class="bc-fee-row">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-val">0.0005 ETH (1 day)</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="BackchatPage.confirmBoost()">
                        <i class="fa-solid fa-rocket"></i> Boost Profile
                    </button>
                </div>
            </div>
        </div>

        <!-- Repost Confirm Modal -->
        <div class="bc-modal-overlay" id="modal-repost">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-retweet" style="color:var(--bc-green)"></i> Repost</span>
                    <button class="bc-modal-x" onclick="BackchatPage.closeModal('repost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Repost this to your followers? Fee: ${formatETH(BC.fees.repost)} ETH</p>
                    <button id="bc-repost-confirm-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmRepost()">
                        <i class="fa-solid fa-retweet"></i> Repost
                    </button>
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
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="edit-displayname" class="bc-input" value="${escapeHtml(BC.userProfile?.displayName || '')}" maxlength="30" placeholder="Your display name">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${escapeHtml(BC.userProfile?.bio || '')}</textarea>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="BackchatPage.confirmEditProfile()">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
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
        ${renderModals()}
    `;
    
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

function openBadge() {
    document.getElementById('modal-badge')?.classList.add('active');
}

async function confirmBadge() {
    closeModal('badge');
    await doObtainBadge();
}

function openBoost() {
    document.getElementById('modal-boost')?.classList.add('active');
}

async function confirmBoost() {
    const amount = document.getElementById('boost-amount')?.value || '0.001';
    closeModal('boost');
    await doBoostProfile(amount);
}

function openRepostConfirm(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-repost')?.classList.add('active');
}

async function confirmRepost() {
    await doRepost(selectedPostForAction);
}

function openEditProfile() {
    render(); // Re-render to update modal with current values
    document.getElementById('modal-edit-profile')?.classList.add('active');
}

async function confirmEditProfile() {
    await doUpdateProfile();
}

function closeModal(name) {
    document.getElementById(`modal-${name}`)?.classList.remove('active');
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
            loadProfiles(),
            loadPosts(),
            loadSocialGraph()
        ]);
    },

    async refresh() {
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadProfiles(),
            loadPosts(),
            loadSocialGraph()
        ]);
    },

    setTab(tab) {
        BC.activeTab = tab;
        BC.view = tab;
        render();
    },

    // Navigation
    goBack,
    viewPost(postId) {
        navigateView('post-detail', { post: postId });
    },
    viewProfile(address) {
        if (address?.toLowerCase() === State.userAddress?.toLowerCase()) {
            BC.activeTab = 'profile';
            BC.view = 'profile';
            render();
        } else {
            navigateView('user-profile', { profile: address });
        }
    },
    openReply(postId) {
        navigateView('post-detail', { post: postId });
    },
    openProfileSetup() {
        BC.wizStep = 1;
        BC.wizUsername = '';
        BC.wizDisplayName = '';
        BC.wizBio = '';
        BC.wizUsernameOk = null;
        BC.wizFee = null;
        navigateView('profile-setup');
    },

    // Actions
    createPost: doCreatePost,
    submitReply: doCreateReply,
    like: doLike,
    follow: doFollow,
    unfollow: doUnfollow,
    withdraw: doWithdraw,
    openSuperLike,
    confirmSuperLike,
    openRepostConfirm,
    confirmRepost,

    // Modals
    openBadge,
    confirmBadge,
    openBoost,
    confirmBoost,
    openEditProfile,
    confirmEditProfile,
    closeModal,
    openEarnings() { BC.activeTab = 'profile'; BC.view = 'profile'; render(); },

    // Image upload
    handleImageSelect,
    removeImage,

    // Profile wizard
    onWizUsernameInput,
    wizNext() {
        if (BC.wizStep === 1 && !BC.wizUsernameOk) return;
        if (BC.wizStep === 1) {
            // Save username, move to step 2
            BC.wizStep = 2;
        } else if (BC.wizStep === 2) {
            // Save display name + bio from inputs
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
    _wizSave() {
        // Auto-save on input
    },

    // Internal
    _updateCharCount,

    // Referral (V8)
    copyReferralLink() {
        const link = `${window.location.origin}/#backchat?ref=${State.userAddress}`;
        navigator.clipboard.writeText(link).then(
            () => showToast('Referral link copied!', 'success'),
            () => showToast('Failed to copy', 'error')
        );
    },
    shareReferral() {
        const link = `${window.location.origin}/#backchat?ref=${State.userAddress}`;
        const text = 'Join Backchat — earn crypto by posting, liking, and referring friends! 30% referral rewards.';
        if (navigator.share) {
            navigator.share({ title: 'Backchat Referral', text, url: link }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${text}\n${link}`).then(
                () => showToast('Referral message copied!', 'success'),
                () => showToast('Failed to copy', 'error')
            );
        }
    }
};

window.BackchatPage = BackchatPage;