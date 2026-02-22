// pages/CharityPage.js
// ✅ V2.0 - CharityPool V2: Variable Boost + Multi-Media + Viral Sharing
// ============================================================================
//   BACKCHAIN PROTOCOL — Charity Pool V2
//   Support causes with BNB • Make a difference • Share & earn
// ============================================================================
//
// V2.0 Changes:
// - Variable-day boost (1-30 days) with additive expiry
// - Multi-media gallery: up to 5 images + 2 videos per campaign
// - 7 categories (animal, humanitarian, environment, medical, education, disaster, community)
// - Viral sharing with tutor/referral links (?ref=0xAddress)
// - Dynamic fee display via calculateFeeClientSide (no more hardcoded 5%)
// - Batch reads via getCampaignsBatch (no more N+1 queries)
// - Boost cost estimator (feePerDay × days)
// - Better campaign cards with share button, boost badge with remaining days
// - Image carousel on detail page
// - Native Web Share API for mobile
//
// ============================================================================

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { CharityTx } from '../modules/transactions/index.js';
import { irysUploadFile } from '../modules/core/index.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================

const CampaignStatus = { ACTIVE: 0, CLOSED: 1, WITHDRAWN: 2 };

const STATUS_CONFIG = {
    0: { label: 'Active', color: '#10b981', icon: 'fa-circle-play', bg: 'bg-emerald-500/15' },
    1: { label: 'Closed', color: '#3b82f6', icon: 'fa-circle-check', bg: 'bg-blue-500/15' },
    2: { label: 'Withdrawn', color: '#8b5cf6', icon: 'fa-circle-dollar-to-slot', bg: 'bg-purple-500/15' }
};

const CHARITY_API = {
    getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app',
    saveCampaign: 'https://savecharitycampaign-4wvdcuoouq-uc.a.run.app',
    uploadMedia: '/api/upload-media'
};

const EXPLORER_ADDRESS = "https://opbnbscan.com/address/";

const PLACEHOLDER_IMAGES = {
    animal: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    humanitarian: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
    environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    medical: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80',
    education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    disaster: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80',
    community: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'
};

