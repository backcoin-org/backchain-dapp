// js/pages/BackchatPage.js
// ✅ PRODUCTION V8.0 - Complete Decentralized Social Network — Viral Referral
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
import { addresses, ipfsGateway, backchatABI } from '../config.js';
import { formatBigNumber } from '../utils.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const IPFS_GATEWAY = ipfsGateway || "https://gateway.pinata.cloud/ipfs/";

// Get addresses from config (loaded from deployment-addresses.json)
function getBackchatAddress() {
    return addresses.backchat || addresses.Backchat || null;
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
    // UI State
    activeTab: 'feed',       // feed | trending | profile
    view: 'feed',            // feed | post | compose | profile | settings
    
    // Data
    posts: [],               // All loaded posts
    trendingPosts: [],       // Posts sorted by super likes
    userProfile: null,       // Current user's profile
    profiles: new Map(),     // address → profile cache
    following: new Set(),    // Set of addresses user follows
    
    // Selected
    selectedPost: null,      // For viewing single post with replies
    selectedProfile: null,   // For viewing other user's profile
    
    // Fees
    fees: {
        post: 0n,
        reply: 0n,
        like: 0n,
        follow: 0n,
        repost: 0n,
        superLikeMin: 0n,
        boostMin: 0n,
        badge: 0n
    },
    
    // User stats
    pendingEth: 0n,
    hasBadge: false,
    isBoosted: false,
    boostExpiry: 0,
    badgeExpiry: 0,
    
    // Referral (V8)
    referralStats: null,     // { totalReferred, totalEarned, totalEarnedFormatted }
    referredBy: null,        // address or null (address(0) means none)

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

// ============================================================================
// CONTRACT INTERACTION
// ============================================================================

function getContract() {
    if (State.backchatContract) return State.backchatContract;
    if (State.backchatContractPublic) return State.backchatContractPublic;
    
    const backchatAddress = getBackchatAddress();
    if (!backchatAddress) {
        console.warn('Backchat address not found in deployment-addresses.json');
        return null;
    }
    
    if (State.publicProvider) {
        return new ethers.Contract(backchatAddress, backchatABI, State.publicProvider);
    }
    
    return null;
}

function getSignedContract() {
    if (State.backchatContract) return State.backchatContract;
    
    const backchatAddress = getBackchatAddress();
    if (!backchatAddress || !State.signer) return null;
    
    return new ethers.Contract(backchatAddress, backchatABI, State.signer);
}

async function loadFees() {
    try {
        const contract = getContract();
        if (!contract) return;
        
        const fees = await contract.getCurrentFees();
        BC.fees = {
            post: fees.postFee,
            reply: fees.replyFee,
            like: fees.likeFee,
            follow: fees.followFee,
            repost: fees.repostFee,
            superLikeMin: fees.superLikeMin,
            boostMin: fees.boostMin,
            badge: fees.badgeFee_
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

        const [pending, hasBadge, isBoosted, boostExp, badgeExp, referredBy, referralStats] = await Promise.all([
            contract.getPendingBalance(State.userAddress).catch(() => 0n),
            contract.hasTrustBadge(State.userAddress).catch(() => false),
            contract.isProfileBoosted(State.userAddress).catch(() => false),
            contract.boostExpiry(State.userAddress).catch(() => 0),
            contract.badgeExpiry(State.userAddress).catch(() => 0),
            contract.referredBy(State.userAddress).catch(() => ethers.ZeroAddress),
            contract.getReferralStats(State.userAddress).catch(() => ({ totalReferred: 0n, totalEarned: 0n }))
        ]);

        BC.pendingEth = pending;
        BC.hasBadge = hasBadge;
        BC.isBoosted = isBoosted;
        BC.boostExpiry = Number(boostExp);
        BC.badgeExpiry = Number(badgeExp);
        BC.referredBy = (referredBy && referredBy !== ethers.ZeroAddress) ? referredBy : null;
        BC.referralStats = {
            totalReferred: Number(referralStats.totalReferred),
            totalEarned: referralStats.totalEarned,
            totalEarnedFormatted: ethers.formatEther(referralStats.totalEarned)
        };
    } catch (e) {
        console.warn('Failed to load user status:', e.message);
    }

    // V8: Auto-set referrer from URL param (stored in localStorage by app.js)
    await tryAutoSetReferrer();
}

/**
 * V8: If the user arrived via a referral link, auto-register the referrer on-chain.
 * Only runs once per user (contract enforces immutability).
 */
async function tryAutoSetReferrer() {
    try {
        if (!State.isConnected || !State.userAddress) return;
        if (BC.referredBy) return; // already has a referrer on-chain

        const storedRef = localStorage.getItem('backchain_referrer');
        if (!storedRef) return;

        // Don't self-refer
        if (storedRef.toLowerCase() === State.userAddress.toLowerCase()) {
            localStorage.removeItem('backchain_referrer');
            return;
        }

        const contract = getSignedContract();
        if (!contract) return;

        console.log('[Referral] Auto-setting referrer:', storedRef);
        const tx = await contract.setReferrer(storedRef);
        showToast('Setting your referrer...', 'info');
        await tx.wait();

        BC.referredBy = storedRef;
        localStorage.removeItem('backchain_referrer');
        showToast('Referrer registered! They earn 30% of your fees.', 'success');
        renderContent();
    } catch (e) {
        console.warn('[Referral] Auto-set failed:', e.message);
        // If it reverted (already set), clean up localStorage
        if (e.message?.includes('ReferrerAlreadySet') || e.message?.includes('already set')) {
            localStorage.removeItem('backchain_referrer');
        }
    }
}

async function loadPosts() {
    BC.isLoading = true;
    renderContent();
    
    try {
        const backchatAddress = getBackchatAddress();
        
        if (!backchatAddress) {
            BC.contractAvailable = false;
            BC.error = 'Backchat contract not deployed yet. Add "backchat" to deployment-addresses.json';
            console.warn('⚠️ Backchat address not found in config');
            return;
        }
        
        const contract = getContract();
        if (!contract) {
            BC.contractAvailable = false;
            BC.error = 'Could not connect to Backchat contract';
            return;
        }
        
        BC.contractAvailable = true;
        
        const postCount = await contract.postCounter();
        const count = Number(postCount);
        
        if (count === 0) {
            BC.posts = [];
            return;
        }
        
        // Load last 50 posts via events
        const filter = contract.filters.PostCreated();
        const events = await contract.queryFilter(filter, -10000);
        
        const replyFilter = contract.filters.ReplyCreated();
        const replyEvents = await contract.queryFilter(replyFilter, -10000);
        
        const repostFilter = contract.filters.RepostCreated();
        const repostEvents = await contract.queryFilter(repostFilter, -10000);
        
        const superLikeFilter = contract.filters.SuperLiked();
        const superLikeEvents = await contract.queryFilter(superLikeFilter, -10000);
        
        // Build super likes map
        const superLikesMap = new Map();
        for (const event of superLikeEvents) {
            const postId = event.args.postId.toString();
            const amount = event.args.ethAmount;
            const current = superLikesMap.get(postId) || 0n;
            superLikesMap.set(postId, current + amount);
        }
        
        // Process posts
        const posts = [];
        
        for (const event of events.slice(-50)) {
            const block = await event.getBlock();
            posts.push({
                id: event.args.postId.toString(),
                type: 'post',
                author: event.args.author,
                content: event.args.content,
                mediaCID: event.args.mediaCID,
                timestamp: block.timestamp,
                superLikes: superLikesMap.get(event.args.postId.toString()) || 0n,
                txHash: event.transactionHash
            });
        }
        
        for (const event of replyEvents.slice(-30)) {
            const block = await event.getBlock();
            posts.push({
                id: event.args.postId.toString(),
                type: 'reply',
                parentId: event.args.parentId.toString(),
                author: event.args.author,
                content: event.args.content,
                mediaCID: event.args.mediaCID,
                tipBkc: event.args.tipBkc,
                timestamp: block.timestamp,
                superLikes: superLikesMap.get(event.args.postId.toString()) || 0n,
                txHash: event.transactionHash
            });
        }
        
        for (const event of repostEvents.slice(-20)) {
            const block = await event.getBlock();
            posts.push({
                id: event.args.newPostId.toString(),
                type: 'repost',
                originalPostId: event.args.originalPostId.toString(),
                author: event.args.reposter,
                timestamp: block.timestamp,
                txHash: event.transactionHash
            });
        }
        
        posts.sort((a, b) => b.timestamp - a.timestamp);
        BC.posts = posts;
        
        BC.trendingPosts = [...posts]
            .filter(p => p.superLikes > 0n)
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
// ACTIONS
// ============================================================================

async function createPost() {
    const input = document.getElementById('bc-compose-input');
    const content = input?.value?.trim();
    
    if (!content) {
        showToast('Please write something', 'error');
        return;
    }
    
    if (content.length > 500) {
        showToast('Post too long (max 500 chars)', 'error');
        return;
    }
    
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    BC.isPosting = true;
    renderContent();
    
    try {
        const fee = BC.fees.post || await contract.calculateFee(50000);
        
        const tx = await contract.createPost(
            content,
            '',
            getOperatorAddress() || ethers.ZeroAddress,
            { value: fee }
        );
        
        showToast('Posting...', 'info');
        await tx.wait();
        
        showToast('Post created! 🎉', 'success');
        input.value = '';
        
        await loadPosts();
        
    } catch (e) {
        console.error('Post error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    } finally {
        BC.isPosting = false;
        renderContent();
    }
}

async function likePost(postId) {
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    try {
        const fee = BC.fees.like || await contract.calculateFee(55000);
        
        const tx = await contract.like(
            postId,
            getOperatorAddress() || ethers.ZeroAddress,
            0,
            { value: fee }
        );
        
        showToast('Liking...', 'info');
        await tx.wait();
        
        showToast('Liked! ❤️', 'success');
        
    } catch (e) {
        console.error('Like error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            if (e.message?.includes('AlreadyLiked')) {
                showToast('Already liked this post', 'warning');
            } else {
                showToast('Failed: ' + (e.reason || e.message), 'error');
            }
        }
    }
}

async function superLikePost(postId, amount) {
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    const ethAmount = ethers.parseEther(amount || '0.0001');
    
    try {
        const tx = await contract.superLike(
            postId,
            getOperatorAddress() || ethers.ZeroAddress,
            0,
            { value: ethAmount }
        );
        
        showToast('Super liking...', 'info');
        await tx.wait();
        
        showToast('Super Liked! ⭐', 'success');
        await loadPosts();
        
    } catch (e) {
        console.error('Super like error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    }
}

async function followUser(address) {
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    try {
        const fee = BC.fees.follow || await contract.calculateFee(45000);
        
        const tx = await contract.follow(
            address,
            getOperatorAddress() || ethers.ZeroAddress,
            0,
            { value: fee }
        );
        
        showToast('Following...', 'info');
        await tx.wait();
        
        BC.following.add(address.toLowerCase());
        showToast('Followed! 👥', 'success');
        renderContent();
        
    } catch (e) {
        console.error('Follow error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    }
}

async function withdrawEarnings() {
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    if (BC.pendingEth === 0n) {
        showToast('No earnings to withdraw', 'warning');
        return;
    }
    
    try {
        const tx = await contract.withdraw();
        
        showToast('Withdrawing...', 'info');
        await tx.wait();
        
        showToast(`Withdrawn ${formatETH(BC.pendingEth)} ETH! 💰`, 'success');
        BC.pendingEth = 0n;
        renderContent();
        
    } catch (e) {
        console.error('Withdraw error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderHeader() {
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
    
    return `
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${getInitials(State.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea 
                        id="bc-compose-input" 
                        class="bc-compose-textarea" 
                        placeholder="What's happening on-chain?" 
                        maxlength="500"
                        oninput="BackchatPage._updateCharCount(this)"
                    ></textarea>
                </div>
            </div>
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add image (coming soon)" disabled>
                        <i class="fa-solid fa-image"></i>
                    </button>
                    <button class="bc-compose-tool" title="Add GIF (coming soon)" disabled>
                        <i class="fa-solid fa-face-smile"></i>
                    </button>
                </div>
                <div class="bc-compose-right">
                    <span class="bc-char-count" id="bc-char-counter">0/500</span>
                    <span class="bc-compose-fee">${fee} ETH</span>
                    <button class="bc-post-btn" onclick="BackchatPage.createPost()" ${BC.isPosting ? 'disabled' : ''}>
                        ${BC.isPosting ? '<i class="fa-solid fa-spinner fa-spin"></i> Posting' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderPost(post, index = 0) {
    const isBoosted = false;
    const hasBadge = false;
    const superLikesETH = formatETH(post.superLikes);
    
    return `
        <div class="bc-post" data-post-id="${post.id}" style="animation-delay:${Math.min(index * 0.04, 0.4)}s">
            <div class="bc-post-top">
                <div class="bc-avatar ${isBoosted ? 'boosted' : ''}" onclick="BackchatPage.viewProfile('${post.author}')">
                    ${getInitials(post.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="BackchatPage.viewProfile('${post.author}')">${shortenAddress(post.author)}</span>
                        ${hasBadge ? '<i class="fa-solid fa-circle-check bc-verified-icon" title="Verified"></i>' : ''}
                        <span class="bc-post-time">· ${formatTimeAgo(post.timestamp)}</span>
                        ${post.superLikes > 0n ? `<span class="bc-trending-tag"><i class="fa-solid fa-bolt"></i> ${superLikesETH} ETH</span>` : ''}
                    </div>
                    ${post.type === 'reply' ? `<div class="bc-post-context">Replying to post #${post.parentId}</div>` : ''}
                    ${post.type === 'repost' ? `<div class="bc-post-context"><i class="fa-solid fa-retweet" style="margin-right:4px;"></i> Reposted #${post.originalPostId}</div>` : ''}
                </div>
            </div>
            
            ${post.content ? `<div class="bc-post-body">${escapeHtml(post.content)}</div>` : ''}
            
            ${post.mediaCID ? `
                <div class="bc-post-media">
                    <img src="${IPFS_GATEWAY}${post.mediaCID}" alt="Media" loading="lazy">
                </div>
            ` : ''}
            
            <div class="bc-actions">
                <button class="bc-action act-reply" onclick="BackchatPage.openReply('${post.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>
                </button>
                <button class="bc-action act-repost" onclick="BackchatPage.repost('${post.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>
                </button>
                <button class="bc-action act-like" onclick="BackchatPage.like('${post.id}')" title="Like">
                    <i class="fa-regular fa-heart"></i>
                </button>
                <button class="bc-action act-super" onclick="BackchatPage.openSuperLike('${post.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
                <button class="bc-action act-tip" onclick="BackchatPage.openTip('${post.author}')" title="Tip BKC">
                    <i class="fa-solid fa-gift"></i>
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
                <div class="bc-empty-glyph">
                    <i class="fa-solid fa-wallet"></i>
                </div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and manage earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect Wallet
                </button>
            </div>
        `;
    }
    
    const userPosts = BC.posts.filter(p => p.author.toLowerCase() === State.userAddress?.toLowerCase());
    
    return `
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${BC.isBoosted ? 'boosted' : ''}">
                        ${getInitials(State.userAddress)}
                    </div>
                    <div class="bc-profile-actions">
                        ${!BC.hasBadge ? `
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBadge()">
                                <i class="fa-solid fa-circle-check"></i> Badge
                            </button>
                        ` : ''}
                        ${!BC.isBoosted ? `
                            <button class="bc-btn bc-btn-outline" onclick="BackchatPage.openBoost()">
                                <i class="fa-solid fa-rocket"></i> Boost
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${shortenAddress(State.userAddress)}</span>
                    ${BC.hasBadge ? '<i class="fa-solid fa-circle-check bc-profile-badge"></i>' : ''}
                    ${BC.isBoosted ? '<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted</span>' : ''}
                </div>
                
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
                        <div class="bc-stat-value">${BC.following.size}</div>
                        <div class="bc-stat-label">Following</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${formatETH(BC.pendingEth)}</div>
                        <div class="bc-stat-label">Earned (ETH)</div>
                    </div>
                    <div class="bc-stat-cell">
                        <div class="bc-stat-value">${BC.referralStats?.totalReferred || 0}</div>
                        <div class="bc-stat-label">Referrals</div>
                    </div>
                </div>
            </div>

            ${BC.pendingEth > 0n ? `
                <div class="bc-earnings-card">
                    <div class="bc-earnings-header">
                        <i class="fa-solid fa-coins"></i> Pending Earnings
                    </div>
                    <div class="bc-earnings-value">
                        ${formatETH(BC.pendingEth)} <small>ETH</small>
                    </div>
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
                ? `<div class="bc-empty" style="padding:40px 20px;">
                    <div class="bc-empty-text">No posts yet — share your first thought!</div>
                  </div>`
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
    
    switch (BC.activeTab) {
        case 'feed':
            content = renderCompose() + renderFeed();
            break;
        case 'trending':
            content = renderTrending();
            break;
        case 'profile':
            content = renderProfile();
            break;
    }
    
    container.innerHTML = content;
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
    document.getElementById('modal-superlike').classList.add('active');
}

async function confirmSuperLike() {
    const amount = document.getElementById('superlike-amount')?.value || '0.001';
    closeModal('superlike');
    await superLikePost(selectedPostForAction, amount);
}

function openBadge() {
    document.getElementById('modal-badge').classList.add('active');
}

async function confirmBadge() {
    closeModal('badge');
    
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    try {
        const tx = await contract.obtainBadge(
            getOperatorAddress() || ethers.ZeroAddress,
            { value: BC.fees.badge }
        );
        
        showToast('Getting badge...', 'info');
        await tx.wait();
        
        BC.hasBadge = true;
        showToast('Badge obtained! ✅', 'success');
        renderContent();
        
    } catch (e) {
        console.error('Badge error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    }
}

function openBoost() {
    document.getElementById('modal-boost').classList.add('active');
}

async function confirmBoost() {
    const amount = document.getElementById('boost-amount')?.value || '0.001';
    closeModal('boost');
    
    const contract = getSignedContract();
    if (!contract) {
        showToast('Please connect wallet', 'error');
        return;
    }
    
    try {
        const tx = await contract.boostProfile(
            getOperatorAddress() || ethers.ZeroAddress,
            { value: ethers.parseEther(amount) }
        );
        
        showToast('Boosting profile...', 'info');
        await tx.wait();
        
        BC.isBoosted = true;
        showToast('Profile boosted! 🚀', 'success');
        renderContent();
        
    } catch (e) {
        console.error('Boost error:', e);
        if (e.code !== 'ACTION_REJECTED') {
            showToast('Failed: ' + (e.reason || e.message), 'error');
        }
    }
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
    counter.textContent = `${len}/500`;
    counter.className = 'bc-char-count';
    if (len > 450) counter.classList.add('danger');
    else if (len > 350) counter.classList.add('warn');
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
            loadPosts()
        ]);
    },
    
    async refresh() {
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadPosts()
        ]);
    },
    
    setTab(tab) {
        BC.activeTab = tab;
        renderContent();
    },
    
    // Actions
    createPost,
    like: likePost,
    openSuperLike,
    confirmSuperLike,
    follow: followUser,
    withdraw: withdrawEarnings,
    
    // Modals
    openBadge,
    confirmBadge,
    openBoost,
    confirmBoost,
    closeModal,
    openEarnings() { BC.activeTab = 'profile'; renderContent(); },
    
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
    },

    // Navigation
    viewProfile(address) {
        showToast('Profile view coming soon!', 'info');
    },
    openReply(postId) {
        showToast('Reply coming soon!', 'info');
    },
    repost(postId) {
        showToast('Repost coming soon!', 'info');
    },
    openTip(address) {
        showToast('BKC Tips coming soon!', 'info');
    }
};

window.BackchatPage = BackchatPage;