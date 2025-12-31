// js/pages/CharityPage.js
// ✅ PRODUCTION V2.0 - Charity Pool with Shareable Campaign Pages & Full Functionality

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import {
    loadCharityStats,
    loadCampaigns,
    loadCampaignDetails,
    loadUserCampaigns,
    loadUserDonations,
    clearCharityCache
} from '../modules/charity-data.js';
import {
    executeCreateCampaign,
    executeDonate,
    executeCancelCampaign,
    executeWithdraw
} from '../modules/charity-transactions.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80";
const SHARE_BASE_URL = window.location.origin;

// Categories Configuration
const CATEGORIES = {
    animal: {
        id: 'animal',
        name: 'Animal Help',
        nameShort: 'Animals',
        icon: 'fa-paw',
        color: 'emerald',
        colorHex: '#10b981',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 to-teal-500/10',
        description: 'Support animal shelters, rescue operations, veterinary care, and wildlife conservation.',
        emoji: '🐾'
    },
    humanitarian: {
        id: 'humanitarian',
        name: 'Humanitarian Help',
        nameShort: 'Humanitarian',
        icon: 'fa-hand-holding-medical',
        color: 'pink',
        colorHex: '#f472b6',
        gradient: 'from-pink-500 to-rose-500',
        bgGradient: 'from-pink-500/20 to-rose-500/10',
        description: 'Support disaster relief, medical emergencies, education, and community development.',
        emoji: '💗'
    }
};

// Campaign Status
const STATUS = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    WITHDRAWN: 3
};

const STATUS_LABELS = {
    [STATUS.ACTIVE]: { label: 'Active', color: 'green', icon: 'fa-circle-play', class: 'active' },
    [STATUS.COMPLETED]: { label: 'Completed', color: 'blue', icon: 'fa-circle-check', class: 'completed' },
    [STATUS.CANCELLED]: { label: 'Cancelled', color: 'red', icon: 'fa-circle-xmark', class: 'cancelled' },
    [STATUS.WITHDRAWN]: { label: 'Withdrawn', color: 'zinc', icon: 'fa-circle-dollar', class: 'withdrawn' }
};

// ============================================================================
// STATE
// ============================================================================
const Charity = {
    campaigns: [],
    userCampaigns: [],
    userDonations: [],
    globalStats: {
        totalRaised: 0n,
        totalCampaigns: 0,
        totalBurned: 0n,
        totalWithdrawals: 0
    },
    feeConfig: {
        miningFeeBips: 400,
        burnFeeBips: 100,
        ethFee: 0.001,
        penaltyBips: 1000
    },
    selectedCategory: null,
    currentView: 'main', // main, category, create, campaign-detail, my-campaigns
    currentCampaign: null,
    isLoading: false,
    lastFetch: 0
};

// ============================================================================
// CSS INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('charity-styles-v3')) return;
    
    const style = document.createElement('style');
    style.id = 'charity-styles-v3';
    style.textContent = `
/* ═══════════════════════════════════════════════════════════════════════════
   CHARITY PAGE STYLES V3.0 - Embedded CSS
   ═══════════════════════════════════════════════════════════════════════════ */

/* HERO SECTION */
.charity-hero {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(244, 114, 182, 0.08) 100%);
    border-radius: 1.25rem;
    padding: 2rem 1.5rem;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(82, 82, 91, 0.3);
}
.charity-hero::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
}

/* CATEGORY CARDS */
.charity-category-card {
    background: linear-gradient(145deg, rgba(39, 39, 42, 0.9), rgba(24, 24, 27, 0.95));
    border: 1px solid rgba(82, 82, 91, 0.5);
    border-radius: 1.25rem;
    padding: 2rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}
.charity-category-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.charity-category-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}
.charity-category-card:hover::before {
    opacity: 1;
}
.charity-category-card.animal::before {
    background: linear-gradient(90deg, #10b981, #14b8a6);
}
.charity-category-card.animal:hover {
    border-color: #10b981;
}
.charity-category-card.humanitarian::before {
    background: linear-gradient(90deg, #f472b6, #fb7185);
}
.charity-category-card.humanitarian:hover {
    border-color: #f472b6;
}

/* ICON BOX */
.charity-icon-box {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
    font-size: 1.75rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.charity-category-card:hover .charity-icon-box {
    transform: scale(1.1);
}
.charity-icon-box.animal {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.1));
    color: #10b981;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
}
.charity-icon-box.humanitarian {
    background: linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(251, 113, 133, 0.1));
    color: #f472b6;
    box-shadow: 0 0 25px rgba(244, 114, 182, 0.15);
}

/* CAMPAIGN CARDS */
.campaign-card {
    background: rgba(39, 39, 42, 0.7);
    border: 1px solid rgba(82, 82, 91, 0.4);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
}
.campaign-card:hover {
    border-color: rgba(245, 158, 11, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.35);
}
.campaign-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
    background: linear-gradient(135deg, #27272a, #3f3f46);
}

/* PROGRESS BAR */
.campaign-progress {
    height: 6px;
    background: rgba(63, 63, 70, 0.6);
    border-radius: 3px;
    overflow: hidden;
}
.campaign-progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
}
.campaign-progress-fill.animal {
    background: linear-gradient(90deg, #10b981, #14b8a6);
}
.campaign-progress-fill.humanitarian {
    background: linear-gradient(90deg, #f472b6, #fb7185);
}

/* STATUS BADGES */
.charity-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}
.charity-status-badge.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.charity-status-badge.completed {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
}
.charity-status-badge.cancelled {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
}
.charity-status-badge.withdrawn {
    background: rgba(113, 113, 122, 0.15);
    color: #a1a1aa;
    border: 1px solid rgba(113, 113, 122, 0.3);
}

/* STAT CARDS */
.charity-stat {
    background: rgba(24, 24, 27, 0.6);
    border: 1px solid rgba(82, 82, 91, 0.3);
    border-radius: 0.875rem;
    padding: 1.25rem;
    text-align: center;
    transition: all 0.2s ease;
}
.charity-stat:hover {
    border-color: rgba(245, 158, 11, 0.3);
}

/* BUTTONS */
.charity-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
}
.charity-btn-primary {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
}
.charity-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
}
.charity-btn-primary:disabled {
    background: #3f3f46;
    color: #71717a;
    cursor: not-allowed;
}
.charity-btn-secondary {
    background: rgba(63, 63, 70, 0.5);
    color: #a1a1aa;
    border: 1px solid rgba(82, 82, 91, 0.5);
}
.charity-btn-secondary:hover {
    background: rgba(63, 63, 70, 0.8);
    color: #f4f4f5;
}
.charity-btn-donate {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
}
.charity-btn-donate:hover:not(:disabled) {
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
}
.charity-btn-info {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
}
.charity-btn-info:hover {
    background: rgba(59, 130, 246, 0.25);
}

/* MODAL */
.charity-modal {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    padding: 1rem;
}
.charity-modal.active {
    opacity: 1;
    visibility: visible;
}
.charity-modal-content {
    background: #18181b;
    border: 1px solid #3f3f46;
    border-radius: 1.25rem;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    transform: scale(0.95) translateY(10px);
    transition: transform 0.3s ease;
}
.charity-modal.active .charity-modal-content {
    transform: scale(1) translateY(0);
}

/* FORM INPUTS */
.charity-input {
    background: rgba(24, 24, 27, 0.8);
    border: 1px solid rgba(82, 82, 91, 0.5);
    border-radius: 0.625rem;
    padding: 0.875rem 1rem;
    color: #f4f4f5;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-size: 0.9375rem;
}
.charity-input:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.charity-input::placeholder {
    color: #71717a;
}
.charity-textarea {
    min-height: 100px;
    resize: vertical;
}

/* SHARE BUTTONS */
.share-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}
.share-btn.twitter { background: rgba(29, 161, 242, 0.2); color: #1da1f2; }
.share-btn.twitter:hover { background: #1da1f2; color: white; }
.share-btn.telegram { background: rgba(0, 136, 204, 0.2); color: #0088cc; }
.share-btn.telegram:hover { background: #0088cc; color: white; }
.share-btn.whatsapp { background: rgba(37, 211, 102, 0.2); color: #25d366; }
.share-btn.whatsapp:hover { background: #25d366; color: white; }
.share-btn.copy { background: rgba(113, 113, 122, 0.2); color: #a1a1aa; }
.share-btn.copy:hover { background: #3f3f46; color: white; }

/* UTILITIES */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* RESPONSIVE */
@media (max-width: 640px) {
    .charity-hero {
        padding: 1.5rem 1rem;
    }
    .charity-category-card {
        padding: 1.5rem;
    }
    .charity-icon-box {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
    }
}

/* ANIMATIONS */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* SKELETON LOADING */
.skeleton {
    background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 0.5rem;
}
@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* SCROLLBAR */
.charity-scroll::-webkit-scrollbar {
    width: 6px;
}
.charity-scroll::-webkit-scrollbar-track {
    background: transparent;
}
.charity-scroll::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 3px;
}
.charity-scroll::-webkit-scrollbar-thumb:hover {
    background: #52525b;
}
`;
    document.head.appendChild(style);
}