const CATEGORIES = {
    animal:       { name: 'Animal Welfare',      emoji: '\u{1F43E}', color: '#10b981' },
    humanitarian: { name: 'Humanitarian Aid',     emoji: '\u{1F497}', color: '#ec4899' },
    environment:  { name: 'Environment',          emoji: '\u{1F33F}', color: '#22c55e' },
    medical:      { name: 'Medical & Health',     emoji: '\u{1FA7A}', color: '#06b6d4' },
    education:    { name: 'Education & Youth',    emoji: '\u{1F4DA}', color: '#8b5cf6' },
    disaster:     { name: 'Disaster Relief',      emoji: '\u{26A1}',  color: '#ef4444' },
    community:    { name: 'Community & Social',   emoji: '\u{1F91D}', color: '#f59e0b' }
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB for images
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for video
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;

// ============================================================================
// STATE
// ============================================================================

const CS = {
    campaigns: [],
    stats: null,
    currentView: 'main',
    currentCampaign: null,
    selectedCategory: null,
    isLoading: false,
    carouselIndex: 0,
    // Wizard state
    createStep: 1,
    createCategory: null,
    createTitle: '',
    createDesc: '',
    createGoal: '',
    createDuration: '',
    createMedia: [],      // [{file, url, type:'image'|'video', preview}]
    createMediaUrls: [],  // for URL-based additions
    // Boost
    boostDays: 7,
    boostCampaignId: null,
    boostCost: null,
    // Fees
    createFee: null,
    donateFee5pct: true, // will be updated
};

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('charity-styles-v2')) return;
    const s = document.createElement('style');
    s.id = 'charity-styles-v2';
    s.textContent = `
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse-border { 0%, 100% { border-color: rgba(245,158,11,0.3); } 50% { border-color: rgba(245,158,11,0.6); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.2); } 50% { box-shadow: 0 0 20px rgba(245,158,11,0.5); } }

        .float-animation { animation: float 3s ease-in-out infinite; }
        .charity-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem; min-height: 400px; }

        .cp-card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .cp-card-base:hover { border-color: rgba(245,158,11,0.3); transform: translateY(-2px); }

        .cp-stat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
        }

        .cp-campaign-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cp-campaign-card:hover { transform: translateY(-4px); border-color: rgba(245,158,11,0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .cp-campaign-card:hover .cp-card-img-wrap img { transform: scale(1.05); }
        .cp-campaign-card.boosted { border-color: rgba(245,158,11,0.4); animation: glow-pulse 3s ease-in-out infinite; }
        .cp-card-img-wrap { position: relative; overflow: hidden; }
        .cp-card-img-wrap::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, rgba(0,0,0,0.5), transparent); pointer-events: none; }
        .cp-campaign-card img { width: 100%; height: 200px; object-fit: cover; background: rgba(63,63,70,0.5); transition: transform 0.4s ease; }

        .cp-progress { height: 8px; background: rgba(63,63,70,0.5); border-radius: 4px; overflow: hidden; }
        .cp-progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; background: linear-gradient(90deg, #f59e0b, #d97706); }

        .cp-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .cp-boosted-badge { background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.2)); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }

        .cp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s ease; }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; }
        .cp-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.3); }
        .cp-btn-secondary { background: rgba(63,63,70,0.8); color: #fafafa; border: 1px solid rgba(63,63,70,0.8); }
        .cp-btn-secondary:hover:not(:disabled) { background: rgba(63,63,70,1); }
        .cp-btn-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; }
        .cp-btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,0.3); }
        .cp-btn-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; }

        .cp-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem; }
        .cp-modal.active { display: flex; }
        .cp-modal-content { background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%); border: 1px solid rgba(63,63,70,0.5); border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .cp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid rgba(63,63,70,0.5); }
        .cp-modal-title { font-size: 1.125rem; font-weight: 700; color: #fafafa; display: flex; align-items: center; gap: 10px; margin: 0; }
        .cp-modal-close { background: none; border: none; color: #a1a1aa; font-size: 1.25rem; cursor: pointer; padding: 4px; }
        .cp-modal-close:hover { color: #fafafa; }
        .cp-modal-body { padding: 1.25rem; }
        .cp-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.25rem; border-top: 1px solid rgba(63,63,70,0.5); }

        .cp-form-group { margin-bottom: 1rem; }
        .cp-form-label { display: block; font-size: 12px; font-weight: 600; color: #fafafa; margin-bottom: 6px; }
        .cp-form-label span { color: #a1a1aa; font-weight: 400; }
        .cp-form-input { width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.4); border: 2px solid rgba(63,63,70,0.5); border-radius: 10px; color: #fafafa; font-size: 14px; box-sizing: border-box; transition: all 0.2s; }
        .cp-form-input:focus { outline: none; border-color: rgba(245,158,11,0.6); }
        .cp-form-textarea { min-height: 100px; resize: vertical; }
        .cp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .cp-donate-input-wrap { position: relative; }
        .cp-donate-input { width: 100%; padding: 1rem; padding-right: 4rem; font-size: 1.5rem; font-weight: 700; text-align: center; background: rgba(0,0,0,0.4); border: 2px solid rgba(63,63,70,0.5); border-radius: 12px; color: #fafafa; box-sizing: border-box; }
        .cp-donate-input:focus { outline: none; border-color: rgba(16,185,129,0.6); }
        .cp-donate-currency { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #a1a1aa; font-weight: 600; }
        .cp-donate-presets { display: flex; gap: 8px; margin: 10px 0; }
        .cp-preset { flex: 1; padding: 8px; background: rgba(63,63,70,0.5); border: 1px solid rgba(63,63,70,0.8); border-radius: 8px; color: #fafafa; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .cp-preset:hover { background: rgba(63,63,70,0.8); }
        .cp-preset.active { background: rgba(245,158,11,0.2); border-color: rgba(245,158,11,0.5); color: #f59e0b; }

        .cp-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 10px; }
        .cp-media-thumb { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid rgba(63,63,70,0.5); }
        .cp-media-thumb img, .cp-media-thumb video { width: 100%; height: 100%; object-fit: cover; }
        .cp-media-thumb .cp-media-remove { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.9); color: #fff; border: none; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; }
        .cp-media-thumb .cp-media-type { position: absolute; bottom: 4px; left: 4px; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: rgba(0,0,0,0.7); color: #fff; }

        .cp-media-upload { border: 2px dashed rgba(63,63,70,0.8); border-radius: 12px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.2); }
        .cp-media-upload:hover { border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.05); }
        .cp-media-upload input { display: none; }

        .cp-carousel { position: relative; width: 100%; border-radius: 16px; overflow: hidden; margin-bottom: 1.5rem; }
        .cp-carousel img, .cp-carousel video { width: 100%; height: 350px; object-fit: cover; background: rgba(63,63,70,0.5); }
        .cp-carousel-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .cp-carousel-nav:hover { background: rgba(0,0,0,0.8); }
        .cp-carousel-nav.prev { left: 10px; }
        .cp-carousel-nav.next { right: 10px; }
        .cp-carousel-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
        .cp-carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; border: none; }
        .cp-carousel-dot.active { background: #f59e0b; }

        .cp-share-box { background: rgba(63,63,70,0.3); border-radius: 12px; padding: 1rem; }
        .cp-share-title { font-size: 12px; color: #a1a1aa; margin-bottom: 10px; text-align: center; }
        .cp-share-btns { display: flex; justify-content: center; gap: 8px; }
        .cp-share-btn { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
        .cp-share-btn:hover { transform: scale(1.1); }
        .cp-share-btn.twitter { background: #000; color: #fff; }
        .cp-share-btn.telegram { background: #0088cc; color: #fff; }
        .cp-share-btn.whatsapp { background: #25d366; color: #fff; }
        .cp-share-btn.copy { background: rgba(63,63,70,0.8); color: #fafafa; }

        .cp-empty { text-align: center; padding: 3rem 1rem; color: #a1a1aa; }
        .cp-empty i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.4; }
        .cp-empty h3 { color: #fafafa; margin: 0 0 8px; }
        .cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem; }
        .cp-spinner { width: 40px; height: 40px; border: 3px solid rgba(63,63,70,0.5); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cp-step-container { display: flex; align-items: center; justify-content: space-between; position: relative; padding: 0 1rem; }
        .cp-step-item { display: flex; flex-direction: column; align-items: center; z-index: 1; }
        .cp-step-dot { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; transition: all 0.3s ease; }
        .cp-step-dot.pending { background: rgba(39,39,42,0.8); color: #71717a; border: 2px solid rgba(63,63,70,0.8); }
        .cp-step-dot.active { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; box-shadow: 0 0 20px rgba(245,158,11,0.4); }
        .cp-step-dot.done { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; }
        .cp-step-line { position: absolute; top: 20px; height: 3px; background: rgba(63,63,70,0.5); transition: all 0.5s ease; }
        .cp-step-line.ln-1 { left: 14%; width: 22%; }
        .cp-step-line.ln-2 { left: 39%; width: 22%; }
        .cp-step-line.ln-3 { left: 64%; width: 22%; }
        .cp-step-line.active { background: linear-gradient(90deg, #10b981, #f59e0b); }
        .cp-step-line.done { background: #10b981; }

        .cp-wiz-cat-card { background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%); border: 2px solid rgba(63,63,70,0.5); border-radius: 16px; padding: 1.5rem 1rem; cursor: pointer; transition: all 0.3s ease; text-align: center; }
        .cp-wiz-cat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .cp-wiz-cat-card.selected { transform: translateY(-4px); border-color: #f59e0b; box-shadow: 0 12px 30px rgba(0,0,0,0.3); }

        .cp-wiz-summary { background: rgba(0,0,0,0.3); border: 1px solid rgba(63,63,70,0.5); border-radius: 12px; padding: 1rem; }
        .cp-wiz-summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .cp-wiz-summary-row + .cp-wiz-summary-row { border-top: 1px solid rgba(63,63,70,0.3); }

        .cp-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }

        .cp-boost-slider { width: 100%; accent-color: #f59e0b; }

        .cp-detail { max-width: 900px; margin: 0 auto; }
        .cp-detail-content { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
        .cp-detail-sidebar { display: flex; flex-direction: column; gap: 1rem; }

        .cp-ref-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 12px; }
        .cp-ref-link { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px 12px; word-break: break-all; font-size: 11px; color: #fbbf24; font-family: monospace; }

        .cp-skeleton-card { border-radius: 16px; overflow: hidden; background: linear-gradient(145deg, rgba(39,39,42,0.9), rgba(24,24,27,0.95)); border: 1px solid rgba(63,63,70,0.3); }
        .cp-skeleton-img { width: 100%; height: 200px; background: linear-gradient(90deg, rgba(63,63,70,0.3) 25%, rgba(63,63,70,0.5) 50%, rgba(63,63,70,0.3) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .cp-skeleton-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, rgba(63,63,70,0.3) 25%, rgba(63,63,70,0.5) 50%, rgba(63,63,70,0.3) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 8px; }
        .cp-skeleton-line.short { width: 40%; }
        .cp-skeleton-line.medium { width: 70%; }
        .cp-skeleton-line.long { width: 100%; }
        .cp-skeleton-bar { height: 8px; border-radius: 4px; background: linear-gradient(90deg, rgba(63,63,70,0.3) 25%, rgba(63,63,70,0.5) 50%, rgba(63,63,70,0.3) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin: 12px 0; }

        .cp-cat-scroll { display: flex; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }
        .cp-cat-scroll::-webkit-scrollbar { display: none; }

        .cp-fee-preview { font-size: 12px; color: #a1a1aa; padding: 8px 12px; background: rgba(0,0,0,0.2); border-radius: 8px; text-align: center; margin-top: 8px; transition: all 0.3s; }
        .cp-fee-preview .fee-val { color: #f59e0b; font-weight: 600; }
        .cp-fee-preview .net-val { color: #10b981; font-weight: 600; }

        .cp-balance-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; }
        .cp-balance-row .bal { color: #a1a1aa; }
        .cp-balance-row .max-btn { color: #f59e0b; cursor: pointer; font-weight: 600; background: none; border: none; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
        .cp-balance-row .max-btn:hover { background: rgba(245,158,11,0.1); }

        @media(max-width:768px) {
            .cp-detail-content { grid-template-columns: 1fr; }
            .cp-detail-sidebar { order: -1; }
            .cp-form-row { grid-template-columns: 1fr; }
            .cp-cat-grid { grid-template-columns: repeat(2, 1fr); }
            .cp-carousel img, .cp-carousel video { height: 220px; }
        }
        @media(max-width:640px) {
            .cp-cat-scroll { flex-wrap: nowrap; }
            .cp-cat-scroll .cp-btn { white-space: nowrap; flex-shrink: 0; }
        }
    `;
    document.head.appendChild(s);
}

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (v) => {
    try {
        const n = typeof v === 'bigint' ? Number(v) / 1e18 : Number(v) / 1e18;
        if (n < 0.0001) return '0';
        if (n < 1) return n.toFixed(4);
        if (n < 1000) return n.toFixed(2);
        return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } catch { return '0'; }
};
const fmtAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '';
const calcProg = (r, g) => {
    const rn = typeof r === 'bigint' ? r : BigInt(r || 0);
    const gn = typeof g === 'bigint' ? g : BigInt(g || 1);
    if (gn === 0n) return 0;
    return Math.min(100, Number((rn * 100n) / gn));
};
const fmtTime = (d) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(d) - now;
    if (diff <= 0) return { text: 'Ended', color: '#ef4444' };
    const days = Math.floor(diff / 86400);
    if (days > 0) return { text: `${days}d left`, color: '#10b981' };
    const hours = Math.floor(diff / 3600);
    return { text: `${hours}h left`, color: '#f59e0b' };
};
const fmtBoostTime = (expiry) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiry - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400);
    if (days > 0) return `${days}d`;
    const hours = Math.floor(diff / 3600);
    return `${hours}h`;
};
const getCampImg = (c) => {
    if (c?.mediaUrls?.length > 0) {
        const img = c.mediaUrls.find(m => m.type === 'image');
        if (img) return img.url;
    }
    return c?.imageUrl || PLACEHOLDER_IMAGES[c?.category] || PLACEHOLDER_IMAGES.default;
};
const getShareUrl = (id) => {
    const base = `${window.location.origin}${window.location.pathname}#charity/${id}`;
    if (State?.userAddress) return `${base}?ref=${State.userAddress}`;
    return base;
};
const getIdFromUrl = () => { const h = window.location.hash; const m = h.match(/#charity\/(\d+)/); return m ? m[1] : null; };
const setUrl = (id) => { window.location.hash = `charity/${id}`; };
const clearUrl = () => { if (window.location.hash.startsWith('#charity/')) window.location.hash = 'charity'; };
const isCampaignActive = (c) => Number(c.status) === CampaignStatus.ACTIVE && Number(c.deadline) > Math.floor(Date.now() / 1000);
const canWithdrawCheck = (c) => {
    const status = Number(c.status);
    const ended = Number(c.deadline) <= Math.floor(Date.now() / 1000);
    return (status === CampaignStatus.ACTIVE || status === CampaignStatus.CLOSED) &&
           (ended || status === CampaignStatus.CLOSED) &&
           BigInt(c.raisedAmount || c.raised || 0) > 0n;
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function linkifyText(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener" class="text-amber-500 hover:text-amber-400" onclick="event.stopPropagation()">$1</a>');
    return html;
}

// Capture referral from URL
function captureReferral() {
    try {
        const hashParts = window.location.hash.split('?');
        if (hashParts.length < 2) return;
        const params = new URLSearchParams(hashParts[1]);
        const ref = params.get('ref');
        if (ref && ethers.isAddress(ref)) {
            localStorage.setItem('bkc_operator', ref);
            console.log('[Charity] Referral captured:', ref);
        }
    } catch {}
}

// ============================================================================
// LOCAL METADATA STORAGE
// ============================================================================

const META_PREFIX = 'charity-meta-';
function saveLocalMeta(id, meta) { try { localStorage.setItem(`${META_PREFIX}${id}`, JSON.stringify(meta)); } catch {} }
function getLocalMeta(id) { try { return JSON.parse(localStorage.getItem(`${META_PREFIX}${id}`) || 'null'); } catch { return null; } }

// ============================================================================
// DATA LOADING — V2: batch reads
// ============================================================================

async function loadData() {
    CS.isLoading = true;
    try {
        const [apiRes, stats] = await Promise.all([
            fetch(CHARITY_API.getCampaigns).then(r => r.json()).catch(() => ({ campaigns: [] })),
            loadStats()
        ]);

        const apiCampaigns = apiRes?.campaigns || [];

        let total = 0;
        try { total = await CharityTx.getCampaignCount(); } catch (e) {
            console.error('[CharityPage] getCampaignCount failed:', e);
        }

        if (total > 0) {
            // V2: Batch read struct data (no strings — too expensive on-chain)
            const batchSize = 50;
            let allBatch = [];
            for (let start = 1; start <= total; start += batchSize) {
                const count = Math.min(batchSize, total - start + 1);
                try {
                    const batch = await CharityTx.getCampaignsBatch(start, count);
                    allBatch = allBatch.concat(batch);
                } catch (e) {
                    console.warn('[CharityPage] getCampaignsBatch failed, falling back:', e.message);
                    // Fallback: individual reads
                    for (let i = start; i < start + count; i++) {
                        try {
                            const data = await CharityTx.getCampaign(i);
                            allBatch.push({ ...data, id: String(i) });
                        } catch {}
                    }
                }
            }

            // Merge with Firebase/local metadata
            CS.campaigns = allBatch.map(c => {
                const id = String(c.id);
                const apiData = apiCampaigns.find(x => String(x.id) === id);
                const localMeta = getLocalMeta(id);

                return {
                    ...c,
                    id,
                    title: apiData?.title || localMeta?.title || c.title || `Campaign #${id}`,
                    description: apiData?.description || localMeta?.description || c.metadataUri || '',
                    metadataUri: c.metadataUri || '',
                    category: apiData?.category || localMeta?.category || 'humanitarian',
                    imageUrl: apiData?.imageUrl || localMeta?.imageUrl || null,
                    mediaUrls: apiData?.mediaUrls || localMeta?.mediaUrls || []
                };
            });
        } else {
            CS.campaigns = [];
        }

        CS.stats = stats;
    } catch (e) {
        console.error('[CharityPage] loadData error:', e);
    } finally {
        CS.isLoading = false;
    }
}

async function loadStats() {
    try {
        const stats = await CharityTx.getStats();
        return {
            raised: stats.totalDonated,
            fees: stats.totalEthFees,
            created: stats.totalCampaigns,
            withdrawn: stats.totalWithdrawn,
            boostRevenue: stats.totalBoostRevenue
        };
    } catch (e) {
        console.error('[CharityPage] loadStats error:', e);
        return null;
    }
}

// ============================================================================
// MEDIA UPLOAD
// ============================================================================

async function uploadFile(file) {
    const result = await irysUploadFile(file, {
        tags: [{ name: 'Type', value: 'charity-media' }]
    });
    return result.url;
}

function handleMediaSelect(event) {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            showToast(`Unsupported file: ${file.name}`, 'error');
            continue;
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            showToast('Image must be less than 10MB', 'error');
            continue;
        }
        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            showToast('Video must be less than 100MB', 'error');
            continue;
        }

        const currentImages = CS.createMedia.filter(m => m.type === 'image').length;
        const currentVideos = CS.createMedia.filter(m => m.type === 'video').length;

        if (isImage && currentImages >= MAX_IMAGES) {
            showToast(`Maximum ${MAX_IMAGES} images`, 'warning');
            continue;
        }
        if (isVideo && currentVideos >= MAX_VIDEOS) {
            showToast(`Maximum ${MAX_VIDEOS} videos`, 'warning');
            continue;
        }

        const type = isVideo ? 'video' : 'image';
        const reader = new FileReader();
        reader.onload = (e) => {
            CS.createMedia.push({ file, url: null, type, preview: e.target.result });
            renderMediaPreview();
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

function removeMedia(index) {
    CS.createMedia.splice(index, 1);
    renderMediaPreview();
}

function renderMediaPreview() {
    const grid = document.getElementById('wiz-media-grid');
    if (!grid) return;

    if (CS.createMedia.length === 0) {
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = CS.createMedia.map((m, i) => `
        <div class="cp-media-thumb">
            ${m.type === 'video'
                ? `<video src="${m.preview}" muted></video>`
                : `<img src="${m.preview}" alt="media">`
            }
            <button class="cp-media-remove" onclick="event.stopPropagation();CharityPage.removeMedia(${i})">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <span class="cp-media-type">${m.type === 'video' ? 'VIDEO' : 'IMG'}</span>
        </div>
    `).join('');
}

// ============================================================================
// RENDER COMPONENTS
// ============================================================================

const renderBadge = (status) => {
    const s = STATUS_CONFIG[Number(status)] || STATUS_CONFIG[0];
    return `<span class="cp-badge" style="background:${s.color}20;color:${s.color}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
};
const renderBoostedBadge = (expiry) => {
    const remaining = fmtBoostTime(expiry);
    return `<span class="cp-badge cp-boosted-badge"><i class="fa-solid fa-rocket"></i> Boosted${remaining ? ` ${remaining}` : ''}</span>`;
};
const renderLoading = () => {
    const sk = `<div class="cp-skeleton-card"><div class="cp-skeleton-img"></div><div style="padding:1rem"><div class="cp-skeleton-line short"></div><div class="cp-skeleton-line long"></div><div class="cp-skeleton-bar"></div><div class="cp-skeleton-line medium"></div></div></div>`;
    return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${sk}${sk}${sk}</div>`;
};
const renderEmpty = (msg) => `<div class="cp-empty">
    <div style="font-size:4rem;margin-bottom:1rem;opacity:0.5"><i class="fa-solid fa-hand-holding-heart"></i></div>
    <h3 style="font-size:1.25rem;margin-bottom:0.5rem">${msg}</h3>
    <p class="text-zinc-500 text-sm" style="max-width:360px;margin:0 auto 1.5rem">Create a campaign to raise BNB for a cause you care about. Share it and earn referral rewards!</p>
    <button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()" style="margin:0 auto">
        <i class="fa-solid fa-plus"></i> Create Campaign
    </button>
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:1.5rem">
        ${Object.entries(CATEGORIES).map(([key, cat]) =>
            `<button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openCreate('${key}')" style="border-color:${cat.color}30">${cat.emoji} ${cat.name}</button>`
        ).join('')}
    </div>
</div>`;

const renderCard = (c) => {
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';

    return `
        <div class="cp-campaign-card ${c.isBoosted ? 'boosted' : ''}" onclick="CharityPage.viewCampaign('${c.id}')">
            <div class="cp-card-img-wrap">
                <img src="${getCampImg(c)}" alt="${escapeHtml(c.title || '')}" onerror="this.src='${PLACEHOLDER_IMAGES.default}'">
                <button class="cp-share-btn copy" style="position:absolute;top:10px;right:10px;width:32px;height:32px;font-size:12px;z-index:2"
                        onclick="event.stopPropagation();CharityPage.quickShare('${c.id}')">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
            </div>
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${renderBadge(c.status)}
                    <span class="cp-badge" style="background:${CATEGORIES[cat]?.color || '#888'}20;color:${CATEGORIES[cat]?.color || '#888'}">
                        ${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.name || cat}
                    </span>
                    ${c.isBoosted ? renderBoostedBadge(c.boostExpiry) : ''}
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${c.title || ''}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" class="text-amber-500 hover:text-amber-400" onclick="event.stopPropagation()">${fmtAddr(c.creator)}</a></p>
                <div class="cp-progress mb-2">
                    <div class="cp-progress-fill" style="width:${prog}%;background:linear-gradient(90deg,${CATEGORIES[cat]?.color || '#f59e0b'},${CATEGORIES[cat]?.color || '#d97706'}88)"></div>
                </div>
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-white font-semibold"><i class="fa-solid fa-coins text-zinc-500 mr-1"></i>${fmt(c.raisedAmount)} BNB</span>
                    <span class="text-zinc-500">${prog}% of ${fmt(c.goalAmount)}</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <span><i class="fa-solid fa-heart mr-1"></i>${c.donationCount || 0} donors</span>
                    <span style="color:${time.color}">${time.text}</span>
                </div>
            </div>
        </div>
    `;
};

// ============================================================================
// MAIN PAGE RENDER
// ============================================================================

const renderMain = () => {
    const active = CS.campaigns.filter(c => isCampaignActive(c));
    // Sort: boosted first (by boostExpiry desc), then by deadline
    const sorted = active
        .filter(c => !CS.selectedCategory || c.category === CS.selectedCategory)
        .sort((a, b) => {
            if (a.isBoosted && !b.isBoosted) return -1;
            if (!a.isBoosted && b.isBoosted) return 1;
            if (a.isBoosted && b.isBoosted) return (b.boostExpiry || 0) - (a.boostExpiry || 0);
            return Number(b.deadline || 0) - Number(a.deadline || 0);
        });

    const catEntries = Object.entries(CATEGORIES);

    return `
        <div class="charity-page">
            ${renderDonateModal()}
            ${renderBoostModal()}

            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-hand-holding-heart text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Charity Pool</h1>
                        <p class="text-sm text-zinc-500">Support causes with BNB &bull; Share & earn referral rewards</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()">
                        <i class="fa-solid fa-folder-open"></i> My Campaigns
                    </button>
                    <button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()">
                        <i class="fa-solid fa-plus"></i> Create
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-emerald-400 font-mono"><i class="fa-solid fa-coins text-lg mr-1"></i>${CS.stats ? fmt(CS.stats.raised) : '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Donated</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${CS.stats?.created ?? '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Campaigns</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-blue-400 font-mono"><i class="fa-solid fa-coins text-lg mr-1"></i>${CS.stats ? fmt(CS.stats.fees) : '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">BNB Fees</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-purple-400 font-mono"><i class="fa-solid fa-coins text-lg mr-1"></i>${CS.stats ? fmt(CS.stats.withdrawn) : '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Withdrawn</p>
                </div>
            </div>

            <!-- Categories -->
            <div class="cp-cat-scroll mb-6">
                <button class="cp-btn ${!CS.selectedCategory ? 'cp-btn-primary' : 'cp-btn-secondary'} text-xs py-2 px-3" onclick="CharityPage.clearCat()">
                    All
                </button>
                ${catEntries.map(([key, cat]) => `
                    <button class="cp-btn ${CS.selectedCategory === key ? 'cp-btn-primary' : 'cp-btn-secondary'} text-xs py-2 px-3"
                            onclick="CharityPage.selectCat('${key}')"
                            style="${CS.selectedCategory === key ? '' : `border-color:${cat.color}40`}">
                        ${cat.emoji} ${cat.name}
                    </button>
                `).join('')}
            </div>

            <!-- Campaigns Header -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-fire text-amber-500"></i>
                    ${CS.selectedCategory ? `${CATEGORIES[CS.selectedCategory]?.emoji} ${CATEGORIES[CS.selectedCategory]?.name}` : 'Active Campaigns'}
                </h2>
                <span class="text-xs text-zinc-500">${sorted.length} campaigns</span>
            </div>

            <!-- Campaigns Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${sorted.length ? sorted.map(c => renderCard(c)).join('') : renderEmpty('No active campaigns')}
            </div>
        </div>
    `;
};

// ============================================================================
// DETAIL PAGE
// ============================================================================

const renderCarousel = (c) => {
    const media = c.mediaUrls?.length > 0 ? c.mediaUrls : [{ url: getCampImg(c), type: 'image' }];
    if (media.length === 0) media.push({ url: getCampImg(c), type: 'image' });

    const idx = CS.carouselIndex % media.length;
    const item = media[idx];

    return `
        <div class="cp-carousel">
            ${item.type === 'video'
                ? `<video src="${item.url}" controls style="width:100%;height:350px;object-fit:cover;background:rgba(63,63,70,0.5)"></video>`
                : `<img src="${item.url}" alt="${c.title || ''}" style="width:100%;height:350px;object-fit:cover;background:rgba(63,63,70,0.5)" onerror="this.src='${PLACEHOLDER_IMAGES.default}'">`
            }
            ${media.length > 1 ? `
                <button class="cp-carousel-nav prev" onclick="CharityPage.carouselPrev()"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="cp-carousel-nav next" onclick="CharityPage.carouselNext()"><i class="fa-solid fa-chevron-right"></i></button>
                <div class="cp-carousel-dots">
                    ${media.map((_, i) => `<button class="cp-carousel-dot ${i === idx ? 'active' : ''}" onclick="CharityPage.carouselGo(${i})"></button>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
};

const renderDetail = (c) => {
    if (!c) return `
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <div class="cp-empty"><i class="fa-solid fa-circle-question"></i><h3>Campaign not found</h3></div>
        </div>`;

    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    const isActive = isCampaignActive(c);
    const isCreator = c.creator?.toLowerCase() === State?.userAddress?.toLowerCase();
    const canWd = canWithdrawCheck(c);

    return `
        <div class="charity-page">
            ${renderDonateModal()}
            ${renderBoostModal()}

            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
                    ${renderBadge(c.status)}
                    <span class="cp-badge" style="background:${CATEGORIES[cat]?.color || '#888'}20;color:${CATEGORIES[cat]?.color || '#888'}">
                        ${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.name || cat}
                    </span>
                    ${c.isBoosted ? renderBoostedBadge(c.boostExpiry) : ''}
                    ${isCreator ? '<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>' : ''}
                </div>

                ${renderCarousel(c)}

                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${c.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${fmtAddr(c.creator)}</a>
                        </p>
                        <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">${linkifyText(c.description || c.metadataUri || 'No description provided.')}</p>
                    </div>

                    <!-- Sidebar -->
                    <div class="cp-detail-sidebar">
                        <!-- Progress Card -->
                        <div class="cp-card-base p-5">
                            <div class="cp-progress h-3 mb-3">
                                <div class="cp-progress-fill" style="width:${prog}%"></div>
                            </div>
                            <p class="text-3xl font-bold text-white mb-1"><i class="fa-solid fa-coins text-zinc-500"></i> ${fmt(c.raisedAmount)} BNB</p>
                            <p class="text-sm text-zinc-500 mb-4">raised of ${fmt(c.goalAmount)} BNB goal (${prog}%)</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold text-white">${c.donationCount || 0}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">Donors</p>
                                </div>
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold" style="color:${time.color}">${time.text}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">${isActive ? 'Remaining' : 'Status'}</p>
                                </div>
                            </div>
                        </div>

                        ${isActive ? `
                        <!-- Donate Card -->
                        <div class="cp-card-base p-5">
                            <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <i class="fa-solid fa-heart text-emerald-500"></i> Make a Donation
                            </h4>
                            <div class="cp-balance-row">
                                <span class="bal">Balance: <span id="detail-bal">${State?.ethBalance ? Number(ethers.formatEther(State.ethBalance)).toFixed(4) : '--'}</span> BNB</span>
                                <button class="max-btn" onclick="CharityPage.setMax('detail-amount')">MAX</button>
                            </div>
                            <input type="number" id="detail-amount" placeholder="Amount in BNB" min="0.001" step="0.001"
                                   class="cp-form-input text-center text-lg font-bold mb-2"
                                   oninput="CharityPage.updateDonatePreview('detail-amount','detail-fee-preview')">
                            <div class="cp-donate-presets mb-3" id="detail-presets">
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.01,'detail-amount')">0.01</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.05,'detail-amount')">0.05</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.1,'detail-amount')">0.1</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.5,'detail-amount')">0.5</button>
                            </div>
                            <button id="btn-donate-detail" class="cp-btn cp-btn-success w-full" onclick="CharityPage.donateDetail('${c.id}')">
                                <i class="fa-solid fa-heart"></i> Donate Now
                            </button>
                            <div class="cp-fee-preview mt-2" id="detail-fee-preview">
                                ~<strong>5%</strong> platform fee &bull; ~<strong>95%</strong> to campaign
                            </div>
                        </div>
                        ` : ''}

                        ${isCreator && isActive ? `
                        <button id="btn-close-campaign" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.closeCampaign('${c.id}')">
                            <i class="fa-solid fa-xmark"></i> Close Campaign
                        </button>` : ''}

                        ${isCreator && canWd ? `
                        <button id="btn-withdraw" class="cp-btn cp-btn-primary w-full" onclick="CharityPage.withdraw('${c.id}')">
                            <i class="fa-solid fa-wallet"></i> Withdraw Funds
                        </button>` : ''}

                        ${isActive ? `
                        <button class="cp-btn cp-btn-secondary w-full" onclick="CharityPage.openBoost('${c.id}')">
                            <i class="fa-solid fa-rocket"></i> Boost Campaign
                        </button>` : ''}

                        <!-- Share -->
                        <div class="cp-share-box">
                            <p class="cp-share-title">Share this campaign & earn referral rewards</p>
                            <div class="cp-share-btns mb-3">
                                <button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')"><i class="fa-brands fa-x-twitter"></i></button>
                                <button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')"><i class="fa-brands fa-telegram"></i></button>
                                <button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')"><i class="fa-brands fa-whatsapp"></i></button>
                                <button class="cp-share-btn copy" onclick="CharityPage.copyLink()"><i class="fa-solid fa-link"></i></button>
                            </div>
                            ${State?.userAddress ? `
                            <div class="cp-ref-box">
                                <p class="text-[10px] text-amber-400 mb-1 font-semibold">Your referral link:</p>
                                <div class="cp-ref-link">
                                    <span class="flex-1 truncate">${getShareUrl(c.id)}</span>
                                    <button class="text-amber-500 hover:text-amber-400" onclick="CharityPage.copyLink()"><i class="fa-solid fa-copy"></i></button>
                                </div>
                                <p class="text-[9px] text-zinc-500 mt-1">Anyone who donates via your link earns you referral rewards!</p>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// ============================================================================
// MODALS
// ============================================================================

const renderDonateModal = () => `
    <div class="cp-modal" id="modal-donate" onclick="if(event.target===this) CharityPage.closeModal('donate')">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-heart text-emerald-500"></i> Donate</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body">
                <div id="donate-campaign-info"></div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Amount (BNB)</label>
                    <div class="cp-balance-row">
                        <span class="bal">Balance: <span id="donate-bal">${State?.ethBalance ? Number(ethers.formatEther(State.ethBalance)).toFixed(4) : '--'}</span> BNB</span>
                        <button class="max-btn" onclick="CharityPage.setMax('donate-amount')">MAX</button>
                    </div>
                    <div class="cp-donate-input-wrap">
                        <input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.1" min="0.001" step="0.001"
                               oninput="CharityPage.updateDonatePreview('donate-amount','donate-fee-preview')">
                        <span class="cp-donate-currency">BNB</span>
                    </div>
                    <div class="cp-donate-presets" id="donate-presets">
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.01,'donate-amount')">0.01</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.05,'donate-amount')">0.05</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.1,'donate-amount')">0.1</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.5,'donate-amount')">0.5</button>
                    </div>
                </div>
                <div class="cp-fee-preview" id="donate-fee-preview">
                    ~<strong>5%</strong> platform fee &bull; ~<strong>95%</strong> goes to campaign
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button>
                <button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button>
            </div>
        </div>
    </div>`;

const renderBoostModal = () => `
    <div class="cp-modal" id="modal-boost" onclick="if(event.target===this) CharityPage.closeModal('boost')">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-rocket text-amber-500"></i> Boost Campaign</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('boost')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body">
                <p class="text-sm text-zinc-400 mb-4">Boost this campaign to appear at the top. Duration stacks with existing boost.</p>
                <div class="cp-form-group">
                    <label class="cp-form-label">Duration: <strong id="boost-days-label">${CS.boostDays}</strong> days</label>
                    <input type="range" id="boost-days-slider" class="cp-boost-slider" min="1" max="30" value="${CS.boostDays}"
                           oninput="CharityPage.updateBoostDays(this.value)">
                    <div class="flex justify-between text-[10px] text-zinc-500"><span>1 day</span><span>30 days</span></div>
                </div>
                <div class="text-center p-4 bg-zinc-800/50 rounded-xl mb-4">
                    <p class="text-xs text-zinc-500 mb-1">Estimated cost</p>
                    <p class="text-2xl font-bold text-amber-400" id="boost-cost-display">
                        <i class="fa-solid fa-coins mr-1"></i><span id="boost-cost-value">...</span> BNB
                    </p>
                    <p class="text-[10px] text-zinc-600 mt-1" id="boost-per-day-display"></p>
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('boost')">Cancel</button>
                <button id="btn-boost" class="cp-btn cp-btn-primary" onclick="CharityPage.confirmBoost()">
                    <i class="fa-solid fa-rocket"></i> Boost
                </button>
            </div>
        </div>
    </div>`;

const renderMyCampaignsModal = () => `
    <div class="cp-modal" id="modal-my" onclick="if(event.target===this) CharityPage.closeModal('my')">
        <div class="cp-modal-content" style="max-width:600px">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-folder-open text-amber-500"></i> My Campaigns</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body" style="max-height:60vh;overflow-y:auto">
                <div id="my-campaigns-list"></div>
            </div>
        </div>
    </div>`;

// ============================================================================
// CREATE WIZARD (4-step)
// ============================================================================

const renderCreateWizard = () => `
    <div class="charity-page">
        <div class="flex items-center gap-4 mb-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.cancelCreate()"><i class="fa-solid fa-arrow-left"></i></button>
            <div>
                <h1 class="text-xl font-bold text-white">Create Campaign</h1>
                <p class="text-sm text-zinc-500">Step ${CS.createStep} of 4</p>
            </div>
        </div>
        <div class="cp-card-base p-5 mb-6">
            <div class="cp-step-container">
                <div class="cp-step-line ln-1" id="cp-ln-1"></div>
                <div class="cp-step-line ln-2" id="cp-ln-2"></div>
                <div class="cp-step-line ln-3" id="cp-ln-3"></div>
                ${[1,2,3,4].map(i => `
                    <div class="cp-step-item">
                        <div class="cp-step-dot ${CS.createStep > i ? 'done' : CS.createStep === i ? 'active' : 'pending'}" id="cp-step-${i}">
                            ${CS.createStep > i ? '<i class="fa-solid fa-check text-sm"></i>' : i}
                        </div>
                        <span class="text-[10px] text-zinc-500 mt-2">${['Category','Details','Media','Confirm'][i-1]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="cp-card-base p-6" id="cp-wiz-panel"></div>
    </div>`;

function renderCreateStepContent() {
    const panel = document.getElementById('cp-wiz-panel');
    if (!panel) return;
    switch (CS.createStep) {
        case 1: renderCreateStep1(panel); break;
        case 2: renderCreateStep2(panel); break;
        case 3: renderCreateStep3(panel); break;
        case 4: renderCreateStep4(panel); break;
    }
}

function renderCreateStep1(panel) {
    const cats = Object.entries(CATEGORIES);
    panel.innerHTML = `
        <h2 class="text-lg font-bold text-white mb-2">Choose a Category</h2>
        <p class="text-sm text-zinc-500 mb-6">Select what type of cause your campaign supports</p>
        <div class="cp-cat-grid">
            ${cats.map(([key, cat]) => `
                <div class="cp-wiz-cat-card ${CS.createCategory === key ? 'selected' : ''}" style="${CS.createCategory === key ? `border-color:${cat.color}` : ''}"
                     onclick="CharityPage.wizardSelectCategory('${key}')">
                    <div class="text-2xl mb-2">${cat.emoji}</div>
                    <div class="text-xs font-bold text-white">${cat.name}</div>
                </div>
            `).join('')}
        </div>
        <div class="flex justify-end mt-6">
            <button class="cp-btn cp-btn-primary ${!CS.createCategory ? 'opacity-50 cursor-not-allowed' : ''}"
                    onclick="CharityPage.wizardNext()" ${!CS.createCategory ? 'disabled' : ''}>
                Next <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>`;
}

function renderCreateStep2(panel) {
    panel.innerHTML = `
        <h2 class="text-lg font-bold text-white mb-2">Campaign Details</h2>
        <p class="text-sm text-zinc-500 mb-6">Tell your story — what is this campaign about?</p>
        <div class="cp-form-group">
            <label class="cp-form-label">Title *</label>
            <input type="text" id="wiz-title" class="cp-form-input" placeholder="Give your campaign a clear title" maxlength="100"
                   value="${CS.createTitle.replace(/"/g, '&quot;')}">
        </div>
        <div class="cp-form-group">
            <label class="cp-form-label">Description *</label>
            <textarea id="wiz-desc" class="cp-form-input cp-form-textarea" placeholder="Describe the cause, how funds will be used, and why it matters..."
                      maxlength="2000" style="min-height:140px">${CS.createDesc}</textarea>
        </div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button class="cp-btn cp-btn-primary" onclick="CharityPage.wizardNext()">Next <i class="fa-solid fa-arrow-right"></i></button>
        </div>`;
}

function renderCreateStep3(panel) {
    const imgCount = CS.createMedia.filter(m => m.type === 'image').length;
    const vidCount = CS.createMedia.filter(m => m.type === 'video').length;

    panel.innerHTML = `
        <h2 class="text-lg font-bold text-white mb-2">Campaign Media</h2>
        <p class="text-sm text-zinc-500 mb-4">Add images and videos to attract more donors <span class="text-zinc-600">(optional)</span></p>
        <p class="text-xs text-zinc-500 mb-4">
            <i class="fa-solid fa-image mr-1"></i> ${imgCount}/${MAX_IMAGES} images &bull;
            <i class="fa-solid fa-video mr-1"></i> ${vidCount}/${MAX_VIDEOS} videos
        </p>
        <div class="cp-media-upload" onclick="document.getElementById('wiz-media-file').click()">
            <input type="file" id="wiz-media-file" accept="image/*,video/mp4,video/webm,video/ogg" multiple onchange="CharityPage.handleMediaSelect(event)">
            <div style="font-size:2rem;color:#a1a1aa;margin-bottom:8px"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div style="font-size:13px;color:#a1a1aa"><span style="color:#f59e0b;font-weight:600">Click to upload</span> images or videos<br><small>PNG, JPG, GIF, WebP (10MB) &bull; MP4, WebM (100MB)</small></div>
        </div>
        <div class="cp-media-grid" id="wiz-media-grid"></div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <div class="flex gap-2">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardNext()">
                    ${CS.createMedia.length > 0 ? 'Next' : 'Skip'} <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>`;

    // Re-render media previews if any exist
    setTimeout(renderMediaPreview, 50);
}

function renderCreateStep4(panel) {
    const cat = CATEGORIES[CS.createCategory] || CATEGORIES.humanitarian;
    panel.innerHTML = `
        <h2 class="text-lg font-bold text-white mb-2">Confirm & Launch</h2>
        <p class="text-sm text-zinc-500 mb-6">Set your goal, duration and review before launching</p>
        <div class="cp-form-row mb-4">
            <div class="cp-form-group">
                <label class="cp-form-label">Goal (BNB) *</label>
                <input type="number" id="wiz-goal" class="cp-form-input" placeholder="1.0" min="0.01" step="0.01" value="${CS.createGoal}">
            </div>
            <div class="cp-form-group">
                <label class="cp-form-label">Duration (Days) * <span>1-365</span></label>
                <input type="number" id="wiz-duration" class="cp-form-input" placeholder="30" min="1" max="365" value="${CS.createDuration}">
            </div>
        </div>
        <div class="cp-wiz-summary mb-4">
            <h4 class="text-sm font-bold text-white mb-3"><i class="fa-solid fa-clipboard-list text-amber-500 mr-2"></i>Summary</h4>
            <div class="cp-wiz-summary-row"><span class="text-zinc-500">Category</span><span class="text-white">${cat.emoji} ${cat.name}</span></div>
            <div class="cp-wiz-summary-row"><span class="text-zinc-500">Title</span><span class="text-white truncate ml-4" style="max-width:200px">${CS.createTitle || '\u2014'}</span></div>
            <div class="cp-wiz-summary-row"><span class="text-zinc-500">Description</span><span class="text-white">${CS.createDesc ? `${CS.createDesc.length} chars` : '\u2014'}</span></div>
            <div class="cp-wiz-summary-row"><span class="text-zinc-500">Media</span><span class="text-white">${CS.createMedia.length > 0 ? `${CS.createMedia.length} files` : 'None'}</span></div>
        </div>
        <div class="text-center text-xs text-zinc-500 p-3 bg-zinc-800/50 rounded-xl mb-4">
            <i class="fa-solid fa-coins text-amber-400 mr-1"></i>
            Campaign creation requires a small <strong class="text-amber-400">BNB fee</strong> (gas + ecosystem fee)
        </div>
        <div class="flex justify-between mt-6">
            <button class="cp-btn cp-btn-secondary" onclick="CharityPage.wizardBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button id="btn-wizard-launch" class="cp-btn cp-btn-primary" onclick="CharityPage.wizardLaunch()">
                <i class="fa-solid fa-rocket"></i> Launch Campaign
            </button>
        </div>`;
}

// Wizard navigation
function wizardSelectCategory(cat) { CS.createCategory = cat; renderCreateStepContent(); }

function wizardNext() {
    switch (CS.createStep) {
        case 1: if (!CS.createCategory) return showToast('Select a category', 'error'); break;
        case 2: {
            const title = document.getElementById('wiz-title')?.value?.trim() || '';
            const desc = document.getElementById('wiz-desc')?.value?.trim() || '';
            CS.createTitle = title; CS.createDesc = desc;
            if (!title) return showToast('Enter a title', 'error');
            if (!desc) return showToast('Enter a description', 'error');
            break;
        }
    }
    CS.createStep = Math.min(4, CS.createStep + 1);
    renderCreateStepContent();
}

function wizardBack() {
    saveWizardStepData();
    CS.createStep = Math.max(1, CS.createStep - 1);
    renderCreateStepContent();
}

function cancelCreate() {
    CS.currentView = 'main'; CS.createStep = 1; CS.createCategory = null;
    CS.createTitle = ''; CS.createDesc = ''; CS.createGoal = ''; CS.createDuration = '';
    CS.createMedia = [];
    render();
}

function saveWizardStepData() {
    switch (CS.createStep) {
        case 2: {
            const t = document.getElementById('wiz-title');
            const d = document.getElementById('wiz-desc');
            if (t) CS.createTitle = t.value;
            if (d) CS.createDesc = d.value;
            break;
        }
        case 4: {
            const g = document.getElementById('wiz-goal');
            const dur = document.getElementById('wiz-duration');
            if (g) CS.createGoal = g.value;
            if (dur) CS.createDuration = dur.value;
            break;
        }
    }
}

async function wizardLaunch() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');

    const goal = document.getElementById('wiz-goal')?.value;
    const duration = document.getElementById('wiz-duration')?.value;
    CS.createGoal = goal || ''; CS.createDuration = duration || '';

    if (!CS.createCategory) return showToast('Select a category', 'error');
    if (!CS.createTitle) return showToast('Enter a title', 'error');
    if (!CS.createDesc) return showToast('Enter a description', 'error');
    if (!goal || parseFloat(goal) < 0.01) return showToast('Goal must be at least 0.01 BNB', 'error');
    if (!duration || parseInt(duration) < 1 || parseInt(duration) > 365) return showToast('Duration must be 1-365 days', 'error');

    // Upload media files to Arweave
    let mediaUrls = [];
    if (CS.createMedia.length > 0) {
        showToast(`Uploading ${CS.createMedia.length} file(s) to Arweave...`, 'info');
        for (const m of CS.createMedia) {
            if (m.file) {
                try {
                    const url = await uploadFile(m.file);
                    mediaUrls.push({ url, type: m.type });
                } catch (e) {
                    console.error('Upload failed:', e);
                    showToast(`Failed to upload ${m.type}: ${e.message}`, 'warning');
                }
            }
        }
        if (mediaUrls.length > 0) showToast(`${mediaUrls.length} file(s) uploaded!`, 'success');
    }

    const imageUrl = mediaUrls.find(m => m.type === 'image')?.url || '';
    const title = CS.createTitle;
    const desc = CS.createDesc;
    const category = CS.createCategory;
    const goalWei = ethers.parseEther(goal);
    const durationDays = parseInt(duration);

    await CharityTx.createCampaign({
        title, metadataUri: desc, goalAmount: goalWei, durationDays,
        button: document.getElementById('btn-wizard-launch'),
        onSuccess: async (receipt, campaignId) => {
            if (campaignId) {
                saveLocalMeta(campaignId, { imageUrl, category, title, description: desc, mediaUrls });
                try {
                    await fetch(CHARITY_API.saveCampaign, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: campaignId, title, description: desc, category, imageUrl, mediaUrls, creator: State.userAddress })
                    });
                } catch {}
            }
            showToast('Campaign created!', 'success');
            cancelCreate();
            await loadData();
            render();
        },
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                showToast(error.message?.slice(0, 80) || 'Failed', 'error');
            }
        }
    });
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

function openModal(id) { document.getElementById(`modal-${id}`)?.classList.add('active'); }
function closeModal(id) { document.getElementById(`modal-${id}`)?.classList.remove('active'); }

function openCreate(category = null) {
    CS.createStep = category ? 2 : 1;
    CS.createCategory = category;
    CS.createTitle = ''; CS.createDesc = ''; CS.createGoal = ''; CS.createDuration = '';
    CS.createMedia = [];
    CS.currentView = 'create';
    render();
}

function openDonate(id) {
    const c = CS.campaigns.find(x => x.id === id || x.id === String(id));
    if (!c) return;
    const infoEl = document.getElementById('donate-campaign-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl mb-4">
                <img src="${getCampImg(c)}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">${c.title}</p>
                    <p class="text-zinc-500 text-xs">${calcProg(c.raisedAmount, c.goalAmount)}% funded</p>
                </div>
            </div>`;
    }
    const amountInput = document.getElementById('donate-amount');
    if (amountInput) amountInput.value = '';
    CS.currentCampaign = c;
    openModal('donate');
}

