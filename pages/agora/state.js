// pages/agora/state.js
// Agora V13 — Shared state, constants, and configuration
// ============================================================================

const ethers = window.ethers;

import { addresses } from '../../config.js';
import { State } from '../../state.js';

// ============================================================================
// CONSTANTS
// ============================================================================

export const EXPLORER_ADDRESS = "https://opbnbscan.com/address/";
export const EXPLORER_TX = "https://opbnbscan.com/tx/";

export const CONTENT_LIMITS = {
    default:  2000,
    verified: 5000,
    premium:  20000,
    elite:    50000,
};

// Sepolia deploy block for V12 contracts (deployed 2026-02-21).
// All Agora events exist after this block. Using a fixed fromBlock avoids
// massive eth_getLogs ranges that public RPCs reject silently.
export const DEPLOY_BLOCK = 10_313_523;
export const EVENTS_LOOKBACK = DEPLOY_BLOCK;

export const TAGS = [
    { id: 0,  name: 'General',   icon: 'fa-globe',             color: '#8b8b9e' },
    { id: 1,  name: 'News',      icon: 'fa-newspaper',         color: '#f59e0b' },
    { id: 2,  name: 'Politics',  icon: 'fa-landmark-dome',     color: '#6366f1' },
    { id: 3,  name: 'Comedy',    icon: 'fa-face-laugh-squint', color: '#facc15' },
    { id: 4,  name: 'Sports',    icon: 'fa-futbol',            color: '#fb923c' },
    { id: 5,  name: 'Crypto',    icon: 'fa-bitcoin-sign',      color: '#f7931a' },
    { id: 6,  name: 'Tech',      icon: 'fa-microchip',         color: '#3b82f6' },
    { id: 7,  name: 'Art',       icon: 'fa-palette',           color: '#f472b6' },
    { id: 8,  name: 'Music',     icon: 'fa-music',             color: '#a78bfa' },
    { id: 9,  name: 'Gaming',    icon: 'fa-gamepad',           color: '#ec4899' },
    { id: 10, name: 'Business',  icon: 'fa-briefcase',         color: '#10b981' },
    { id: 11, name: 'Education', icon: 'fa-graduation-cap',    color: '#14b8a6' },
    { id: 12, name: 'Lifestyle', icon: 'fa-heart',             color: '#e879f9' },
    { id: 13, name: 'Adult',     icon: 'fa-fire',              color: '#ef4444' },
    { id: 14, name: 'Random',    icon: 'fa-shuffle',           color: '#6b7280' }
];