// ============================================================================
// URL / ROUTING
// ============================================================================
function getCampaignIdFromUrl() {
    const hash = window.location.hash;
    const match = hash.match(/charity\/campaign\/(\d+)/);
    return match ? match[1] : null;
}

function setCampaignUrl(campaignId) {
    window.location.hash = `charity/campaign/${campaignId}`;
}

function clearCampaignUrl() {
    window.location.hash = 'charity';
}

function getShareUrl(campaignId) {
    return `${SHARE_BASE_URL}/#charity/campaign/${campaignId}`;
}

// ============================================================================
// UTILITIES
// ============================================================================
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeRemaining(deadline) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return { text: 'Ended', ended: true };
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return { text: `${days}d ${hours}h left`, ended: false };
    if (hours > 0) return { text: `${hours}h left`, ended: false };
    
    const minutes = Math.floor((remaining % 3600) / 60);
    return { text: `${minutes}m left`, ended: false };
}

function formatBKC(value) {
    if (!value) return '0';
    try {
        const formatted = ethers.formatEther(value);
        const num = parseFloat(formatted);
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } catch {
        return '0';
    }
}

function formatAddress(addr) {
    if (!addr) return '...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function calculateProgress(raised, goal) {
    if (!goal || goal === 0n) return 0;
    try {
        const raisedNum = parseFloat(ethers.formatEther(raised || 0n));
        const goalNum = parseFloat(ethers.formatEther(goal));
        return Math.min((raisedNum / goalNum) * 100, 100);
    } catch {
        return 0;
    }
}

function isCampaignActive(campaign) {
    return campaign.status === STATUS.ACTIVE && Date.now() / 1000 < Number(campaign.deadline);
}

function canWithdraw(campaign, userAddress) {
    if (!campaign || !userAddress) return false;
    const now = Math.floor(Date.now() / 1000);
    const isCreator = campaign.creator?.toLowerCase() === userAddress.toLowerCase();
    const hasEnded = Number(campaign.deadline) <= now;
    const isActive = campaign.status === STATUS.ACTIVE;
    const hasFunds = BigInt(campaign.raisedAmount?.toString() || '0') > 0n;
    return isCreator && hasEnded && isActive && hasFunds;
}

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    const container = document.getElementById('charity');
    if (!container) return;
    
    injectStyles();
    
    // Check if URL has campaign ID - direct access to campaign
    const urlCampaignId = getCampaignIdFromUrl();
    if (urlCampaignId) {
        Charity.currentView = 'campaign-detail';
        renderCampaignDetailPage(urlCampaignId);
        return;
    }
    
    Charity.currentView = 'main';
    renderMainView();
}

