// js/pages/BackchatPage.js
// ✅ PRODUCTION V6.9 - Complete Decentralized Social Network
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    BACKCHAT - Unstoppable Social Network
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE REDESIGN as full social network (not just DMs)
// - Feed with posts, replies, reposts
// - Trending by Super Likes (organic ranking)
// - Profile system with usernames, badges, boosts
// - Full engagement: like, super like, follow, tip
// - Modern V6.9 UI consistent with other pages
// - Event-based data loading from blockchain
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
import { addresses, ipfsGateway } from '../config.js';
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
// ABI - Backchat V7.0.0
// ============================================================================

const backchatABI = [
    // Profile
    "function createProfile(string calldata username, string calldata displayName, string calldata bio, address operator) external payable",
    "function updateProfile(string calldata displayName, string calldata bio) external",
    "function getUsernameFee(uint256 length) public pure returns (uint256)",
    "function isUsernameAvailable(string calldata username) external view returns (bool)",
    "function getUsernameOwner(string calldata username) external view returns (address)",
    
    // Content
    "function createPost(string calldata content, string calldata mediaCID, address operator) external payable returns (uint256 postId)",
    "function createReply(uint256 parentId, string calldata content, string calldata mediaCID, address operator, uint256 tipBkc) external payable returns (uint256 postId)",
    "function createRepost(uint256 originalPostId, address operator, uint256 tipBkc) external payable returns (uint256 postId)",
    
    // Engagement
    "function like(uint256 postId, address operator, uint256 tipBkc) external payable",
    "function superLike(uint256 postId, address operator, uint256 tipBkc) external payable",
    "function follow(address toFollow, address operator, uint256 tipBkc) external payable",
    "function unfollow(address toUnfollow) external",
    
    // Premium
    "function boostProfile(address operator) external payable",
    "function obtainBadge(address operator) external payable",
    
    // View
    "function getCurrentFees() external view returns (uint256 postFee, uint256 replyFee, uint256 likeFee, uint256 followFee, uint256 repostFee, uint256 superLikeMin, uint256 boostMin, uint256 badgeFee_)",
    "function isProfileBoosted(address user) external view returns (bool)",
    "function hasTrustBadge(address user) external view returns (bool)",
    "function hasUserLiked(uint256 postId, address user) external view returns (bool)",
    "function getPendingBalance(address user) external view returns (uint256)",
    "function postAuthor(uint256 postId) external view returns (address)",
    "function postCounter() external view returns (uint256)",
    "function boostExpiry(address user) external view returns (uint256)",
    "function badgeExpiry(address user) external view returns (uint256)",
    
    // Withdrawal
    "function withdraw() external",
    "function pendingEth(address user) external view returns (uint256)",
    
    // Events
    "event ProfileCreated(address indexed user, bytes32 indexed usernameHash, string username, string displayName, string bio, uint256 ethPaid, address indexed operator)",
    "event PostCreated(uint256 indexed postId, address indexed author, string content, string mediaCID, address indexed operator)",
    "event ReplyCreated(uint256 indexed postId, uint256 indexed parentId, address indexed author, string content, string mediaCID, uint256 tipBkc, address operator)",
    "event RepostCreated(uint256 indexed newPostId, uint256 indexed originalPostId, address indexed reposter, uint256 tipBkc, address operator)",
    "event Liked(uint256 indexed postId, address indexed user, uint256 tipBkc, address indexed operator)",
    "event SuperLiked(uint256 indexed postId, address indexed user, uint256 ethAmount, uint256 tipBkc, address indexed operator)",
    "event Followed(address indexed follower, address indexed followed, uint256 tipBkc, address indexed operator)",
    "event Unfollowed(address indexed follower, address indexed followed)",
    "event ProfileBoosted(address indexed user, uint256 amount, uint256 expiresAt, address indexed operator)",
    "event BadgeObtained(address indexed user, uint256 expiresAt, address indexed operator)"
];

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
    activeTab: 'feed',       // feed | trending | profile | messages | notifications
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
    
    // Loading
    isLoading: false,
    isPosting: false,
    contractAvailable: true,
    error: null
};

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('backchat-styles-v69')) return;
    const style = document.createElement('style');
    style.id = 'backchat-styles-v69';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Backchat - Decentralized Social Network Styles
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-6px); } 
        }
        @keyframes pulse-glow { 
            0%, 100% { box-shadow: 0 0 15px rgba(245,158,11,0.2); } 
            50% { box-shadow: 0 0 30px rgba(245,158,11,0.4); } 
        }
        @keyframes like-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        .like-pop { animation: like-pop 0.3s ease-out; }
        .slide-up { animation: slide-up 0.3s ease-out; }
        
        /* Layout */
        .bc-container {
            max-width: 600px;
            margin: 0 auto;
            min-height: 100vh;
            background: #18181b;
            border-left: 1px solid rgba(63,63,70,0.5);
            border-right: 1px solid rgba(63,63,70,0.5);
        }
        
        /* Header */
        .bc-header {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(24,24,27,0.9);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(63,63,70,0.5);
            padding: 12px 16px;
        }
        
        .bc-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        
        .bc-logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .bc-logo-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
        }
        
        .bc-logo-text {
            font-size: 20px;
            font-weight: 800;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .bc-header-actions {
            display: flex;
            gap: 8px;
        }
        
        .bc-icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(63,63,70,0.5);
            border: none;
            color: #a1a1aa;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .bc-icon-btn:hover {
            background: rgba(63,63,70,0.8);
            color: #fff;
        }
        
        .bc-icon-btn.has-notification::after {
            content: '';
            position: absolute;
            top: 6px;
            right: 6px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
        }
        
        /* Tabs */
        .bc-tabs {
            display: flex;
            gap: 4px;
        }
        
        .bc-tab {
            flex: 1;
            padding: 10px 8px;
            background: none;
            border: none;
            color: #71717a;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .bc-tab:hover {
            color: #a1a1aa;
        }
        
        .bc-tab.active {
            color: #f59e0b;
            border-bottom-color: #f59e0b;
        }
        
        /* Compose Box */
        .bc-compose {
            padding: 16px;
            border-bottom: 1px solid rgba(63,63,70,0.5);
            background: rgba(24,24,27,0.5);
        }
        
        .bc-compose-input {
            width: 100%;
            min-height: 80px;
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            padding: 12px;
            color: #fafafa;
            font-size: 15px;
            resize: none;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .bc-compose-input:focus {
            border-color: rgba(245,158,11,0.5);
        }
        
        .bc-compose-input::placeholder {
            color: #71717a;
        }
        
        .bc-compose-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
        }
        
        .bc-compose-actions {
            display: flex;
            gap: 8px;
        }
        
        .bc-compose-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(63,63,70,0.3);
            border: none;
            color: #f59e0b;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bc-compose-btn:hover {
            background: rgba(245,158,11,0.2);
        }
        
        .bc-post-btn {
            padding: 10px 20px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            border-radius: 20px;
            color: #000;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bc-post-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(245,158,11,0.4);
        }
        
        .bc-post-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Post Card */
        .bc-post {
            padding: 16px;
            border-bottom: 1px solid rgba(63,63,70,0.3);
            transition: background 0.2s;
            cursor: pointer;
        }
        
        .bc-post:hover {
            background: rgba(39,39,42,0.3);
        }
        
        .bc-post-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .bc-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .bc-avatar.boosted {
            box-shadow: 0 0 0 2px #18181b, 0 0 0 4px #f59e0b;
        }
        
        .bc-post-meta {
            flex: 1;
            min-width: 0;
        }
        
        .bc-post-author {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        .bc-username {
            font-weight: 700;
            color: #fafafa;
            font-size: 15px;
        }
        
        .bc-badge {
            color: #f59e0b;
            font-size: 14px;
        }
        
        .bc-handle {
            color: #71717a;
            font-size: 14px;
        }
        
        .bc-time {
            color: #52525b;
            font-size: 13px;
        }
        
        .bc-post-content {
            margin-top: 8px;
            margin-left: 56px;
            color: #e4e4e7;
            font-size: 15px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .bc-post-media {
            margin-top: 12px;
            margin-left: 56px;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(63,63,70,0.5);
        }
        
        .bc-post-media img {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
        }
        
        /* Engagement Bar */
        .bc-engagement {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
            margin-left: 56px;
            max-width: 400px;
        }
        
        .bc-engage-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: none;
            border: none;
            border-radius: 20px;
            color: #71717a;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bc-engage-btn:hover {
            background: rgba(63,63,70,0.3);
        }
        
        .bc-engage-btn.reply:hover { color: #3b82f6; background: rgba(59,130,246,0.1); }
        .bc-engage-btn.repost:hover { color: #22c55e; background: rgba(34,197,94,0.1); }
        .bc-engage-btn.like:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .bc-engage-btn.like.liked { color: #ef4444; }
        .bc-engage-btn.super:hover { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .bc-engage-btn.tip:hover { color: #8b5cf6; background: rgba(139,92,246,0.1); }
        
        /* Trending Badge */
        .bc-trending-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: rgba(245,158,11,0.15);
            border: 1px solid rgba(245,158,11,0.3);
            border-radius: 12px;
            color: #f59e0b;
            font-size: 11px;
            font-weight: 600;
        }
        
        /* Profile Card */
        .bc-profile-card {
            padding: 20px 16px;
            border-bottom: 1px solid rgba(63,63,70,0.5);
        }
        
        .bc-profile-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .bc-profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 700;
            color: #000;
        }
        
        .bc-profile-avatar.boosted {
            box-shadow: 0 0 0 3px #18181b, 0 0 0 6px #f59e0b;
        }
        
        .bc-profile-info {
            margin-top: 16px;
        }
        
        .bc-profile-name {
            font-size: 20px;
            font-weight: 800;
            color: #fafafa;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .bc-profile-handle {
            color: #71717a;
            font-size: 14px;
            margin-top: 2px;
        }
        
        .bc-profile-bio {
            color: #a1a1aa;
            font-size: 14px;
            margin-top: 12px;
            line-height: 1.5;
        }
        
        .bc-profile-stats {
            display: flex;
            gap: 20px;
            margin-top: 16px;
        }
        
        .bc-profile-stat {
            display: flex;
            gap: 4px;
            font-size: 14px;
        }
        
        .bc-profile-stat-value {
            font-weight: 700;
            color: #fafafa;
        }
        
        .bc-profile-stat-label {
            color: #71717a;
        }
        
        /* Buttons */
        .bc-btn {
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        
        .bc-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
        }
        
        .bc-btn-primary:hover {
            box-shadow: 0 4px 15px rgba(245,158,11,0.4);
        }
        
        .bc-btn-secondary {
            background: transparent;
            border: 1px solid rgba(63,63,70,0.8);
            color: #fafafa;
        }
        
        .bc-btn-secondary:hover {
            background: rgba(63,63,70,0.5);
        }
        
        .bc-btn-follow {
            background: #fafafa;
            color: #000;
        }
        
        .bc-btn-following {
            background: transparent;
            border: 1px solid rgba(63,63,70,0.8);
            color: #fafafa;
        }
        
        /* Modal */
        .bc-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        
        .bc-modal.active {
            display: flex;
        }
        
        .bc-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98), rgba(24,24,27,0.99));
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .bc-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid rgba(63,63,70,0.5);
        }
        
        .bc-modal-title {
            font-size: 18px;
            font-weight: 700;
            color: #fafafa;
        }
        
        .bc-modal-close {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(63,63,70,0.5);
            border: none;
            color: #a1a1aa;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .bc-modal-close:hover {
            background: rgba(63,63,70,0.8);
            color: #fff;
        }
        
        .bc-modal-body {
            padding: 16px;
        }
        
        /* Input */
        .bc-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(39,39,42,0.5);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            color: #fafafa;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .bc-input:focus {
            border-color: rgba(245,158,11,0.5);
        }
        
        .bc-input-group {
            margin-bottom: 16px;
        }
        
        .bc-input-label {
            display: block;
            margin-bottom: 8px;
            color: #a1a1aa;
            font-size: 13px;
            font-weight: 600;
        }
        
        /* Fee Display */
        .bc-fee {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: rgba(245,158,11,0.1);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 12px;
            margin-top: 16px;
        }
        
        .bc-fee-label {
            color: #f59e0b;
            font-size: 13px;
        }
        
        .bc-fee-value {
            color: #fafafa;
            font-weight: 700;
            font-size: 14px;
        }
        
        /* Empty State */
        .bc-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        
        .bc-empty-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(63,63,70,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }
        
        .bc-empty-icon i {
            font-size: 32px;
            color: #52525b;
        }
        
        .bc-empty-title {
            font-size: 18px;
            font-weight: 700;
            color: #fafafa;
            margin-bottom: 8px;
        }
        
        .bc-empty-text {
            color: #71717a;
            font-size: 14px;
            max-width: 300px;
        }
        
        /* Earnings Card */
        .bc-earnings {
            margin: 16px;
            padding: 16px;
            background: linear-gradient(145deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 16px;
        }
        
        .bc-earnings-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #22c55e;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .bc-earnings-amount {
            font-size: 28px;
            font-weight: 800;
            color: #fafafa;
        }
        
        .bc-earnings-amount span {
            font-size: 16px;
            color: #71717a;
        }
        
        /* Loading */
        .bc-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }
        
        .bc-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(63,63,70,0.5);
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 640px) {
            .bc-container {
                border: none;
            }
            .bc-engagement {
                margin-left: 0;
                margin-top: 16px;
            }
            .bc-post-content {
                margin-left: 0;
                margin-top: 12px;
            }
            .bc-post-media {
                margin-left: 0;
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

// ============================================================================
// CONTRACT INTERACTION
// ============================================================================

function getContract() {
    // First check if contract exists in State (initialized by app.js)
    if (State.backchatContract) return State.backchatContract;
    if (State.backchatContractPublic) return State.backchatContractPublic;
    
    // Otherwise try to create from address
    const backchatAddress = getBackchatAddress();
    if (!backchatAddress) {
        console.warn('Backchat address not found in deployment-addresses.json');
        return null;
    }
    
    // Use public provider if available
    if (State.publicProvider) {
        return new ethers.Contract(backchatAddress, backchatABI, State.publicProvider);
    }
    
    return null;
}

function getSignedContract() {
    // First check State
    if (State.backchatContract) return State.backchatContract;
    
    // Try to create signed contract
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
        
        const [pending, hasBadge, isBoosted, boostExp, badgeExp] = await Promise.all([
            contract.getPendingBalance(State.userAddress).catch(() => 0n),
            contract.hasTrustBadge(State.userAddress).catch(() => false),
            contract.isProfileBoosted(State.userAddress).catch(() => false),
            contract.boostExpiry(State.userAddress).catch(() => 0),
            contract.badgeExpiry(State.userAddress).catch(() => 0)
        ]);
        
        BC.pendingEth = pending;
        BC.hasBadge = hasBadge;
        BC.isBoosted = isBoosted;
        BC.boostExpiry = Number(boostExp);
        BC.badgeExpiry = Number(badgeExp);
    } catch (e) {
        console.warn('Failed to load user status:', e.message);
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
        
        // Also load replies
        const replyFilter = contract.filters.ReplyCreated();
        const replyEvents = await contract.queryFilter(replyFilter, -10000);
        
        // Also load reposts
        const repostFilter = contract.filters.RepostCreated();
        const repostEvents = await contract.queryFilter(repostFilter, -10000);
        
        // Also load super likes for trending
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
        
        // Process replies
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
        
        // Process reposts
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
        
        // Sort by timestamp (newest first)
        posts.sort((a, b) => b.timestamp - a.timestamp);
        BC.posts = posts;
        
        // Build trending list
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
            '', // mediaCID - empty for now
            getOperatorAddress() || ethers.ZeroAddress,
            { value: fee }
        );
        
        showToast('Posting...', 'info');
        await tx.wait();
        
        showToast('Post created! 🎉', 'success');
        input.value = '';
        
        // Reload posts
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
            0, // tipBkc
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
            0, // tipBkc
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
            0, // tipBkc
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
            <div class="bc-header-top">
                <div class="bc-logo">
                    <img src="assets/backchat.png" alt="Backchat" class="bc-logo-icon" onerror="this.style.display='none'">
                    <span class="bc-logo-text">Backchat</span>
                </div>
                <div class="bc-header-actions">
                    ${State.isConnected && BC.pendingEth > 0n ? `
                        <button class="bc-icon-btn" onclick="BackchatPage.openEarnings()" title="Earnings: ${formatETH(BC.pendingEth)} ETH">
                            <i class="fa-solid fa-coins" style="color:#22c55e"></i>
                        </button>
                    ` : ''}
                    <button class="bc-icon-btn" onclick="BackchatPage.refresh()">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            </div>
            <div class="bc-tabs">
                <button class="bc-tab ${BC.activeTab === 'feed' ? 'active' : ''}" onclick="BackchatPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-tab ${BC.activeTab === 'trending' ? 'active' : ''}" onclick="BackchatPage.setTab('trending')">
                    <i class="fa-solid fa-fire"></i> Trending
                </button>
                <button class="bc-tab ${BC.activeTab === 'profile' ? 'active' : ''}" onclick="BackchatPage.setTab('profile')">
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
            <textarea id="bc-compose-input" class="bc-compose-input" placeholder="What's happening?" maxlength="500"></textarea>
            <div class="bc-compose-footer">
                <div class="bc-compose-actions">
                    <button class="bc-compose-btn" title="Add image (coming soon)" disabled>
                        <i class="fa-solid fa-image"></i>
                    </button>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="color:#71717a;font-size:12px;">${fee} ETH fee</span>
                    <button class="bc-post-btn" onclick="BackchatPage.createPost()" ${BC.isPosting ? 'disabled' : ''}>
                        ${BC.isPosting ? '<i class="fa-solid fa-spinner fa-spin"></i>' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderPost(post) {
    const isBoosted = false; // Would need to check from contract
    const hasBadge = false;  // Would need to check from contract
    const superLikesETH = formatETH(post.superLikes);
    
    return `
        <div class="bc-post slide-up" data-post-id="${post.id}">
            <div class="bc-post-header">
                <div class="bc-avatar ${isBoosted ? 'boosted' : ''}" onclick="BackchatPage.viewProfile('${post.author}')">
                    ${getInitials(post.author)}
                </div>
                <div class="bc-post-meta">
                    <div class="bc-post-author">
                        <span class="bc-username">${shortenAddress(post.author)}</span>
                        ${hasBadge ? '<i class="fa-solid fa-circle-check bc-badge" title="Verified"></i>' : ''}
                        ${post.superLikes > 0n ? `<span class="bc-trending-badge"><i class="fa-solid fa-fire"></i> ${superLikesETH} ETH</span>` : ''}
                    </div>
                    <div class="bc-handle">
                        <span class="bc-time">${formatTimeAgo(post.timestamp)}</span>
                        ${post.type === 'reply' ? `<span style="margin-left:4px;">· Replying to #${post.parentId}</span>` : ''}
                        ${post.type === 'repost' ? `<span style="margin-left:4px;">· Reposted #${post.originalPostId}</span>` : ''}
                    </div>
                </div>
            </div>
            
            ${post.content ? `<div class="bc-post-content">${escapeHtml(post.content)}</div>` : ''}
            
            ${post.mediaCID ? `
                <div class="bc-post-media">
                    <img src="${IPFS_GATEWAY}${post.mediaCID}" alt="Media" loading="lazy">
                </div>
            ` : ''}
            
            <div class="bc-engagement">
                <button class="bc-engage-btn reply" onclick="BackchatPage.openReply('${post.id}')">
                    <i class="fa-regular fa-comment"></i>
                </button>
                <button class="bc-engage-btn repost" onclick="BackchatPage.repost('${post.id}')">
                    <i class="fa-solid fa-retweet"></i>
                </button>
                <button class="bc-engage-btn like" onclick="BackchatPage.like('${post.id}')">
                    <i class="fa-regular fa-heart"></i>
                </button>
                <button class="bc-engage-btn super" onclick="BackchatPage.openSuperLike('${post.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>
                </button>
                <button class="bc-engage-btn tip" onclick="BackchatPage.openTip('${post.author}')" title="Tip BKC">
                    <i class="fa-solid fa-gift"></i>
                </button>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderFeed() {
    // Contract not available - show coming soon
    if (!BC.contractAvailable) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-icon" style="background:rgba(245,158,11,0.2);">
                    <i class="fa-solid fa-rocket" style="color:#f59e0b;"></i>
                </div>
                <div class="bc-empty-title">Coming Soon!</div>
                <div class="bc-empty-text">
                    ${BC.error || 'Backchat is being deployed. The unstoppable social network will be live soon!'}
                </div>
                <button class="bc-btn bc-btn-secondary" style="margin-top:20px;" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-rotate"></i> Retry
                </button>
            </div>
        `;
    }
    
    if (BC.isLoading) {
        return `
            <div class="bc-loading">
                <div class="bc-spinner"></div>
            </div>
        `;
    }
    
    if (BC.posts.length === 0) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-icon">
                    <i class="fa-solid fa-message"></i>
                </div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post on Backchat!</div>
            </div>
        `;
    }
    
    return BC.posts.map(post => renderPost(post)).join('');
}

function renderTrending() {
    if (BC.trendingPosts.length === 0) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-icon">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <div class="bc-empty-title">No trending posts</div>
                <div class="bc-empty-text">Super Like posts to make them trend!</div>
            </div>
        `;
    }
    
    return `
        <div style="padding:16px;border-bottom:1px solid rgba(63,63,70,0.5);">
            <h2 style="color:#f59e0b;font-size:16px;font-weight:700;">
                <i class="fa-solid fa-fire"></i> Trending by Super Likes
            </h2>
            <p style="color:#71717a;font-size:13px;margin-top:4px;">
                Posts ranked by total ETH from Super Likes
            </p>
        </div>
        ${BC.trendingPosts.map(post => renderPost(post)).join('')}
    `;
}

function renderProfile() {
    if (!State.isConnected) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-icon">
                    <i class="fa-solid fa-wallet"></i>
                </div>
                <div class="bc-empty-title">Connect Wallet</div>
                <div class="bc-empty-text">Connect your wallet to view your profile and earnings.</div>
                <button class="bc-btn bc-btn-primary" style="margin-top:20px;" onclick="window.openConnectModal && window.openConnectModal()">
                    <i class="fa-solid fa-wallet"></i> Connect
                </button>
            </div>
        `;
    }
    
    return `
        <div class="bc-profile-card">
            <div class="bc-profile-header">
                <div class="bc-profile-avatar ${BC.isBoosted ? 'boosted' : ''}">
                    ${getInitials(State.userAddress)}
                </div>
                <div style="display:flex;gap:8px;">
                    ${!BC.hasBadge ? `
                        <button class="bc-btn bc-btn-secondary" onclick="BackchatPage.openBadge()">
                            <i class="fa-solid fa-circle-check"></i> Get Badge
                        </button>
                    ` : ''}
                    ${!BC.isBoosted ? `
                        <button class="bc-btn bc-btn-secondary" onclick="BackchatPage.openBoost()">
                            <i class="fa-solid fa-rocket"></i> Boost
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="bc-profile-info">
                <div class="bc-profile-name">
                    ${shortenAddress(State.userAddress)}
                    ${BC.hasBadge ? '<i class="fa-solid fa-circle-check bc-badge"></i>' : ''}
                    ${BC.isBoosted ? '<span class="bc-trending-badge"><i class="fa-solid fa-rocket"></i> Boosted</span>' : ''}
                </div>
                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${State.userAddress}" target="_blank" style="color:#71717a;text-decoration:none;">
                        View on Explorer <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i>
                    </a>
                </div>
            </div>
        </div>
        
        ${BC.pendingEth > 0n ? `
            <div class="bc-earnings">
                <div class="bc-earnings-title">
                    <i class="fa-solid fa-coins"></i> Pending Earnings
                </div>
                <div class="bc-earnings-amount">
                    ${formatETH(BC.pendingEth)} <span>ETH</span>
                </div>
                <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.withdraw()">
                    <i class="fa-solid fa-wallet"></i> Withdraw Earnings
                </button>
            </div>
        ` : ''}
        
        <div style="padding:16px;">
            <h3 style="color:#a1a1aa;font-size:14px;font-weight:600;margin-bottom:12px;">
                <i class="fa-solid fa-clock-rotate-left"></i> Your Posts
            </h3>
            ${BC.posts.filter(p => p.author.toLowerCase() === State.userAddress?.toLowerCase()).length === 0 
                ? '<p style="color:#52525b;font-size:13px;">No posts yet. Share your first thought!</p>'
                : BC.posts.filter(p => p.author.toLowerCase() === State.userAddress?.toLowerCase()).map(p => renderPost(p)).join('')
            }
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
        <div class="bc-modal" id="modal-superlike">
            <div class="bc-modal-content">
                <div class="bc-modal-header">
                    <span class="bc-modal-title"><i class="fa-solid fa-star" style="color:#f59e0b"></i> Super Like</span>
                    <button class="bc-modal-close" onclick="BackchatPage.closeModal('superlike')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-body">
                    <p style="color:#a1a1aa;font-size:14px;margin-bottom:16px;">
                        Super Likes boost posts to trending. The more ETH, the higher it ranks!
                    </p>
                    <div class="bc-input-group">
                        <label class="bc-input-label">Amount (ETH)</label>
                        <input type="number" id="superlike-amount" class="bc-input" value="0.001" min="0.0001" step="0.0001">
                    </div>
                    <div class="bc-fee">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-value">0.0001 ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.confirmSuperLike()">
                        <i class="fa-solid fa-star"></i> Super Like
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Badge Modal -->
        <div class="bc-modal" id="modal-badge">
            <div class="bc-modal-content">
                <div class="bc-modal-header">
                    <span class="bc-modal-title"><i class="fa-solid fa-circle-check" style="color:#f59e0b"></i> Trust Badge</span>
                    <button class="bc-modal-close" onclick="BackchatPage.closeModal('badge')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-body">
                    <p style="color:#a1a1aa;font-size:14px;margin-bottom:16px;">
                        Get a verified badge for 1 year. Shows you're a trusted member of the community.
                    </p>
                    <div class="bc-fee">
                        <span class="bc-fee-label">Badge Fee</span>
                        <span class="bc-fee-value">${formatETH(BC.fees.badge)} ETH</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.confirmBadge()">
                        <i class="fa-solid fa-circle-check"></i> Get Badge (1 Year)
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Boost Modal -->
        <div class="bc-modal" id="modal-boost">
            <div class="bc-modal-content">
                <div class="bc-modal-header">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:#f59e0b"></i> Profile Boost</span>
                    <button class="bc-modal-close" onclick="BackchatPage.closeModal('boost')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="bc-modal-body">
                    <p style="color:#a1a1aa;font-size:14px;margin-bottom:16px;">
                        Boost your profile visibility. 1 day boost per 0.0005 ETH.
                    </p>
                    <div class="bc-input-group">
                        <label class="bc-input-label">Amount (ETH)</label>
                        <input type="number" id="boost-amount" class="bc-input" value="0.001" min="0.0005" step="0.0005">
                    </div>
                    <div class="bc-fee">
                        <span class="bc-fee-label">Minimum</span>
                        <span class="bc-fee-value">0.0005 ETH (1 day)</span>
                    </div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;" onclick="BackchatPage.confirmBoost()">
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
        <div class="bc-container">
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
    
    // Navigation
    viewProfile(address) {
        // TODO: Implement profile viewing
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