function openMyCampaigns() {
    // Inject modal if needed
    let modal = document.getElementById('modal-my');
    if (!modal) {
        const div = document.createElement('div');
        div.innerHTML = renderMyCampaignsModal();
        document.body.appendChild(div.firstElementChild);
    }

    const userAddr = State?.userAddress?.toLowerCase();
    const myCampaigns = CS.campaigns.filter(c => c.creator?.toLowerCase() === userAddr);
    const listEl = document.getElementById('my-campaigns-list');
    if (!listEl) return;

    if (myCampaigns.length === 0) {
        listEl.innerHTML = `
            <div class="cp-empty">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No campaigns yet</h3>
                <p class="text-zinc-600 text-sm mb-4">Create your first campaign to start raising funds</p>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()">
                    <i class="fa-solid fa-plus"></i> Create Campaign
                </button>
            </div>`;
    } else {
        listEl.innerHTML = myCampaigns.map(c => {
            const prog = calcProg(c.raisedAmount, c.goalAmount);
            const canWd = canWithdrawCheck(c);
            const time = fmtTime(c.deadline);
            const isActive = isCampaignActive(c);
            return `
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${getCampImg(c)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${c.id}')">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${c.id}')" style="margin:0">${c.title}</p>
                            ${renderBadge(c.status)}
                        </div>
                        <p class="text-zinc-500 text-xs" style="margin:0">
                            <i class="fa-solid fa-coins"></i> <strong class="text-white">${fmt(c.raisedAmount)}</strong> / ${fmt(c.goalAmount)} BNB (${prog}%)
                            &bull; <span style="color:${time.color}">${time.text}</span>
                        </p>
                    </div>
                    <div class="flex gap-2">
                        ${isActive ? `<button class="cp-btn cp-btn-danger text-xs py-1.5 px-3" onclick="event.stopPropagation();CharityPage.closeCampaign('${c.id}')" title="Close"><i class="fa-solid fa-xmark"></i></button>` : ''}
                        ${canWd ? `<button id="btn-withdraw-${c.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="event.stopPropagation();CharityPage.withdraw('${c.id}')" title="Withdraw"><i class="fa-solid fa-wallet"></i></button>` : ''}
                    </div>
                </div>`;
        }).join('');
    }
    openModal('my');
}

function openBoost(id) {
    CS.boostCampaignId = id;
    CS.boostDays = 7;
    openModal('boost');
    updateBoostCost();
}

async function updateBoostDays(val) {
    CS.boostDays = parseInt(val);
    const label = document.getElementById('boost-days-label');
    if (label) label.textContent = CS.boostDays;
    await updateBoostCost();
}

async function updateBoostCost() {
    const costEl = document.getElementById('boost-cost-value');
    const perDayEl = document.getElementById('boost-per-day-display');
    if (!costEl) return;

    try {
        const cost = await CharityTx.getBoostCost(CS.boostDays);
        CS.boostCost = cost;
        costEl.textContent = cost.totalFeeFormatted;
        if (perDayEl) perDayEl.textContent = `${cost.feePerDayFormatted} BNB/day`;
    } catch (e) {
        costEl.textContent = '...';
        if (perDayEl) perDayEl.textContent = '';
    }
}

function setAmt(val, inputId) {
    const el = document.getElementById(inputId || 'donate-amount') || document.getElementById('detail-amount');
    if (el) {
        el.value = val;
        // Highlight active preset
        const presetsId = inputId === 'detail-amount' ? 'detail-presets' : 'donate-presets';
        const presets = document.getElementById(presetsId);
        if (presets) {
            presets.querySelectorAll('.cp-preset').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.trim() === String(val));
            });
        }
        // Trigger fee preview
        const previewId = inputId === 'detail-amount' ? 'detail-fee-preview' : 'donate-fee-preview';
        updateDonatePreview(inputId || 'donate-amount', previewId);
    }
}

function setMax(inputId) {
    if (!State?.ethBalance) return;
    // Leave some for gas (~0.001 BNB)
    const maxVal = Number(ethers.formatEther(State.ethBalance)) - 0.001;
    if (maxVal <= 0) { showToast('Insufficient BNB balance', 'error'); return; }
    const el = document.getElementById(inputId);
    if (el) {
        el.value = Math.floor(maxVal * 10000) / 10000; // 4 decimals
        const previewId = inputId === 'detail-amount' ? 'detail-fee-preview' : 'donate-fee-preview';
        updateDonatePreview(inputId, previewId);
    }
}

let _feePreviewTimer = null;
function updateDonatePreview(inputId, previewId) {
    clearTimeout(_feePreviewTimer);
    _feePreviewTimer = setTimeout(async () => {
        const el = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (!el || !preview) return;
        const val = parseFloat(el.value);
        if (!val || val < 0.001) {
            preview.innerHTML = '~<strong>5%</strong> platform fee &bull; ~<strong>95%</strong> goes to campaign';
            return;
        }
        try {
            const result = await CharityTx.previewDonation(ethers.parseEther(String(val)));
            preview.innerHTML = `Fee: <span class="fee-val">${result.feeFormatted} BNB</span> &bull; Campaign receives: <span class="net-val">${result.netFormatted} BNB</span>`;
        } catch {
            const fee = (val * 0.05).toFixed(4);
            const net = (val * 0.95).toFixed(4);
            preview.innerHTML = `Fee: <span class="fee-val">~${fee} BNB</span> &bull; Campaign receives: <span class="net-val">~${net} BNB</span>`;
        }
    }, 300);
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

async function donateAction() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    const c = CS.currentCampaign;
    if (!c) return;
    const amount = document.getElementById('donate-amount')?.value;
    if (!amount || parseFloat(amount) < 0.001) return showToast('Minimum 0.001 BNB', 'error');

    await CharityTx.donate({
        campaignId: c.id, amount: ethers.parseEther(amount),
        button: document.getElementById('btn-donate'),
        onSuccess: async () => {
            showToast('Thank you for your donation!', 'success');
            closeModal('donate');
            await loadData(); render();
        },
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') showToast(error.message?.slice(0, 80) || 'Failed', 'error');
        }
    });
}

async function donateDetail(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    const amount = document.getElementById('detail-amount')?.value;
    if (!amount || parseFloat(amount) < 0.001) return showToast('Minimum 0.001 BNB', 'error');

    await CharityTx.donate({
        campaignId: id, amount: ethers.parseEther(amount),
        button: document.getElementById('btn-donate-detail'),
        onSuccess: async () => {
            showToast('Thank you for your donation!', 'success');
            await loadData(); await loadDetail(id);
        },
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') showToast(error.message?.slice(0, 80) || 'Failed', 'error');
        }
    });
}

async function closeCampaignAction(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    if (!confirm('Close this campaign? You can still withdraw raised funds.')) return;

    await CharityTx.closeCampaign({
        campaignId: id,
        button: document.getElementById('btn-close-campaign'),
        onSuccess: async () => { showToast('Campaign closed', 'success'); await loadData(); render(); },
        onError: (error) => { if (!error.cancelled && error.type !== 'user_rejected') showToast(error.message?.slice(0, 80) || 'Failed', 'error'); }
    });
}

async function withdrawAction(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    const c = CS.campaigns.find(x => x.id === id || x.id === String(id));
    if (!c) return;
    if (!confirm(`Withdraw ${fmt(c.raisedAmount)} BNB?`)) return;

    await CharityTx.withdraw({
        campaignId: id,
        button: document.getElementById(`btn-withdraw-${id}`) || document.getElementById('btn-withdraw'),
        onSuccess: async () => {
            showToast('Funds withdrawn successfully!', 'success');
            closeModal('my');
            await loadData(); render();
            if (CS.currentCampaign?.id === id) await loadDetail(id);
        },
        onError: (error) => { if (!error.cancelled && error.type !== 'user_rejected') showToast(error.message?.slice(0, 80) || 'Failed', 'error'); }
    });
}

async function confirmBoost() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    const id = CS.boostCampaignId;
    if (!id) return;

    await CharityTx.boostCampaign({
        campaignId: id, days: CS.boostDays,
        button: document.getElementById('btn-boost'),
        onSuccess: async () => {
            showToast(`Campaign boosted for ${CS.boostDays} days!`, 'success');
            closeModal('boost');
            await loadData();
            if (CS.currentCampaign?.id === String(id)) await loadDetail(id);
            else render();
        },
        onError: (error) => { if (!error.cancelled && error.type !== 'user_rejected') showToast(error.message?.slice(0, 80) || 'Failed', 'error'); }
    });
}

// ============================================================================
// SHARING
// ============================================================================

function share(platform) {
    const c = CS.currentCampaign;
    if (!c) return;
    const url = getShareUrl(c.id);
    const txt = `Support "${c.title}" on Backcoin Charity!\n\n${fmt(c.raisedAmount)} BNB raised of ${fmt(c.goalAmount)} goal.\n\nDonate now and make a difference:\n`;

    // Try native share first on mobile
    if (platform === 'native' && navigator.share) {
        navigator.share({ title: c.title, text: txt, url }).catch(() => {});
        return;
    }

    let shareUrl;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`;
    else if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`;
    else if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(txt + url)}`;
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
}

function copyLink() {
    const c = CS.currentCampaign;
    if (!c) return;
    navigator.clipboard.writeText(getShareUrl(c.id))
        .then(() => showToast('Referral link copied!', 'success'))
        .catch(() => showToast('Copy failed', 'error'));
}

function quickShare(id) {
    const url = getShareUrl(id);
    if (navigator.share) {
        const c = CS.campaigns.find(x => x.id === id);
        navigator.share({ title: c?.title || 'Charity Campaign', url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url)
            .then(() => showToast('Referral link copied!', 'success'))
            .catch(() => showToast('Copy failed', 'error'));
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function goBack() { clearUrl(); CS.currentCampaign = null; CS.currentView = 'main'; CS.carouselIndex = 0; render(); }
function viewCampaign(id) { closeModal('my'); closeModal('donate'); closeModal('boost'); setUrl(id); loadDetail(id); }
function selectCat(cat) { CS.selectedCategory = CS.selectedCategory === cat ? null : cat; updateGrid(); }
function clearCat() { CS.selectedCategory = null; updateGrid(); }

function carouselPrev() {
    const c = CS.currentCampaign;
    if (!c) return;
    const media = c.mediaUrls?.length > 0 ? c.mediaUrls : [{ url: getCampImg(c), type: 'image' }];
    CS.carouselIndex = (CS.carouselIndex - 1 + media.length) % media.length;
    const carousel = document.querySelector('.cp-carousel');
    if (carousel) carousel.outerHTML = renderCarousel(c);
}

function carouselNext() {
    const c = CS.currentCampaign;
    if (!c) return;
    const media = c.mediaUrls?.length > 0 ? c.mediaUrls : [{ url: getCampImg(c), type: 'image' }];
    CS.carouselIndex = (CS.carouselIndex + 1) % media.length;
    const carousel = document.querySelector('.cp-carousel');
    if (carousel) carousel.outerHTML = renderCarousel(c);
}

function carouselGo(idx) {
    CS.carouselIndex = idx;
    const c = CS.currentCampaign;
    if (!c) return;
    const carousel = document.querySelector('.cp-carousel');
    if (carousel) carousel.outerHTML = renderCarousel(c);
}

function updateGrid() {
    const grid = document.getElementById('cp-grid');
    if (!grid) return;
    let active = CS.campaigns.filter(c => isCampaignActive(c));
    if (CS.selectedCategory) active = active.filter(c => c.category === CS.selectedCategory);
    active.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        if (a.isBoosted && b.isBoosted) return (b.boostExpiry || 0) - (a.boostExpiry || 0);
        return Number(b.deadline || 0) - Number(a.deadline || 0);
    });
    grid.innerHTML = active.length ? active.map(c => renderCard(c)).join('') : renderEmpty('No campaigns');
}

async function loadDetail(id) {
    CS.currentView = 'detail';
    CS.isLoading = true;
    CS.carouselIndex = 0;
    const container = getContainer();
    if (container) container.innerHTML = renderLoading();

    try {
        let c = CS.campaigns.find(x => x.id === id || x.id === String(id));
        if (!c) {
            try {
                const data = await CharityTx.getCampaign(id);
                const localMeta = getLocalMeta(id);
                c = {
                    ...data, id: String(id),
                    title: data.title || localMeta?.title || `Campaign #${id}`,
                    description: localMeta?.description || data.metadataUri || '',
                    category: localMeta?.category || 'humanitarian',
                    imageUrl: localMeta?.imageUrl || null,
                    mediaUrls: localMeta?.mediaUrls || []
                };
            } catch (e) {
                console.error(`[CharityPage] loadDetail(${id}) failed:`, e);
            }
        }
        CS.currentCampaign = c;
        if (container) container.innerHTML = renderDetail(c);
    } catch (e) {
        if (container) container.innerHTML = renderDetail(null);
    } finally {
        CS.isLoading = false;
    }
}

// ============================================================================
// CONTAINER & RENDER
// ============================================================================

function getContainer() {
    let container = document.getElementById('charity-container');
    if (container) return container;
    const charitySection = document.getElementById('charity');
    if (charitySection) {
        container = document.createElement('div');
        container.id = 'charity-container';
        charitySection.innerHTML = '';
        charitySection.appendChild(container);
        return container;
    }
    return null;
}

function render() {
    injectStyles();
    captureReferral();
    const container = getContainer();
    if (!container) return;

    if (CS.currentView === 'create') {
        container.innerHTML = renderCreateWizard();
        renderCreateStepContent();
        return;
    }

    const id = getIdFromUrl();
    if (id) {
        loadDetail(id);
    } else {
        CS.currentView = 'main';
        CS.currentCampaign = null;
        container.innerHTML = renderMain();
        loadData().then(() => {
            if (CS.currentView === 'main') {
                const c = getContainer();
                if (c) c.innerHTML = renderMain();
            }
        });
    }
}

async function refresh() {
    CS.campaigns = []; CS.stats = null;
    if (CS.currentView === 'detail' && CS.currentCampaign) {
        await loadDetail(CS.currentCampaign.id);
    } else {
        render();
    }
}

// Hash listener
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#charity')) {
        captureReferral();
        const id = getIdFromUrl();
        if (id) {
            if (CS.currentCampaign?.id !== id) loadDetail(id);
        } else if (CS.currentView !== 'main') {
            goBack();
        }
    }
});

// ============================================================================
// EXPORT
// ============================================================================

export const CharityPage = {
    render(isActive) { if (isActive) render(); },
    update() { if (CS.currentView === 'main') updateGrid(); },
    refresh, openModal, closeModal, openCreate, openDonate, openMyCampaigns, openBoost,
    donate: donateAction, donateDetail,
    closeCampaign: closeCampaignAction,
    withdraw: withdrawAction,
    boostCampaign: confirmBoost,
    confirmBoost,
    updateBoostDays,
    setAmt, setMax, updateDonatePreview,
    goBack, viewCampaign, selectCat, clearCat,
    share, copyLink, quickShare,
    // Carousel
    carouselPrev, carouselNext, carouselGo,
    // Media
    handleMediaSelect, removeMedia,
    // Wizard
    wizardSelectCategory, wizardNext, wizardBack, cancelCreate, wizardLaunch
};