function renderMainView() {
    const container = document.getElementById('charity');
    if (!container) return;
    
    container.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10">
            
            <!-- MOBILE HEADER -->
            <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 -mx-4 px-4 py-3 md:hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-pink-500/20 flex items-center justify-center">
                            <i class="fa-solid fa-hand-holding-heart text-amber-400"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-white">Charity Pool</h1>
                            <p class="text-[10px] text-zinc-500">Crowdfunding + Burn</p>
                        </div>
                    </div>
                    <button id="btn-my-campaigns-mobile" class="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-folder-open mr-1"></i> My Campaigns
                    </button>
                </div>
            </header>
            
            <!-- DESKTOP HEADER -->
            <div class="hidden md:flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-pink-500/20 flex items-center justify-center">
                        <i class="fa-solid fa-hand-holding-heart text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Charity Pool</h1>
                        <p class="text-sm text-zinc-500">Transparent crowdfunding with deflationary impact</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button id="btn-my-campaigns" class="charity-btn charity-btn-secondary">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>My Campaigns</span>
                    </button>
                    <button id="btn-refresh-main" class="charity-btn charity-btn-secondary">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            </div>
            
            <!-- MAIN CONTENT -->
            <div id="charity-content">
                ${renderMainContent()}
            </div>
            
        </div>
        
        <!-- MODALS -->
        ${renderCreateModal()}
        ${renderDonateModal()}
        ${renderMyCampaignsModal()}
    `;
    
    attachMainEventListeners();
    loadCharityData();
}

// ============================================================================
// MAIN CONTENT RENDERER
// ============================================================================
function renderMainContent() {
    return `
        <!-- Hero Stats -->
        <div class="charity-hero mb-6">
            <div class="relative z-10">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="charity-stat">
                        <p class="text-2xl md:text-3xl font-bold text-amber-400" id="stat-total-raised">0</p>
                        <p class="text-xs text-zinc-500 mt-1">Total Raised (BKC)</p>
                    </div>
                    <div class="charity-stat">
                        <p class="text-2xl md:text-3xl font-bold text-white" id="stat-total-campaigns">0</p>
                        <p class="text-xs text-zinc-500 mt-1">Campaigns</p>
                    </div>
                    <div class="charity-stat">
                        <p class="text-2xl md:text-3xl font-bold text-red-400" id="stat-total-burned">0</p>
                        <p class="text-xs text-zinc-500 mt-1">BKC Burned 🔥</p>
                    </div>
                    <div class="charity-stat">
                        <p class="text-2xl md:text-3xl font-bold text-emerald-400" id="stat-total-success">0</p>
                        <p class="text-xs text-zinc-500 mt-1">Successful</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Category Selection -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-heart text-pink-400"></i>
                Choose a Cause
            </h2>
            <div class="grid md:grid-cols-2 gap-5">
                ${renderCategoryCard('animal')}
                ${renderCategoryCard('humanitarian')}
            </div>
        </div>
        
        <!-- Active Campaigns -->
        <div>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-fire text-orange-400"></i>
                    Active Campaigns
                </h2>
                <div class="flex items-center gap-3">
                    <select id="filter-category" class="charity-input text-sm py-2 px-3 w-auto bg-zinc-800 border-zinc-700">
                        <option value="">All Categories</option>
                        <option value="animal">🐾 Animal Help</option>
                        <option value="humanitarian">💗 Humanitarian</option>
                    </select>
                    <button id="btn-refresh-campaigns" class="text-xs text-amber-400 hover:text-white transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-rotate"></i> Refresh
                    </button>
                </div>
            </div>
            <div id="campaigns-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${renderLoadingCards(6)}
            </div>
        </div>
        
        <!-- How It Works -->
        <div class="mt-10 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
            <h3 class="text-base font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-circle-info text-blue-400"></i>
                How Charity Pool Works
            </h3>
            <div class="grid md:grid-cols-4 gap-4">
                <div class="text-center">
                    <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <span class="text-lg font-bold text-amber-400">1</span>
                    </div>
                    <h4 class="font-semibold text-white text-sm mb-1">Create</h4>
                    <p class="text-xs text-zinc-500">Start a campaign for free with a goal and deadline</p>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <span class="text-lg font-bold text-amber-400">2</span>
                    </div>
                    <h4 class="font-semibold text-white text-sm mb-1">Share</h4>
                    <p class="text-xs text-zinc-500">Share your campaign link to reach supporters</p>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <span class="text-lg font-bold text-amber-400">3</span>
                    </div>
                    <h4 class="font-semibold text-white text-sm mb-1">Donate</h4>
                    <p class="text-xs text-zinc-500">Contributors donate BKC (1% burned 🔥)</p>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <span class="text-lg font-bold text-amber-400">4</span>
                    </div>
                    <h4 class="font-semibold text-white text-sm mb-1">Withdraw</h4>
                    <p class="text-xs text-zinc-500">Claim funds after deadline (penalty if goal not met)</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// CATEGORY CARD
// ============================================================================
function renderCategoryCard(categoryId) {
    const cat = CATEGORIES[categoryId];
    const colorStyle = categoryId === 'animal' ? 'color: #10b981;' : 'color: #f472b6;';
    
    return `
        <div class="charity-category-card ${categoryId}" data-category="${categoryId}">
            <div class="charity-icon-box ${categoryId}">
                <i class="fa-solid ${cat.icon}"></i>
            </div>
            <h3 class="text-xl font-bold text-white text-center mb-2">${cat.name}</h3>
            <p class="text-zinc-400 text-center text-sm mb-4">${cat.description}</p>
            <div class="flex justify-center gap-6 text-sm mb-4">
                <div class="text-center">
                    <p class="font-bold" style="${colorStyle}" id="cat-${categoryId}-campaigns">0</p>
                    <p class="text-zinc-500 text-xs">Campaigns</p>
                </div>
                <div class="text-center">
                    <p class="font-bold" style="${colorStyle}" id="cat-${categoryId}-raised">0 BKC</p>
                    <p class="text-zinc-500 text-xs">Raised</p>
                </div>
            </div>
            <div class="flex justify-center gap-3">
                <button class="btn-create-category charity-btn charity-btn-primary text-sm py-2" data-category="${categoryId}">
                    <i class="fa-solid fa-plus"></i> Create
                </button>
                <span class="text-sm font-medium flex items-center gap-2 cursor-pointer btn-view-category hover:underline" style="${colorStyle}" data-category="${categoryId}">
                    View All <i class="fa-solid fa-arrow-right"></i>
                </span>
            </div>
        </div>
    `;
}

// ============================================================================
// CAMPAIGN CARD - WITH "LEARN MORE" BUTTON
// ============================================================================
function renderCampaignCard(campaign) {
    const cat = CATEGORIES[campaign.category] || CATEGORIES.humanitarian;
    const progress = calculateProgress(campaign.raisedAmount, campaign.goalAmount);
    const timeInfo = formatTimeRemaining(Number(campaign.deadline));
    const isActive = isCampaignActive(campaign);
    const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS[STATUS.ACTIVE];
    const colorStyle = campaign.category === 'animal' ? 'color: #10b981;' : 'color: #f472b6;';
    
    return `
        <div class="campaign-card animate-fade-in" data-campaign-id="${campaign.id}">
            <div class="relative">
                <img src="${campaign.imageUrl || PLACEHOLDER_IMAGE}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
                     
                <!-- Status Badge -->
                <div class="absolute top-3 left-3">
                    <span class="status-badge ${statusInfo.class}">
                        <i class="fa-solid ${statusInfo.icon}"></i>
                        ${isActive ? timeInfo.text : statusInfo.label}
                    </span>
                </div>
                
                <!-- Category Badge -->
                <div class="absolute top-3 right-3 px-2 py-1 rounded-full bg-zinc-800/90 text-white text-xs font-medium">
                    ${cat.emoji} ${cat.nameShort}
                </div>
            </div>
            
            <div class="p-4">
                <h4 class="font-bold text-white text-sm mb-2 line-clamp-2">${campaign.title}</h4>
                <p class="text-zinc-500 text-xs mb-3 line-clamp-2">${campaign.description || 'No description provided'}</p>
                
                <!-- Progress Bar -->
                <div class="campaign-progress mb-2">
                    <div class="campaign-progress-fill ${campaign.category || 'humanitarian'}" style="width: ${progress}%"></div>
                </div>
                
                <!-- Stats -->
                <div class="flex justify-between items-center text-xs mb-4">
                    <span class="font-bold" style="${colorStyle}">${formatBKC(campaign.raisedAmount)} BKC</span>
                    <span class="text-zinc-500">of ${formatBKC(campaign.goalAmount)} BKC (${progress.toFixed(0)}%)</span>
                </div>
                
                <!-- Action Buttons - "LEARN MORE" -->
                <div class="flex justify-between items-center gap-2">
                    <span class="text-zinc-500 text-xs">
                        <i class="fa-solid fa-users mr-1"></i>${campaign.donationCount || 0} donors
                    </span>
                    <div class="flex gap-2">
                        <!-- LEARN MORE BUTTON -->
                        <button class="btn-campaign-details charity-btn charity-btn-info text-xs py-2 px-3" data-id="${campaign.id}">
                            <i class="fa-solid fa-info-circle"></i> Learn more
                        </button>
                        ${isActive ? `
                            <button class="btn-donate-quick charity-btn charity-btn-donate text-xs py-2 px-3" data-id="${campaign.id}">
                                <i class="fa-solid fa-heart"></i> Donate
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLoadingCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="campaign-card animate-pulse">
                <div class="campaign-image bg-zinc-800"></div>
                <div class="p-4 space-y-3">
                    <div class="h-4 bg-zinc-800 rounded w-3/4"></div>
                    <div class="h-3 bg-zinc-800 rounded w-full"></div>
                    <div class="h-2 bg-zinc-800 rounded w-full"></div>
                    <div class="flex justify-between">
                        <div class="h-3 bg-zinc-800 rounded w-1/4"></div>
                        <div class="h-8 bg-zinc-800 rounded w-1/3"></div>
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

function renderEmptyState(message, icon = 'fa-inbox') {
    return `
        <div class="col-span-full text-center py-12">
            <div class="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid ${icon} text-2xl text-zinc-600"></i>
            </div>
            <p class="text-zinc-500">${message}</p>
        </div>
    `;
}

// ============================================================================
// CAMPAIGN DETAIL PAGE - PÁGINA COMPLETA DA CAMPANHA
// ============================================================================
async function renderCampaignDetailPage(campaignId) {
    const container = document.getElementById('charity');
    if (!container) return;
    
    injectStyles();
    
    // Show loading
    container.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10 animate-fade-in">
            <div class="text-center py-20">
                <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <i class="fa-solid fa-spinner fa-spin text-2xl text-amber-400"></i>
                </div>
                <p class="text-zinc-500">Loading campaign details...</p>
            </div>
        </div>
    `;
    
    try {
        // Load campaign details
        const campaign = await loadCampaignDetails(campaignId, true);
        
        if (!campaign) {
            container.innerHTML = `
                <div class="min-h-screen pb-24 md:pb-10">
                    <button onclick="CharityPage.goBack()" class="back-btn mb-4">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>Back to Campaigns</span>
                    </button>
                    <div class="text-center py-20">
                        <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <i class="fa-solid fa-exclamation-triangle text-3xl text-red-400"></i>
                        </div>
                        <h2 class="text-xl font-bold text-white mb-2">Campaign Not Found</h2>
                        <p class="text-zinc-500 mb-6">This campaign may have been removed or doesn't exist.</p>
                        <button onclick="CharityPage.goBack()" class="charity-btn charity-btn-primary">
                            <i class="fa-solid fa-arrow-left"></i> Go Back
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        Charity.currentCampaign = campaign;
        renderCampaignDetailContent(campaign);
        
    } catch (error) {
        console.error('Failed to load campaign:', error);
        showToast('Failed to load campaign details', 'error');
        goBack();
    }
}

function renderCampaignDetailContent(campaign) {
    const container = document.getElementById('charity');
    if (!container) return;
    
    const cat = CATEGORIES[campaign.category] || CATEGORIES.humanitarian;
    const progress = calculateProgress(campaign.raisedAmount, campaign.goalAmount);
    const timeInfo = formatTimeRemaining(Number(campaign.deadline));
    const isActive = isCampaignActive(campaign);
    const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS[STATUS.ACTIVE];
    const isCreator = State.userAddress?.toLowerCase() === campaign.creator?.toLowerCase();
    const canWithdrawFunds = canWithdraw(campaign, State.userAddress);
    const shareUrl = getShareUrl(campaign.id);
    const colorStyle = campaign.category === 'animal' ? 'color: #10b981;' : 'color: #f472b6;';
    
    container.innerHTML = `
        <div class="min-h-screen pb-24 md:pb-10 animate-fade-in">
            
            <!-- Back Button -->
            <button onclick="CharityPage.goBack()" class="back-btn mb-4">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Back to Campaigns</span>
            </button>
            
            <!-- Campaign Header with Image -->
            <div class="campaign-detail-header">
                <img src="${campaign.imageUrl || PLACEHOLDER_IMAGE}" 
                     alt="${campaign.title}" 
                     class="campaign-detail-image"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="campaign-detail-overlay">
                    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <span class="status-badge ${statusInfo.class}">
                                    <i class="fa-solid ${statusInfo.icon}"></i>
                                    ${statusInfo.label}
                                </span>
                                <span class="px-3 py-1 rounded-full bg-zinc-700/80 text-white text-sm">
                                    ${cat.emoji} ${cat.name}
                                </span>
                            </div>
                            <h1 class="text-2xl md:text-3xl font-bold text-white">${campaign.title}</h1>
                        </div>
                        
                        <!-- Share Buttons -->
                        <div class="flex items-center gap-2">
                            <button onclick="CharityPage.shareCampaign('twitter')" class="share-btn twitter" title="Share on Twitter">
                                <i class="fa-brands fa-twitter"></i>
                            </button>
                            <button onclick="CharityPage.shareCampaign('telegram')" class="share-btn telegram" title="Share on Telegram">
                                <i class="fa-brands fa-telegram"></i>
                            </button>
                            <button onclick="CharityPage.shareCampaign('whatsapp')" class="share-btn whatsapp" title="Share on WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </button>
                            <button onclick="CharityPage.copyShareLink()" class="share-btn copy" title="Copy Link">
                                <i class="fa-solid fa-link"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content Grid -->
            <div class="grid lg:grid-cols-3 gap-6">
                
                <!-- Left Column - Campaign Info -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- Progress Card -->
                    <div class="campaign-detail-card">
                        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                            <div>
                                <p class="text-3xl md:text-4xl font-bold" style="${colorStyle}">${formatBKC(campaign.raisedAmount)} BKC</p>
                                <p class="text-zinc-500">raised of ${formatBKC(campaign.goalAmount)} BKC goal</p>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-white">${progress.toFixed(1)}%</p>
                                <p class="text-zinc-500 text-sm">${isActive ? timeInfo.text : 'Campaign ended'}</p>
                            </div>
                        </div>
                        <div class="campaign-progress h-4 mb-4">
                            <div class="campaign-progress-fill ${campaign.category || 'humanitarian'} h-full" style="width: ${progress}%"></div>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-zinc-400">
                                <i class="fa-solid fa-users mr-1"></i> ${campaign.donationCount || 0} donors
                            </span>
                            <span class="text-zinc-400">
                                <i class="fa-solid fa-calendar mr-1"></i> Created ${formatTimestamp(campaign.createdAt)}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <div class="campaign-detail-card">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-align-left text-blue-400"></i>
                            About this Campaign
                        </h3>
                        <p class="text-zinc-400 whitespace-pre-wrap leading-relaxed">${campaign.description || 'No description provided for this campaign.'}</p>
                        
                        ${campaign.websiteUrl ? `
                            <div class="mt-4 pt-4 border-t border-zinc-700/50">
                                <a href="${campaign.websiteUrl}" target="_blank" rel="noopener" 
                                   class="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-2">
                                    <i class="fa-solid fa-external-link"></i>
                                    Visit Campaign Website
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Creator Info -->
                    <div class="campaign-detail-card">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-user text-purple-400"></i>
                            Campaign Creator
                        </h3>
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-user text-xl text-amber-400"></i>
                            </div>
                            <div>
                                <a href="${EXPLORER_ADDRESS}${campaign.creator}" target="_blank" 
                                   class="text-white font-mono hover:text-amber-400 transition-colors">
                                    ${formatAddress(campaign.creator)}
                                </a>
                                <p class="text-zinc-500 text-sm">Campaign Creator</p>
                            </div>
                        </div>
                        ${campaign.txHash ? `
                            <a href="${EXPLORER_TX}${campaign.txHash}" target="_blank" 
                               class="mt-4 text-xs text-zinc-500 hover:text-amber-400 flex items-center gap-1">
                                <i class="fa-solid fa-external-link"></i>
                                View creation transaction
                            </a>
                        ` : ''}
                    </div>
                    
                    <!-- Recent Donations -->
                    <div class="campaign-detail-card">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-heart text-red-400"></i>
                            Recent Donations
                        </h3>
                        <div id="donations-list" class="space-y-2 max-h-80 overflow-y-auto charity-scroll">
                            ${campaign.recentDonations?.length > 0 ? 
                                campaign.recentDonations.map(d => `
                                    <div class="donation-item">
                                        <div class="donation-avatar bg-emerald-500/20">
                                            <i class="fa-solid fa-heart text-emerald-400"></i>
                                        </div>
                                        <div class="flex-1">
                                            <p class="text-white font-medium">${formatBKC(d.netAmount)} BKC</p>
                                            <p class="text-zinc-500 text-xs">${formatAddress(d.donor)}</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="burn-badge">
                                                <i class="fa-solid fa-fire"></i> ${formatBKC(d.burnedAmount)} burned
                                            </div>
                                        </div>
                                    </div>
                                `).join('') :
                                '<p class="text-zinc-500 text-center py-6">No donations yet. Be the first to contribute!</p>'
                            }
                        </div>
                    </div>
                </div>
                
                <!-- Right Column - Actions -->
                <div class="space-y-6">
                    
                    <!-- Donate Card -->
                    ${isActive ? `
                        <div class="campaign-detail-card bg-gradient-to-br from-${cat.color}-900/30 to-${cat.color}-900/10 border-${cat.color}-500/30">
                            <h3 class="text-lg font-bold text-white mb-4">Support this Campaign</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm text-zinc-400 mb-2">Donation Amount (BKC)</label>
                                    <input type="number" id="detail-donate-amount" class="charity-input" placeholder="Enter amount" min="1">
                                </div>
                                <div class="grid grid-cols-4 gap-2">
                                    <button class="quick-amount-detail py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold transition-colors" data-amount="10">10</button>
                                    <button class="quick-amount-detail py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold transition-colors" data-amount="50">50</button>
                                    <button class="quick-amount-detail py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold transition-colors" data-amount="100">100</button>
                                    <button class="quick-amount-detail py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold transition-colors" data-amount="500">500</button>
                                </div>
                                
                                <!-- Fee Breakdown -->
                                <div id="detail-fee-breakdown" class="bg-zinc-900/50 rounded-lg p-4 text-xs space-y-2 hidden">
                                    <div class="flex justify-between">
                                        <span class="text-zinc-500">Your donation:</span>
                                        <span id="detail-fee-gross" class="text-white font-mono">0 BKC</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-zinc-500">Ecosystem fee (4%):</span>
                                        <span id="detail-fee-eco" class="text-blue-400 font-mono">0 BKC</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-zinc-500">Burn (1%):</span>
                                        <span id="detail-fee-burn" class="text-red-400 font-mono">0 BKC 🔥</span>
                                    </div>
                                    <div class="flex justify-between pt-2 border-t border-zinc-700">
                                        <span class="text-zinc-300 font-medium">Campaign receives:</span>
                                        <span id="detail-fee-net" class="text-emerald-400 font-bold font-mono">0 BKC</span>
                                    </div>
                                </div>
                                
                                <button id="btn-detail-donate" class="charity-btn charity-btn-donate w-full">
                                    <i class="fa-solid fa-heart"></i>
                                    Donate Now
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="campaign-detail-card text-center">
                            <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <i class="fa-solid fa-clock text-2xl text-zinc-500"></i>
                            </div>
                            <h3 class="text-lg font-bold text-white mb-2">Campaign Ended</h3>
                            <p class="text-zinc-500 text-sm">This campaign is no longer accepting donations.</p>
                        </div>
                    `}
                    
                    <!-- Creator Management -->
                    ${isCreator ? `
                        <div class="campaign-detail-card">
                            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <i class="fa-solid fa-cog text-amber-400"></i>
                                Campaign Management
                            </h3>
                            ${canWithdrawFunds ? `
                                <button id="btn-withdraw" class="charity-btn charity-btn-primary w-full mb-3">
                                    <i class="fa-solid fa-wallet"></i>
                                    Withdraw Funds
                                </button>
                                <p class="text-xs text-zinc-500 text-center">Withdrawal fee: 0.001 ETH</p>
                                ${progress < 100 ? `
                                    <p class="text-xs text-red-400 text-center mt-2">⚠️ Goal not reached: 10% penalty will apply</p>
                                ` : ''}
                            ` : isActive ? `
                                <button id="btn-cancel" class="charity-btn charity-btn-secondary w-full">
                                    <i class="fa-solid fa-times"></i>
                                    Cancel Campaign
                                </button>
                                <p class="text-xs text-zinc-500 text-center mt-2">You can withdraw funds after the deadline</p>
                            ` : `
                                <p class="text-zinc-500 text-center">Campaign has been ${statusInfo.label.toLowerCase()}</p>
                            `}
                        </div>
                    ` : ''}
                    
                    <!-- Fee Structure Info -->
                    <div class="campaign-detail-card">
                        <h3 class="text-sm font-bold text-zinc-400 mb-4">Fee Structure</h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-zinc-500">Ecosystem Fee:</span>
                                <span class="text-white">4%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-500">Burn Fee:</span>
                                <span class="text-red-400">1% 🔥</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-500">To Campaign:</span>
                                <span class="text-emerald-400">95%</span>
                            </div>
                            <div class="flex justify-between pt-3 border-t border-zinc-700">
                                <span class="text-zinc-500">Goal not met penalty:</span>
                                <span class="text-red-400">10% burn</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Share Card -->
                    <div class="campaign-detail-card">
                        <h3 class="text-sm font-bold text-zinc-400 mb-4">Share Campaign</h3>
                        <div class="grid grid-cols-2 gap-2 mb-3">
                            <button onclick="CharityPage.shareCampaign('twitter')" class="charity-btn charity-btn-secondary text-sm">
                                <i class="fa-brands fa-twitter"></i> Twitter
                            </button>
                            <button onclick="CharityPage.shareCampaign('telegram')" class="charity-btn charity-btn-secondary text-sm">
                                <i class="fa-brands fa-telegram"></i> Telegram
                            </button>
                        </div>
                        <button onclick="CharityPage.copyShareLink()" class="charity-btn charity-btn-secondary w-full text-sm">
                            <i class="fa-solid fa-copy"></i> Copy Link
                        </button>
                        <p class="text-xs text-zinc-500 text-center mt-3">Help spread the word!</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    attachDetailEventListeners(campaign);
}

// ============================================================================
// MODALS
// ============================================================================
function renderCreateModal() {
    return `
        <div id="modal-create" class="charity-modal">
            <div class="charity-modal-content">
                <div class="p-5 border-b border-zinc-800">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div id="create-modal-icon" class="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-plus text-xl text-amber-400"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-white">Create Campaign</h2>
                                <p id="create-modal-subtitle" class="text-zinc-500 text-xs">Start your fundraising journey</p>
                            </div>
                        </div>
                        <button class="btn-close-modal text-zinc-500 hover:text-white text-xl" data-modal="create">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-5 max-h-[70vh] overflow-y-auto charity-scroll">
                    <form id="form-create-campaign" class="space-y-4">
                        <input type="hidden" id="create-category" value="">
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Campaign Title *</label>
                            <input type="text" id="create-title" class="charity-input" placeholder="e.g., Help rescue abandoned animals" required maxlength="100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                            <textarea id="create-description" class="charity-input charity-textarea" placeholder="Describe your campaign and how the funds will be used..." maxlength="1000"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Image URL (optional)</label>
                            <input type="url" id="create-image" class="charity-input" placeholder="https://example.com/image.jpg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Website (optional)</label>
                            <input type="url" id="create-website" class="charity-input" placeholder="https://yourwebsite.com">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-1.5">Goal (BKC) *</label>
                                <input type="number" id="create-goal" class="charity-input" placeholder="1000" required min="1">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-1.5">Duration (Days) *</label>
                                <input type="number" id="create-duration" class="charity-input" placeholder="30" required min="1" max="180">
                            </div>
                        </div>
                        
                        <div class="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                            <p class="text-xs text-zinc-400 mb-2 font-medium">📋 Campaign Rules:</p>
                            <ul class="text-xs text-zinc-500 space-y-1">
                                <li>• <span class="text-emerald-400">Free</span> to create a campaign</li>
                                <li>• Donations: 4% to ecosystem + <span class="text-red-400">1% burned 🔥</span></li>
                                <li>• Goal reached: <span class="text-emerald-400">0% penalty</span></li>
                                <li>• Goal not reached: <span class="text-red-400">10% burned</span> on withdrawal</li>
                            </ul>
                        </div>
                        
                        <button type="submit" id="btn-submit-create" class="charity-btn charity-btn-primary w-full">
                            <i class="fa-solid fa-rocket"></i>
                            <span>Launch Campaign</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderDonateModal() {
    return `
        <div id="modal-donate" class="charity-modal">
            <div class="charity-modal-content max-w-md">
                <div class="p-5 border-b border-zinc-800">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-heart text-xl text-emerald-400"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-white">Donate</h2>
                                <p id="donate-campaign-title" class="text-zinc-500 text-xs truncate max-w-[180px]">Campaign Title</p>
                            </div>
                        </div>
                        <button class="btn-close-modal text-zinc-500 hover:text-white text-xl" data-modal="donate">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-5">
                    <form id="form-donate" class="space-y-4">
                        <input type="hidden" id="donate-campaign-id" value="">
                        
                        <!-- Campaign Progress -->
                        <div class="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                            <div class="flex justify-between text-sm mb-2">
                                <span class="text-zinc-400">Raised:</span>
                                <span id="donate-raised" class="text-emerald-400 font-bold">0 BKC</span>
                            </div>
                            <div class="flex justify-between text-sm mb-3">
                                <span class="text-zinc-400">Goal:</span>
                                <span id="donate-goal" class="text-white font-bold">0 BKC</span>
                            </div>
                            <div class="campaign-progress">
                                <div id="donate-progress" class="campaign-progress-fill animal" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <!-- Quick Amounts -->
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-2">Quick Select</label>
                            <div class="grid grid-cols-4 gap-2">
                                <button type="button" class="btn-quick-amount py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors" data-amount="10">10</button>
                                <button type="button" class="btn-quick-amount py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors" data-amount="50">50</button>
                                <button type="button" class="btn-quick-amount py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors" data-amount="100">100</button>
                                <button type="button" class="btn-quick-amount py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors" data-amount="500">500</button>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Amount (BKC) *</label>
                            <input type="number" id="donate-amount" class="charity-input" placeholder="Enter amount" required min="1">
                        </div>
                        
                        <!-- Fee Breakdown -->
                        <div class="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                            <p class="text-xs text-zinc-400 mb-2 font-medium">💰 Fee Breakdown:</p>
                            <div class="space-y-1.5 text-xs">
                                <div class="flex justify-between">
                                    <span class="text-zinc-500">Your donation:</span>
                                    <span id="fee-gross" class="text-white font-mono">0 BKC</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-zinc-500">Ecosystem fee (4%):</span>
                                    <span id="fee-ecosystem" class="text-blue-400 font-mono">0 BKC</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-zinc-500">Burn (1%):</span>
                                    <span id="fee-burn" class="text-red-400 font-mono">0 BKC 🔥</span>
                                </div>
                                <div class="flex justify-between pt-2 border-t border-zinc-700">
                                    <span class="text-zinc-300 font-medium">Campaign receives:</span>
                                    <span id="fee-net" class="text-emerald-400 font-bold font-mono">0 BKC</span>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" id="btn-submit-donate" class="charity-btn charity-btn-donate w-full">
                            <i class="fa-solid fa-heart"></i>
                            <span>Donate Now</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderMyCampaignsModal() {
    return `
        <div id="modal-my-campaigns" class="charity-modal">
            <div class="charity-modal-content max-w-2xl">
                <div class="p-5 border-b border-zinc-800">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-folder-open text-xl text-amber-400"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-white">My Campaigns & Donations</h2>
                                <p class="text-zinc-500 text-xs">Manage your campaigns and view donation history</p>
                            </div>
                        </div>
                        <button class="btn-close-modal text-zinc-500 hover:text-white text-xl" data-modal="my-campaigns">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-5 max-h-[70vh] overflow-y-auto charity-scroll">
                    <div id="my-campaigns-content">
                        <div class="text-center py-8">
                            <i class="fa-solid fa-spinner fa-spin text-2xl text-amber-400"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// FEE CALCULATIONS
// ============================================================================
function updateDonationFees() {
    const amount = parseFloat(document.getElementById('donate-amount')?.value) || 0;
    
    const ecosystemFee = amount * 0.04;
    const burnFee = amount * 0.01;
    const netAmount = amount - ecosystemFee - burnFee;
    
    document.getElementById('fee-gross').textContent = `${amount.toFixed(2)} BKC`;
    document.getElementById('fee-ecosystem').textContent = `${ecosystemFee.toFixed(2)} BKC`;
    document.getElementById('fee-burn').textContent = `${burnFee.toFixed(2)} BKC 🔥`;
    document.getElementById('fee-net').textContent = `${netAmount.toFixed(2)} BKC`;
}

function updateDetailFees() {
    const amount = parseFloat(document.getElementById('detail-donate-amount')?.value) || 0;
    const breakdown = document.getElementById('detail-fee-breakdown');
    
    if (amount > 0) {
        breakdown?.classList.remove('hidden');
        
        const ecosystemFee = amount * 0.04;
        const burnFee = amount * 0.01;
        const netAmount = amount - ecosystemFee - burnFee;
        
        document.getElementById('detail-fee-gross').textContent = `${amount.toFixed(2)} BKC`;
        document.getElementById('detail-fee-eco').textContent = `${ecosystemFee.toFixed(2)} BKC`;
        document.getElementById('detail-fee-burn').textContent = `${burnFee.toFixed(2)} BKC 🔥`;
        document.getElementById('detail-fee-net').textContent = `${netAmount.toFixed(2)} BKC`;
    } else {
        breakdown?.classList.add('hidden');
    }
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================
function openModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) {
        modal.classList.remove('active');
    }
}

function openCreateModal(category) {
    Charity.selectedCategory = category;
    const cat = CATEGORIES[category];
    const bgColor = category === 'animal' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 114, 182, 0.2)';
    const textColor = category === 'animal' ? '#10b981' : '#f472b6';
    
    document.getElementById('create-category').value = category;
    document.getElementById('create-modal-icon').style.background = bgColor;
    document.getElementById('create-modal-icon').innerHTML = `<i class="fa-solid ${cat.icon} text-xl" style="color: ${textColor}"></i>`;
    document.getElementById('create-modal-subtitle').textContent = `Create a ${cat.name.toLowerCase()} campaign`;
    
    // Reset form
    document.getElementById('form-create-campaign').reset();
    document.getElementById('create-category').value = category;
    
    openModal('create');
}

function openDonateModal(campaignId) {
    const campaign = Charity.campaigns.find(c => c.id === campaignId || c.id === String(campaignId));
    if (!campaign) {
        showToast('Campaign not found', 'error');
        return;
    }
    
    const cat = CATEGORIES[campaign.category] || CATEGORIES.humanitarian;
    
    document.getElementById('donate-campaign-id').value = campaignId;
    document.getElementById('donate-campaign-title').textContent = campaign.title;
    document.getElementById('donate-raised').textContent = `${formatBKC(campaign.raisedAmount)} BKC`;
    document.getElementById('donate-goal').textContent = `${formatBKC(campaign.goalAmount)} BKC`;
    
    const progress = calculateProgress(campaign.raisedAmount, campaign.goalAmount);
    document.getElementById('donate-progress').style.width = `${progress}%`;
    document.getElementById('donate-progress').className = `campaign-progress-fill ${campaign.category || 'humanitarian'}`;
    
    // Reset form
    document.getElementById('form-donate').reset();
    document.getElementById('donate-campaign-id').value = campaignId;
    updateDonationFees();
    
    openModal('donate');
}

async function openMyCampaignsModal() {
    openModal('my-campaigns');
    
    const contentEl = document.getElementById('my-campaigns-content');
    if (!contentEl) return;
    
    if (!State.isConnected) {
        contentEl.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-wallet text-2xl text-zinc-600"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Wallet Not Connected</h3>
                <p class="text-zinc-500">Please connect your wallet to view your campaigns and donations.</p>
            </div>
        `;
        return;
    }
    
    try {
        const [campaigns, donations] = await Promise.all([
            loadUserCampaigns(State.userAddress),
            loadUserDonations(State.userAddress)
        ]);
        
        contentEl.innerHTML = `
            <div class="space-y-6">
                <!-- My Campaigns -->
                <div>
                    <h3 class="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-folder"></i>
                        My Campaigns (${campaigns.length})
                    </h3>
                    ${campaigns.length > 0 ? `
                        <div class="space-y-3">
                            ${campaigns.map(c => `
                                <div class="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
                                    <div class="flex-1">
                                        <h4 class="text-white font-medium">${c.title}</h4>
                                        <p class="text-zinc-500 text-xs">${formatBKC(c.raisedAmount)} / ${formatBKC(c.goalAmount)} BKC</p>
                                    </div>
                                    <button onclick="CharityPage.viewCampaign('${c.id}')" class="charity-btn charity-btn-info text-xs">
                                        <i class="fa-solid fa-eye"></i> View
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-zinc-500 text-center py-4">You haven't created any campaigns yet.</p>
                    `}
                </div>
                
                <!-- My Donations -->
                <div>
                    <h3 class="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-heart"></i>
                        My Donations (${donations.length})
                    </h3>
                    ${donations.length > 0 ? `
                        <div class="space-y-3">
                            ${donations.slice(0, 10).map(d => `
                                <div class="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
                                    <div class="flex-1">
                                        <p class="text-emerald-400 font-medium">${formatBKC(d.netAmount)} BKC</p>
                                        <p class="text-zinc-500 text-xs">Campaign #${d.campaignId}</p>
                                    </div>
                                    <div class="burn-badge">
                                        <i class="fa-solid fa-fire"></i> ${formatBKC(d.burnedAmount)} burned
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-zinc-500 text-center py-4">You haven't made any donations yet.</p>
                    `}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Failed to load user data:', error);
        contentEl.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-exclamation-triangle text-2xl text-red-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Failed to Load</h3>
                <p class="text-zinc-500">Unable to load your data. Please try again.</p>
            </div>
        `;
    }
}

// ============================================================================
// FORM HANDLERS
// ============================================================================
async function handleCreateCampaign(e) {
    e.preventDefault();
    
    if (!State.isConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    const params = {
        title: document.getElementById('create-title').value.trim(),
        description: document.getElementById('create-description').value.trim(),
        goalAmount: document.getElementById('create-goal').value,
        durationDays: parseInt(document.getElementById('create-duration').value),
        category: document.getElementById('create-category').value,
        imageUrl: document.getElementById('create-image').value.trim() || null,
        websiteUrl: document.getElementById('create-website').value.trim() || null
    };
    
    if (!params.title || !params.goalAmount || !params.durationDays) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const btn = document.getElementById('btn-submit-create');
    const result = await executeCreateCampaign(params, btn);
    
    if (result.success) {
        closeModal('create');
        clearCharityCache();
        loadCharityData();
        
        // Navigate to new campaign after a short delay
        if (result.campaignId) {
            setTimeout(() => {
                setCampaignUrl(result.campaignId);
                renderCampaignDetailPage(result.campaignId);
            }, 1500);
        }
    }
}

async function handleDonate(e) {
    e.preventDefault();
    
    if (!State.isConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    const campaignId = document.getElementById('donate-campaign-id').value;
    const amount = document.getElementById('donate-amount').value;
    
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    const btn = document.getElementById('btn-submit-donate');
    const result = await executeDonate(campaignId, amount, btn);
    
    if (result.success) {
        closeModal('donate');
        clearCharityCache();
        loadCharityData();
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadCharityData() {
    Charity.isLoading = true;
    
    try {
        const [stats, campaigns] = await Promise.all([
            loadCharityStats(false),
            loadCampaigns({ forceRefresh: false })
        ]);
        
        Charity.globalStats = stats || Charity.globalStats;
        Charity.campaigns = campaigns || [];
        
        updateStatsUI();
        updateCampaignsGrid();
        updateCategoryStats();
        
    } catch (error) {
        console.error('Load charity data error:', error);
        // Still try to update UI with whatever data we have
        updateCampaignsGrid();
    } finally {
        Charity.isLoading = false;
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateStatsUI() {
    const stats = Charity.globalStats;
    if (!stats) return;
    
    const el = (id) => document.getElementById(id);
    
    if (el('stat-total-raised')) el('stat-total-raised').textContent = formatBKC(stats.totalRaised);
    if (el('stat-total-campaigns')) el('stat-total-campaigns').textContent = stats.totalCampaigns || 0;
    if (el('stat-total-burned')) el('stat-total-burned').textContent = formatBKC(stats.totalBurned);
    if (el('stat-total-success')) el('stat-total-success').textContent = stats.totalSuccessful || 0;
}

function updateCampaignsGrid() {
    const grid = document.getElementById('campaigns-grid');
    if (!grid) return;
    
    let activeCampaigns = Charity.campaigns.filter(c => isCampaignActive(c));
    
    // Apply category filter
    if (Charity.selectedCategory) {
        activeCampaigns = activeCampaigns.filter(c => c.category === Charity.selectedCategory);
    }
    
    // Sort by creation date (newest first)
    activeCampaigns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    if (activeCampaigns.length === 0) {
        const message = Charity.selectedCategory 
            ? `No active ${CATEGORIES[Charity.selectedCategory]?.name || ''} campaigns`
            : 'No active campaigns yet. Be the first to create one!';
        grid.innerHTML = renderEmptyState(message, 'fa-heart');
        return;
    }
    
    grid.innerHTML = activeCampaigns.map(c => renderCampaignCard(c)).join('');
}

function updateCategoryStats() {
    Object.keys(CATEGORIES).forEach(catId => {
        const catCampaigns = Charity.campaigns.filter(c => c.category === catId);
        const activeCampaigns = catCampaigns.filter(c => isCampaignActive(c));
        
        let totalRaised = 0n;
        catCampaigns.forEach(c => {
            try {
                totalRaised += BigInt(c.raisedAmount?.toString() || '0');
            } catch {}
        });
        
        const countEl = document.getElementById(`cat-${catId}-campaigns`);
        const raisedEl = document.getElementById(`cat-${catId}-raised`);
        
        if (countEl) countEl.textContent = activeCampaigns.length;
        if (raisedEl) raisedEl.textContent = `${formatBKC(totalRaised)} BKC`;
    });
}

// ============================================================================
// SHARE FUNCTIONS
// ============================================================================
function shareCampaign(platform) {
    const campaign = Charity.currentCampaign;
    if (!campaign) return;
    
    const url = getShareUrl(campaign.id);
    const title = campaign.title;
    const text = `🙏 Support "${title}" on Backcoin Charity Pool!\n\n${formatBKC(campaign.raisedAmount)} BKC raised of ${formatBKC(campaign.goalAmount)} goal.\n\nEvery donation helps - 1% is burned for deflation! 🔥\n\n`;
    
    let shareUrl;
    
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
            break;
        default:
            return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function copyShareLink() {
    const campaign = Charity.currentCampaign;
    if (!campaign) return;
    
    const url = getShareUrl(campaign.id);
    
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard! 📋', 'success');
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link copied! 📋', 'success');
    });
}

// ============================================================================
// NAVIGATION
// ============================================================================
function goBack() {
    clearCampaignUrl();
    Charity.currentCampaign = null;
    Charity.currentView = 'main';
    renderMainView();
}

function viewCampaign(campaignId) {
    closeModal('my-campaigns');
    setCampaignUrl(campaignId);
    renderCampaignDetailPage(campaignId);
}

// ============================================================================
// HASH CHANGE LISTENER
// ============================================================================
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#charity')) {
        const campaignId = getCampaignIdFromUrl();
        
        if (campaignId) {
            if (Charity.currentCampaign?.id !== campaignId) {
                renderCampaignDetailPage(campaignId);
            }
        } else if (Charity.currentView !== 'main') {
            goBack();
        }
    }
});

// ============================================================================
// EXPORT
// ============================================================================
export const CharityPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
    },
    
    update() {
        if (Charity.currentView === 'main') {
            updateStatsUI();
            updateCampaignsGrid();
        }
    },
    
    refresh() {
        clearCharityCache();
        loadCharityData();
    },
    
    // Public methods for onclick handlers
    closeModal,
    openCreateModal,
    shareCampaign,
    copyShareLink,
    goBack,
    viewCampaign
};

// Make available globally for onclick handlers
window.CharityPage = CharityPage;