export const LANGUAGES = [
    { code: 'en', name: 'English',    flag: '\u{1F1FA}\u{1F1F8}' },
    { code: 'pt', name: 'Portugu\u00EAs',  flag: '\u{1F1E7}\u{1F1F7}' },
    { code: 'es', name: 'Espa\u00F1ol',    flag: '\u{1F1EA}\u{1F1F8}' },
    { code: 'fr', name: 'Fran\u00E7ais',   flag: '\u{1F1EB}\u{1F1F7}' },
    { code: 'de', name: 'Deutsch',    flag: '\u{1F1E9}\u{1F1EA}' },
    { code: 'zh', name: '\u4E2D\u6587',       flag: '\u{1F1E8}\u{1F1F3}' },
    { code: 'ja', name: '\u65E5\u672C\u8A9E',     flag: '\u{1F1EF}\u{1F1F5}' },
    { code: 'ko', name: '\uD55C\uAD6D\uC5B4',     flag: '\u{1F1F0}\u{1F1F7}' },
    { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',    flag: '\u{1F1F7}\u{1F1FA}' },
    { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',    flag: '\u{1F1F8}\u{1F1E6}' },
    { code: 'hi', name: '\u0939\u093F\u0928\u094D\u0926\u0940',     flag: '\u{1F1EE}\u{1F1F3}' },
    { code: 'tr', name: 'T\u00FCrk\u00E7e',     flag: '\u{1F1F9}\u{1F1F7}' },
];

export const MEDIA_LIMITS = {
    image: { max: 10 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], label: '10MB' },
    video: { max: 100 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/ogg'], label: '100MB' }
};

export const GALLERY_MAX_ITEMS = 10;

export const bkcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// ============================================================================
// STATE
// ============================================================================

export const BC = {
    // Navigation
    view: 'feed',
    activeTab: 'feed',
    viewHistory: [],
    // Posts
    posts: [],
    trendingPosts: [],
    allItems: [],
    replies: new Map(),
    likesMap: new Map(),
    replyCountMap: new Map(),
    repostCountMap: new Map(),
    postsById: new Map(),
    // Profile
    userProfile: null,
    profiles: new Map(),
    hasProfile: null,
    // Social graph
    following: new Set(),
    followers: new Set(),
    followCounts: new Map(),
    // Media (multi-upload)
    pendingMedia: [],  // Array of { file, preview, type: 'image'|'video' }
    isUploadingImage: false,
    // Legacy single-media (keep for backward compat)
    pendingImage: null,
    pendingImagePreview: null,
    pendingMediaType: null,
    // View state
    selectedPost: null,
    selectedProfile: null,
    // Wizard
    wizStep: 1,
    wizUsername: '',
    wizDisplayName: '',
    wizBio: '',
    wizUsernameOk: null,
    wizFee: null,
    wizChecking: false,
    wizLanguage: navigator.language?.slice(0, 2) || 'en',
    // Fees
    fees: { post: 0n, reply: 0n, like: 0n, follow: 0n, repost: 0n, downvote: 0n, boostStd: 0n, boostFeat: 0n, badge: 0n },
    // User status
    hasBadge: false,
    badgeTier: 0,
    isBoosted: false,
    boostExpiry: 0,
    badgeExpiry: 0,
    blockedAuthors: new Set(),
    // Filters
    selectedTag: -1,
    selectedLanguage: null,
    composeTag: 0,
    // Infinite scroll & feed mode
    feedPage: 0,
    feedMode: 'tiktok',  // 'list' | 'tiktok'
    // Stats
    globalStats: null,
    // UI flags
    isLoading: false,
    isPosting: false,
    contractAvailable: true,
    error: null,
    // Live Streaming
    liveStream: null,
    isLive: false,
    liveViewerCount: 0,
    activeRooms: new Map(),
    watchingStreamId: null,
    // Action Cart (batch actions)
    actionCart: [],        // { type: 'like'|'follow'|'downvote', targetId, label }
    cartVisible: false,
    cartSubmitting: false,
    // Render callback — set by AgoraPage.js orchestrator
    _render: () => {}
};

// ============================================================================
// HELPERS
// ============================================================================

export function getMaxContent() {
    if (!BC.hasBadge) return CONTENT_LIMITS.default;
    if (BC.badgeTier >= 2) return CONTENT_LIMITS.elite;
    if (BC.badgeTier >= 1) return CONTENT_LIMITS.premium;
    return CONTENT_LIMITS.verified;
}

export function getAgoraAddress() {
    return addresses.agora || addresses.backchat || addresses.Backchat || null;
}

export function getOperatorAddress() {
    return addresses.operator || addresses.treasury || null;
}

export function formatExpiry(timestampSec) {
    if (!timestampSec || timestampSec === 0) return '';
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestampSec - now;
    if (remaining <= 0) return '(expired)';
    const days = Math.floor(remaining / 86400);
    if (days > 0) return `(${days}d left)`;
    const hours = Math.floor(remaining / 3600);
    return `(${hours}h left)`;
}

export function renderExpiryWarnings() {
    const now = Math.floor(Date.now() / 1000);
    let html = '';
    if (BC.isBoosted && BC.boostExpiry > 0) {
        const daysLeft = Math.floor((BC.boostExpiry - now) / 86400);
        if (daysLeft <= 7 && daysLeft > 0) {
            html += `<div style="padding:8px 16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:8px;margin-top:8px;font-size:12px;color:var(--bc-accent);display:flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-clock"></i> Boost expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} —
                <button class="bc-btn bc-btn-primary" style="padding:4px 12px;font-size:11px;" onclick="AgoraPage.openBoost()">Renew</button>
            </div>`;
        }
    }
    if (BC.hasBadge && BC.badgeExpiry > 0) {
        const daysLeft = Math.floor((BC.badgeExpiry - now) / 86400);
        if (daysLeft <= 30 && daysLeft > 0) {
            html += `<div style="padding:8px 16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:8px;margin-top:8px;font-size:12px;color:var(--bc-accent);display:flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-clock"></i> Badge expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} —
                <button class="bc-btn bc-btn-primary" style="padding:4px 12px;font-size:11px;" onclick="AgoraPage.openBadge()">Renew</button>
            </div>`;
        }
    }
    return html;
}
