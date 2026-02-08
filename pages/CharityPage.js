// js/pages/CharityPage.js
// ✅ PRODUCTION V6.9 - Complete Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Charity Pool - Support Causes with ETH
// ═══════════════════════════════════════════════════════════════════════════════
//
// V6.9 Changes:
// - COMPLETE UI REDESIGN - Modern, clean, consistent with other pages
// - Improved card layout and animations
// - Better mobile responsiveness
// - Enhanced visual hierarchy
// - Smoother transitions and micro-interactions
// - Consistent styling with NetworkStakingPage and RewardsPage
//
// V6.8 Features (maintained):
// - ETH donations (not BKC)
// - 5% platform fee, 95% to campaign
// - Campaign editing for creators
// - Image upload support
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { CharityTx } from '../modules/transactions/index.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================

const CampaignStatus = { ACTIVE: 0, COMPLETED: 1, CANCELLED: 2, WITHDRAWN: 3 };
const StatusMap = { 'ACTIVE': 0, 'COMPLETED': 1, 'CANCELLED': 2, 'WITHDRAWN': 3 };

const normalizeStatus = (status) => {
    if (typeof status === 'number') return status;
    if (typeof status === 'string') {
        if (!isNaN(parseInt(status))) return parseInt(status);
        return StatusMap[status.toUpperCase()] ?? 0;
    }
    return 0;
};

const isCampaignActive = (c) => normalizeStatus(c.status) === 0 && Number(c.deadline) > Math.floor(Date.now() / 1000);

const charityPoolABI = [
    "function getCampaign(uint256 _campaignId) view returns (address creator, string title, string description, uint96 goalAmount, uint96 raisedAmount, uint32 donationCount, uint64 deadline, uint64 createdAt, uint96 boostAmount, uint64 boostTime, uint8 status, bool goalReached)",
    "function campaignCounter() view returns (uint64)",
    "function getStats() view returns (uint64 totalCampaigns, uint256 totalRaised, uint256 totalDonations, uint256 totalFees)"
];

const CHARITY_API = { 
    getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app', 
    saveCampaign: 'https://savecharitycampaign-4wvdcuoouq-uc.a.run.app',
    uploadImage: 'https://uploadcharityimage-4wvdcuoouq-uc.a.run.app'
};

const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

const PLACEHOLDER_IMAGES = { 
    animal: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80', 
    humanitarian: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80', 
    default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80' 
};

const CATEGORIES = { 
    animal: { name: 'Animal Welfare', emoji: '🐾', color: '#10b981', gradient: 'from-emerald-500/20 to-green-600/20' }, 
    humanitarian: { name: 'Humanitarian Aid', emoji: '💗', color: '#ec4899', gradient: 'from-pink-500/20 to-rose-600/20' } 
};

const STATUS_CONFIG = { 
    0: { label: 'Active', color: '#10b981', icon: 'fa-circle-play', bg: 'bg-emerald-500/15' }, 
    1: { label: 'Ended', color: '#3b82f6', icon: 'fa-circle-check', bg: 'bg-blue-500/15' }, 
    2: { label: 'Cancelled', color: '#ef4444', icon: 'fa-circle-xmark', bg: 'bg-red-500/15' }, 
    3: { label: 'Completed', color: '#8b5cf6', icon: 'fa-circle-dollar-to-slot', bg: 'bg-purple-500/15' } 
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
    pendingImage: null,
    pendingImageFile: null,
    editingCampaign: null
};

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('charity-styles-v6')) return;
    const s = document.createElement('style');
    s.id = 'charity-styles-v6';
    s.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           V6.9 Charity Page Styles - Modern & Clean
           ═══════════════════════════════════════════════════════════════════ */
        
        @keyframes float { 
            0%, 100% { transform: translateY(0); } 
            50% { transform: translateY(-6px); } 
        }
        @keyframes pulse-border {
            0%, 100% { border-color: rgba(245,158,11,0.3); }
            50% { border-color: rgba(245,158,11,0.6); }
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        
        .charity-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1.5rem 1rem;
            min-height: 400px;
        }
        
        /* Cards */
        .cp-card-base {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .cp-card-base:hover {
            border-color: rgba(245,158,11,0.3);
            transform: translateY(-2px);
        }
        
        /* Stats Cards */
        .cp-stat-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%);
            border: 1px solid rgba(63,63,70,0.4);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
        }
        
        /* Category Cards */
        .cp-category-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        .cp-category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .cp-category-card.animal:hover { border-color: #10b981; }
        .cp-category-card.humanitarian:hover { border-color: #ec4899; }
        .cp-category-card.selected { animation: pulse-border 2s ease-in-out infinite; }
        
        /* Campaign Cards */
        .cp-campaign-card {
            background: linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cp-campaign-card:hover {
            transform: translateY(-4px);
            border-color: rgba(245,158,11,0.4);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .cp-campaign-card img {
            width: 100%;
            height: 160px;
            object-fit: cover;
            background: rgba(63,63,70,0.5);
        }
        
        /* Progress Bar */
        .cp-progress {
            height: 8px;
            background: rgba(63,63,70,0.5);
            border-radius: 4px;
            overflow: hidden;
        }
        .cp-progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.6s ease;
        }
        .cp-progress-fill.animal { background: linear-gradient(90deg, #10b981, #059669); }
        .cp-progress-fill.humanitarian { background: linear-gradient(90deg, #ec4899, #db2777); }
        
        /* Badges */
        .cp-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        /* Buttons */
        .cp-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .cp-btn-primary {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
        }
        .cp-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(245,158,11,0.3);
        }
        
        .cp-btn-secondary {
            background: rgba(63,63,70,0.8);
            color: #fafafa;
            border: 1px solid rgba(63,63,70,0.8);
        }
        .cp-btn-secondary:hover:not(:disabled) {
            background: rgba(63,63,70,1);
        }
        
        .cp-btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
        }
        .cp-btn-success:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16,185,129,0.3);
        }
        
        .cp-btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
        }
        .cp-btn-danger:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(239,68,68,0.3);
        }
        
        /* Modal */
        .cp-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .cp-modal.active { display: flex; }
        .cp-modal-content {
            background: linear-gradient(145deg, rgba(39,39,42,0.98) 0%, rgba(24,24,27,0.99) 100%);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 20px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .cp-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            border-bottom: 1px solid rgba(63,63,70,0.5);
        }
        .cp-modal-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #fafafa;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
        }
        .cp-modal-close {
            background: none;
            border: none;
            color: #a1a1aa;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s;
        }
        .cp-modal-close:hover { color: #fafafa; }
        .cp-modal-body { padding: 1.25rem; }
        .cp-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 1rem 1.25rem;
            border-top: 1px solid rgba(63,63,70,0.5);
        }
        
        /* Form Elements */
        .cp-form-group { margin-bottom: 1rem; }
        .cp-form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #fafafa;
            margin-bottom: 6px;
        }
        .cp-form-label span { color: #a1a1aa; font-weight: 400; }
        .cp-form-input {
            width: 100%;
            padding: 12px 14px;
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 10px;
            color: #fafafa;
            font-size: 14px;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        .cp-form-input:focus {
            outline: none;
            border-color: rgba(245,158,11,0.6);
        }
        .cp-form-textarea { min-height: 100px; resize: vertical; }
        .cp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        /* Category Selector */
        .cp-cat-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cp-cat-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cp-cat-option:hover { border-color: rgba(245,158,11,0.4); }
        .cp-cat-option.selected {
            border-color: #f59e0b;
            background: rgba(245,158,11,0.1);
        }
        .cp-cat-option input { display: none; }
        .cp-cat-option-icon { font-size: 1.5rem; margin-bottom: 6px; }
        .cp-cat-option-name { font-size: 12px; font-weight: 600; color: #fafafa; }
        
        /* Donate Input */
        .cp-donate-input-wrap { position: relative; }
        .cp-donate-input {
            width: 100%;
            padding: 1rem;
            padding-right: 4rem;
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            background: rgba(0,0,0,0.4);
            border: 2px solid rgba(63,63,70,0.5);
            border-radius: 12px;
            color: #fafafa;
            box-sizing: border-box;
        }
        .cp-donate-input:focus { outline: none; border-color: rgba(16,185,129,0.6); }
        .cp-donate-currency {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #a1a1aa;
            font-weight: 600;
        }
        .cp-donate-presets { display: flex; gap: 8px; margin: 10px 0; }
        .cp-preset {
            flex: 1;
            padding: 8px;
            background: rgba(63,63,70,0.5);
            border: 1px solid rgba(63,63,70,0.8);
            border-radius: 8px;
            color: #fafafa;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cp-preset:hover { background: rgba(63,63,70,0.8); }
        
        /* Image Upload */
        .cp-image-upload {
            border: 2px dashed rgba(63,63,70,0.8);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(0,0,0,0.2);
        }
        .cp-image-upload:hover {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.05);
        }
        .cp-image-upload input { display: none; }
        .cp-image-upload-icon { font-size: 2rem; color: #a1a1aa; margin-bottom: 8px; }
        .cp-image-upload-text { font-size: 13px; color: #a1a1aa; }
        .cp-image-upload-text span { color: #f59e0b; font-weight: 600; }
        .cp-image-preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
        .cp-image-remove { background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; }
        
        /* Tabs */
        .cp-tabs { display: flex; gap: 8px; margin-bottom: 1rem; }
        .cp-tab {
            flex: 1;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(63,63,70,0.5);
            border-radius: 8px;
            color: #a1a1aa;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        .cp-tab.active {
            background: rgba(245,158,11,0.2);
            border-color: rgba(245,158,11,0.5);
            color: #f59e0b;
            font-weight: 600;
        }
        
        /* Detail Page */
        .cp-detail { max-width: 900px; margin: 0 auto; }
        .cp-detail-img {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 16px;
            margin-bottom: 1.5rem;
            background: rgba(63,63,70,0.5);
        }
        .cp-detail-content {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 1.5rem;
        }
        .cp-detail-sidebar { display: flex; flex-direction: column; gap: 1rem; }
        
        /* Share Box */
        .cp-share-box {
            background: rgba(63,63,70,0.3);
            border-radius: 12px;
            padding: 1rem;
        }
        .cp-share-title { font-size: 12px; color: #a1a1aa; margin-bottom: 10px; text-align: center; }
        .cp-share-btns { display: flex; justify-content: center; gap: 8px; }
        .cp-share-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .cp-share-btn:hover { transform: scale(1.1); }
        .cp-share-btn.twitter { background: #000; color: #fff; }
        .cp-share-btn.telegram { background: #0088cc; color: #fff; }
        .cp-share-btn.whatsapp { background: #25d366; color: #fff; }
        .cp-share-btn.copy { background: rgba(63,63,70,0.8); color: #fafafa; }
        
        /* Empty & Loading */
        .cp-empty { text-align: center; padding: 3rem 1rem; color: #a1a1aa; }
        .cp-empty i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.4; }
        .cp-empty h3 { color: #fafafa; margin: 0 0 8px; }
        .cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem; }
        .cp-spinner { width: 40px; height: 40px; border: 3px solid rgba(63,63,70,0.5); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Scrollbar */
        .cp-scrollbar::-webkit-scrollbar { width: 5px; }
        .cp-scrollbar::-webkit-scrollbar-track { background: rgba(39,39,42,0.5); border-radius: 3px; }
        .cp-scrollbar::-webkit-scrollbar-thumb { background: rgba(113,113,122,0.5); border-radius: 3px; }
        
        /* Responsive */
        @media(max-width:768px) {
            .cp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .cp-cats-grid { grid-template-columns: 1fr !important; }
            .cp-detail-content { grid-template-columns: 1fr; }
            .cp-detail-sidebar { order: -1; }
            .cp-form-row { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(s);
}

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (v) => { try { const n = Number(v) / 1e18; return n < 0.0001 ? '0' : n < 1 ? n.toFixed(4) : n < 1000 ? n.toFixed(2) : n.toLocaleString('en-US', { maximumFractionDigits: 2 }); } catch { return '0'; } };
const fmtAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '';
const calcProg = (r, g) => { const rn = Number(r || 0), gn = Number(g || 1); return Math.min(100, Math.round((rn / gn) * 100)); };
const fmtTime = (d) => { const now = Math.floor(Date.now() / 1000); const diff = Number(d) - now; if (diff <= 0) return { text: 'Ended', color: '#ef4444' }; const days = Math.floor(diff / 86400); if (days > 0) return { text: `${days}d left`, color: '#10b981' }; const hours = Math.floor(diff / 3600); return { text: `${hours}h left`, color: '#f59e0b' }; };
const getCampImg = (c) => c?.imageUrl || PLACEHOLDER_IMAGES[c?.category] || PLACEHOLDER_IMAGES.default;
const getShareUrl = (id) => `${window.location.origin}${window.location.pathname}#charity/${id}`;
const getIdFromUrl = () => { const h = window.location.hash; const m = h.match(/#charity\/(\d+)/); return m ? m[1] : null; };
const setUrl = (id) => { window.location.hash = `charity/${id}`; };
const clearUrl = () => { if (window.location.hash.startsWith('#charity/')) window.location.hash = 'charity'; };
const canWithdraw = (c) => { const status = normalizeStatus(c.status); const ended = Number(c.deadline) <= Math.floor(Date.now() / 1000); return (status === 0 || status === 1) && ended && !c.withdrawn && BigInt(c.raisedAmount || 0) > 0n; };

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadData() {
    CS.isLoading = true;
    try {
        const [apiRes, stats] = await Promise.all([
            fetch(CHARITY_API.getCampaigns).then(r => r.json()).catch(() => ({ campaigns: [] })),
            loadStats()
        ]);
        
        const apiCampaigns = apiRes?.campaigns || [];
        const provider = State?.publicProvider;
        
        if (provider) {
            const contract = new ethers.Contract(addresses.charityPool, charityPoolABI, provider);
            const counter = await contract.campaignCounter();
            const total = Number(counter);
            
            const onChainCampaigns = await Promise.all(
                Array.from({ length: total }, (_, i) => i + 1).map(async (id) => {
                    try {
                        const data = await contract.getCampaign(id);
                        const apiData = apiCampaigns.find(c => String(c.id) === String(id));
                        return {
                            id: String(id),
                            creator: data.creator || data[0],
                            title: apiData?.title || data.title || data[1] || `Campaign #${id}`,
                            description: apiData?.description || data.description || data[2] || '',
                            goalAmount: BigInt((data.goalAmount || data[3]).toString()),
                            raisedAmount: BigInt((data.raisedAmount || data[4]).toString()),
                            donationCount: Number(data.donationCount || data[5]),
                            deadline: Number(data.deadline || data[6]),
                            createdAt: Number(data.createdAt || data[7]),
                            status: Number(data.status || data[10]),
                            category: apiData?.category || 'humanitarian',
                            imageUrl: apiData?.imageUrl || null
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );
            
            CS.campaigns = onChainCampaigns.filter(Boolean);
        }
        
        CS.stats = stats;
    } catch (e) {
        console.error('Load data:', e);
    } finally {
        CS.isLoading = false;
    }
}

async function loadStats() {
    try {
        const provider = State?.publicProvider;
        if (!provider) return null;

        const contract = new ethers.Contract(addresses.charityPool, charityPoolABI, provider);
        const stats = await contract.getStats();

        return {
            raised: stats.totalRaised ?? stats[1],
            fees: stats.totalFees ?? stats[3],
            created: Number(stats.totalCampaigns ?? stats[0]),
            donations: Number(stats.totalDonations ?? stats[2])
        };
    } catch (e) {
        return null;
    }
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

function handleImageSelect(event, inputType = 'create') {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToast('Please select a valid image (JPG, PNG, GIF, WebP)', 'error');
        return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
        showToast('Image must be less than 5MB', 'error');
        return;
    }
    
    CS.pendingImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewId = inputType === 'edit' ? 'edit-image-preview' : 'create-image-preview';
        const uploadEl = document.getElementById(inputType === 'edit' ? 'edit-image-upload' : 'create-image-upload');
        const previewEl = document.getElementById(previewId);
        
        if (previewEl) {
            previewEl.innerHTML = `
                <img src="${e.target.result}" class="cp-image-preview">
                <button type="button" class="cp-image-remove" onclick="CharityPage.removeImage('${inputType}')">
                    <i class="fa-solid fa-xmark"></i> Remove
                </button>
            `;
        }
        if (uploadEl) uploadEl.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

function removeImage(inputType = 'create') {
    CS.pendingImageFile = null;
    CS.pendingImage = null;
    
    const previewId = inputType === 'edit' ? 'edit-image-preview' : 'create-image-preview';
    const uploadEl = document.getElementById(inputType === 'edit' ? 'edit-image-upload' : 'create-image-upload');
    const previewEl = document.getElementById(previewId);
    
    if (previewEl) previewEl.innerHTML = '';
    if (uploadEl) uploadEl.classList.remove('has-image');
    
    const fileInput = document.getElementById(inputType === 'edit' ? 'edit-image-file' : 'create-image-file');
    if (fileInput) fileInput.value = '';
}

function switchImageTab(tab, context = 'create') {
    const tabs = document.querySelectorAll(`#${context}-image-tabs .cp-tab`);
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    
    const uploadEl = document.getElementById(`${context}-image-upload`);
    const urlWrap = document.getElementById(`${context}-image-url-wrap`);
    
    if (uploadEl) uploadEl.style.display = tab === 'upload' ? 'block' : 'none';
    if (urlWrap) urlWrap.style.display = tab === 'url' ? 'block' : 'none';
}

async function uploadImageToServer(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(CHARITY_API.uploadImage, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.imageUrl;
}

// ============================================================================
// RENDER COMPONENTS
// ============================================================================

const renderBadge = (status) => {
    const s = STATUS_CONFIG[normalizeStatus(status)] || STATUS_CONFIG[0];
    return `<span class="cp-badge" style="background:${s.color}20;color:${s.color}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
};

const renderLoading = () => `<div class="cp-loading"><div class="cp-spinner"></div><span class="text-zinc-500">Loading campaigns...</span></div>`;
const renderEmpty = (msg) => `<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${msg}</h3><p class="text-zinc-600 text-sm">Be the first to create a campaign!</p></div>`;

const renderCard = (c) => {
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    
    return `
        <div class="cp-campaign-card" onclick="CharityPage.viewCampaign('${c.id}')">
            <img src="${getCampImg(c)}" alt="${c.title}" onerror="this.src='${PLACEHOLDER_IMAGES.default}'">
            <div class="p-4">
                <div class="flex flex-wrap gap-1.5 mb-2">
                    ${renderBadge(c.status)}
                    <span class="cp-badge" style="background:${CATEGORIES[cat]?.color}20;color:${CATEGORIES[cat]?.color}">
                        ${CATEGORIES[cat]?.emoji} ${CATEGORIES[cat]?.name}
                    </span>
                </div>
                <h3 class="text-white font-bold text-sm mb-1 line-clamp-2">${c.title}</h3>
                <p class="text-zinc-500 text-xs mb-3">by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${fmtAddr(c.creator)}</a></p>
                <div class="cp-progress mb-2">
                    <div class="cp-progress-fill ${cat}" style="width:${prog}%"></div>
                </div>
                <div class="flex justify-between text-xs mb-3">
                    <span class="text-white font-semibold"><i class="fa-brands fa-ethereum text-zinc-500 mr-1"></i>${fmt(c.raisedAmount)} ETH</span>
                    <span class="text-zinc-500">${prog}% of ${fmt(c.goalAmount)}</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <span><i class="fa-solid fa-heart mr-1"></i>${c.donationCount || 0}</span>
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
    const animal = active.filter(c => c.category === 'animal');
    const humanitarian = active.filter(c => c.category === 'humanitarian');
    
    return `
        <div class="charity-page">
            ${renderCreateModal()}
            ${renderMyCampaignsModal()}
            ${renderEditModal()}
            ${renderDonateModal()}
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center float-animation">
                        <i class="fa-solid fa-hand-holding-heart text-2xl text-amber-400"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Charity Pool</h1>
                        <p class="text-sm text-zinc-500">Support causes with ETH • 95% goes directly to campaigns</p>
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
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 cp-stats-grid">
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-emerald-400 font-mono">
                        <i class="fa-brands fa-ethereum text-lg mr-1"></i>${CS.stats ? fmt(CS.stats.raised) : '--'}
                    </p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Total Raised</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-blue-400 font-mono">${CS.stats ? fmt(CS.stats.fees) : '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Platform Fees</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-amber-400 font-mono">${CS.stats?.created ?? '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Campaigns</p>
                </div>
                <div class="cp-stat-card">
                    <p class="text-2xl font-bold text-purple-400 font-mono">${CS.stats?.donations ?? '--'}</p>
                    <p class="text-[10px] text-zinc-500 uppercase mt-1">Donations</p>
                </div>
            </div>
            
            <!-- Categories -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 cp-cats-grid">
                <div class="cp-category-card animal ${CS.selectedCategory === 'animal' ? 'selected' : ''}" onclick="CharityPage.selectCat('animal')">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">🐾</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Animal Welfare</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${animal.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${fmt(animal.reduce((s,c)=>s+BigInt(c.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('animal')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
                
                <div class="cp-category-card humanitarian ${CS.selectedCategory === 'humanitarian' ? 'selected' : ''}" onclick="CharityPage.selectCat('humanitarian')">
                    <div class="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                        <span class="text-3xl">💗</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Humanitarian Aid</h3>
                    <div class="flex justify-center gap-6 text-sm text-zinc-400 mb-3">
                        <span><strong class="text-white">${humanitarian.length}</strong> active</span>
                        <span><i class="fa-brands fa-ethereum"></i> <strong class="text-white">${fmt(humanitarian.reduce((s,c)=>s+BigInt(c.raisedAmount||0),0n))}</strong></span>
                    </div>
                    <button class="cp-btn cp-btn-success text-xs py-2 px-4" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')">
                        <i class="fa-solid fa-plus"></i> Create Campaign
                    </button>
                </div>
            </div>
            
            <!-- Campaigns Grid -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    ${CS.selectedCategory ? `
                        <button onclick="CharityPage.clearCat()" class="text-zinc-500 hover:text-white transition-colors">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        ${CATEGORIES[CS.selectedCategory]?.emoji} ${CATEGORIES[CS.selectedCategory]?.name}
                    ` : `
                        <i class="fa-solid fa-fire text-amber-500"></i> Active Campaigns
                    `}
                </h2>
                <span class="text-xs text-zinc-500">${active.filter(c => !CS.selectedCategory || c.category === CS.selectedCategory).length} campaigns</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="cp-grid">
                ${active.length ? 
                    active
                        .filter(c => !CS.selectedCategory || c.category === CS.selectedCategory)
                        .sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0))
                        .map(c => renderCard(c)).join('') 
                    : renderEmpty('No active campaigns')
                }
            </div>
        </div>
    `;
};

// ============================================================================
// DETAIL PAGE RENDER
// ============================================================================

const renderDetail = (c) => {
    if (!c) return `
        <div class="charity-page">
            <button class="cp-btn cp-btn-secondary mb-6" onclick="CharityPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <div class="cp-empty">
                <i class="fa-solid fa-circle-question"></i>
                <h3>Campaign not found</h3>
            </div>
        </div>
    `;
    
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    const isActive = isCampaignActive(c);
    const isCreator = c.creator?.toLowerCase() === State?.userAddress?.toLowerCase();
    const canWd = canWithdraw(c);
    
    return `
        <div class="charity-page">
            ${renderDonateModal()}
            ${renderEditModal()}
            
            <div class="cp-detail">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                    <button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    ${renderBadge(c.status)}
                    <span class="cp-badge" style="background:${CATEGORIES[cat]?.color}20;color:${CATEGORIES[cat]?.color}">
                        ${CATEGORIES[cat]?.emoji} ${CATEGORIES[cat]?.name}
                    </span>
                    ${isCreator ? '<span class="cp-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b"><i class="fa-solid fa-user"></i> Your Campaign</span>' : ''}
                    ${isCreator ? `
                        <button class="cp-btn cp-btn-secondary text-xs py-2 ml-auto" onclick="CharityPage.openEdit('${c.id}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    ` : ''}
                </div>
                
                <img src="${getCampImg(c)}" class="cp-detail-img" onerror="this.src='${PLACEHOLDER_IMAGES.default}'">
                
                <div class="cp-detail-content">
                    <!-- Main Content -->
                    <div class="cp-card-base p-6">
                        <h1 class="text-2xl font-bold text-white mb-2">${c.title}</h1>
                        <p class="text-sm text-zinc-500 mb-4">
                            Created by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" class="text-amber-500 hover:text-amber-400">${fmtAddr(c.creator)}</a>
                        </p>
                        <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">${c.description || 'No description provided.'}</p>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="cp-detail-sidebar">
                        <!-- Progress Card -->
                        <div class="cp-card-base p-5">
                            <div class="cp-progress h-3 mb-3">
                                <div class="cp-progress-fill ${cat}" style="width:${prog}%"></div>
                            </div>
                            <p class="text-3xl font-bold text-white mb-1">
                                <i class="fa-brands fa-ethereum text-zinc-500"></i> ${fmt(c.raisedAmount)} ETH
                            </p>
                            <p class="text-sm text-zinc-500 mb-4">raised of ${fmt(c.goalAmount)} ETH goal (${prog}%)</p>
                            
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center p-3 bg-zinc-800/50 rounded-xl">
                                    <p class="text-lg font-bold text-white">${c.donationCount || 0}</p>
                                    <p class="text-[10px] text-zinc-500 uppercase">Donations</p>
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
                            <input type="number" id="detail-amount" placeholder="Amount in ETH" min="0.001" step="0.001"
                                   class="cp-form-input text-center text-lg font-bold mb-2">
                            <div class="cp-donate-presets mb-3">
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.01)">0.01</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.05)">0.05</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.1)">0.1</button>
                                <button class="cp-preset" onclick="CharityPage.setAmt(0.5)">0.5</button>
                            </div>
                            <button id="btn-donate-detail" class="cp-btn cp-btn-success w-full" onclick="CharityPage.donateDetail('${c.id}')">
                                <i class="fa-solid fa-heart"></i> Donate Now
                            </button>
                            <p class="text-center text-[10px] text-zinc-500 mt-2">
                                <strong>5%</strong> platform fee • <strong>95%</strong> to campaign
                            </p>
                        </div>
                        ` : ''}
                        
                        ${isCreator && isActive ? `
                        <button id="btn-cancel" class="cp-btn cp-btn-danger w-full" onclick="CharityPage.cancel('${c.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Campaign
                        </button>
                        ` : ''}
                        
                        ${isCreator && canWd ? `
                        <button id="btn-withdraw" class="cp-btn cp-btn-primary w-full" onclick="CharityPage.withdraw('${c.id}')">
                            <i class="fa-solid fa-wallet"></i> Withdraw Funds
                        </button>
                        ` : ''}
                        
                        <!-- Share -->
                        <div class="cp-share-box">
                            <p class="cp-share-title">Share this campaign</p>
                            <div class="cp-share-btns">
                                <button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')">
                                    <i class="fa-brands fa-x-twitter"></i>
                                </button>
                                <button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')">
                                    <i class="fa-brands fa-telegram"></i>
                                </button>
                                <button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')">
                                    <i class="fa-brands fa-whatsapp"></i>
                                </button>
                                <button class="cp-share-btn copy" onclick="CharityPage.copyLink()">
                                    <i class="fa-solid fa-link"></i>
                                </button>
                            </div>
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

const renderCreateModal = () => `
    <div class="cp-modal" id="modal-create">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-plus text-amber-500"></i> Create Campaign</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('create')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body cp-scrollbar" style="max-height:60vh;overflow-y:auto">
                <div class="cp-form-group">
                    <label class="cp-form-label">Category *</label>
                    <div class="cp-cat-selector">
                        <label class="cp-cat-option" id="opt-animal" onclick="CharityPage.selCatOpt('animal')">
                            <input type="radio" name="category" value="animal">
                            <div class="cp-cat-option-icon">🐾</div>
                            <div class="cp-cat-option-name">Animal</div>
                        </label>
                        <label class="cp-cat-option selected" id="opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian')">
                            <input type="radio" name="category" value="humanitarian" checked>
                            <div class="cp-cat-option-icon">💗</div>
                            <div class="cp-cat-option-name">Humanitarian</div>
                        </label>
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Campaign Image <span>(optional)</span></label>
                    <div class="cp-tabs" id="create-image-tabs">
                        <button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','create')">Upload</button>
                        <button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','create')">URL</button>
                    </div>
                    <div class="cp-image-upload" id="create-image-upload" onclick="document.getElementById('create-image-file').click()">
                        <input type="file" id="create-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'create')">
                        <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <div class="cp-image-upload-text"><span>Click to upload</span> or drag and drop<br><small>PNG, JPG, GIF up to 5MB</small></div>
                        <div id="create-image-preview"></div>
                    </div>
                    <div id="create-image-url-wrap" style="display:none">
                        <input type="url" id="campaign-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg">
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Title *</label>
                    <input type="text" id="campaign-title" class="cp-form-input" placeholder="Campaign title" maxlength="100">
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Description *</label>
                    <textarea id="campaign-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." maxlength="2000"></textarea>
                </div>
                <div class="cp-form-row">
                    <div class="cp-form-group">
                        <label class="cp-form-label">Goal (ETH) *</label>
                        <input type="number" id="campaign-goal" class="cp-form-input" placeholder="1.0" min="0.01" step="0.01">
                    </div>
                    <div class="cp-form-group">
                        <label class="cp-form-label">Duration (Days) *</label>
                        <input type="number" id="campaign-duration" class="cp-form-input" placeholder="30" min="1" max="180">
                    </div>
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('create')">Cancel</button>
                <button id="btn-create" class="cp-btn cp-btn-primary" onclick="CharityPage.create()"><i class="fa-solid fa-rocket"></i> Launch</button>
            </div>
        </div>
    </div>
`;

const renderDonateModal = () => `
    <div class="cp-modal" id="modal-donate">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-heart text-emerald-500"></i> Donate</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body">
                <div id="donate-campaign-info"></div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Amount (ETH)</label>
                    <div class="cp-donate-input-wrap">
                        <input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.1" min="0.001" step="0.001">
                        <span class="cp-donate-currency">ETH</span>
                    </div>
                    <div class="cp-donate-presets">
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.01)">0.01</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.05)">0.05</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.1)">0.1</button>
                        <button class="cp-preset" onclick="CharityPage.setAmt(0.5)">0.5</button>
                    </div>
                </div>
                <div class="text-center text-xs text-zinc-500 p-3 bg-zinc-800/50 rounded-xl">
                    <strong>5%</strong> platform fee • <strong>95%</strong> goes to campaign
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button>
                <button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button>
            </div>
        </div>
    </div>
`;

const renderMyCampaignsModal = () => `
    <div class="cp-modal" id="modal-my">
        <div class="cp-modal-content" style="max-width:600px">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-folder-open text-amber-500"></i> My Campaigns</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body cp-scrollbar" style="max-height:60vh;overflow-y:auto">
                <div id="my-campaigns-list"></div>
            </div>
        </div>
    </div>
`;

const renderEditModal = () => `
    <div class="cp-modal" id="modal-edit">
        <div class="cp-modal-content">
            <div class="cp-modal-header">
                <h3 class="cp-modal-title"><i class="fa-solid fa-pen text-amber-500"></i> Edit Campaign</h3>
                <button class="cp-modal-close" onclick="CharityPage.closeModal('edit')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cp-modal-body cp-scrollbar" style="max-height:60vh;overflow-y:auto">
                <input type="hidden" id="edit-campaign-id">
                <div class="cp-form-group">
                    <label class="cp-form-label">Category</label>
                    <div class="cp-cat-selector">
                        <label class="cp-cat-option" id="edit-opt-animal" onclick="CharityPage.selCatOpt('animal','edit')">
                            <input type="radio" name="edit-category" value="animal">
                            <div class="cp-cat-option-icon">🐾</div>
                            <div class="cp-cat-option-name">Animal</div>
                        </label>
                        <label class="cp-cat-option" id="edit-opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian','edit')">
                            <input type="radio" name="edit-category" value="humanitarian">
                            <div class="cp-cat-option-icon">💗</div>
                            <div class="cp-cat-option-name">Humanitarian</div>
                        </label>
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Image</label>
                    <div class="cp-tabs" id="edit-image-tabs">
                        <button type="button" class="cp-tab active" data-tab="upload" onclick="CharityPage.switchImageTab('upload','edit')">Upload</button>
                        <button type="button" class="cp-tab" data-tab="url" onclick="CharityPage.switchImageTab('url','edit')">URL</button>
                    </div>
                    <div class="cp-image-upload" id="edit-image-upload" onclick="document.getElementById('edit-image-file').click()">
                        <input type="file" id="edit-image-file" accept="image/*" onchange="CharityPage.handleImageSelect(event,'edit')">
                        <div class="cp-image-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <div class="cp-image-upload-text"><span>Click to upload</span> new image</div>
                        <div id="edit-image-preview"></div>
                    </div>
                    <div id="edit-image-url-wrap" style="display:none">
                        <input type="url" id="edit-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg">
                    </div>
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Title</label>
                    <input type="text" id="edit-title" class="cp-form-input" maxlength="100">
                </div>
                <div class="cp-form-group">
                    <label class="cp-form-label">Description</label>
                    <textarea id="edit-desc" class="cp-form-input cp-form-textarea" maxlength="2000"></textarea>
                </div>
            </div>
            <div class="cp-modal-footer">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('edit')">Cancel</button>
                <button id="btn-save-edit" class="cp-btn cp-btn-primary" onclick="CharityPage.saveEdit()"><i class="fa-solid fa-check"></i> Save</button>
            </div>
        </div>
    </div>
`;

// ============================================================================
// MODAL HANDLERS
// ============================================================================

function openModal(id) { document.getElementById(`modal-${id}`)?.classList.add('active'); }
function closeModal(id) { document.getElementById(`modal-${id}`)?.classList.remove('active'); }

function openCreate(category = 'humanitarian') {
    CS.pendingImage = null;
    CS.pendingImageFile = null;
    removeImage('create');
    
    document.querySelectorAll('#modal-create .cp-cat-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`opt-${category}`)?.classList.add('selected');
    
    ['campaign-title', 'campaign-desc', 'campaign-goal', 'campaign-duration', 'campaign-image-url'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    openModal('create');
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
            </div>
        `;
    }
    
    const amountInput = document.getElementById('donate-amount');
    if (amountInput) amountInput.value = '';
    
    CS.currentCampaign = c;
    openModal('donate');
}

function openMyCampaigns() {
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
            </div>
        `;
    } else {
        listEl.innerHTML = myCampaigns.map(c => {
            const prog = calcProg(c.raisedAmount, c.goalAmount);
            const canWd = canWithdraw(c);
            
            return `
                <div class="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl mb-2 hover:bg-zinc-800/50 transition-colors">
                    <img src="${getCampImg(c)}" class="w-14 h-14 rounded-lg object-cover cursor-pointer" onclick="CharityPage.viewCampaign('${c.id}')">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold text-sm truncate cursor-pointer hover:text-amber-400" onclick="CharityPage.viewCampaign('${c.id}')">${c.title}</p>
                        <p class="text-zinc-500 text-xs"><i class="fa-brands fa-ethereum"></i> ${fmt(c.raisedAmount)} / ${fmt(c.goalAmount)} ETH (${prog}%)</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="cp-btn cp-btn-secondary text-xs py-1.5 px-3" onclick="CharityPage.openEdit('${c.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${canWd ? `
                            <button id="btn-withdraw-${c.id}" class="cp-btn cp-btn-primary text-xs py-1.5 px-3" onclick="CharityPage.withdraw('${c.id}')">
                                <i class="fa-solid fa-wallet"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openModal('my');
}

function openEdit(id) {
    const c = CS.campaigns.find(x => x.id === id || x.id === String(id));
    if (!c) return;
    if (c.creator?.toLowerCase() !== State?.userAddress?.toLowerCase()) {
        showToast('Not your campaign', 'error');
        return;
    }
    
    CS.editingCampaign = c;
    CS.pendingImageFile = null;
    
    document.getElementById('edit-campaign-id').value = c.id;
    document.getElementById('edit-title').value = c.title || '';
    document.getElementById('edit-desc').value = c.description || '';
    document.getElementById('edit-image-url').value = c.imageUrl || '';
    
    document.querySelectorAll('#modal-edit .cp-cat-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`edit-opt-${c.category || 'humanitarian'}`)?.classList.add('selected');
    
    const previewEl = document.getElementById('edit-image-preview');
    if (previewEl && c.imageUrl) {
        previewEl.innerHTML = `<img src="${c.imageUrl}" class="cp-image-preview">`;
    } else if (previewEl) {
        previewEl.innerHTML = '';
    }
    
    openModal('edit');
}

function selCatOpt(cat, context = 'create') {
    const prefix = context === 'edit' ? 'edit-opt-' : 'opt-';
    const modal = context === 'edit' ? '#modal-edit' : '#modal-create';
    document.querySelectorAll(`${modal} .cp-cat-option`).forEach(el => el.classList.remove('selected'));
    document.getElementById(`${prefix}${cat}`)?.classList.add('selected');
}

function setAmt(val) {
    const el = document.getElementById('donate-amount') || document.getElementById('detail-amount');
    if (el) el.value = val;
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

async function create() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const catEl = document.querySelector('#modal-create .cp-cat-option.selected input');
    const category = catEl?.value || 'humanitarian';
    const title = document.getElementById('campaign-title')?.value?.trim();
    const desc = document.getElementById('campaign-desc')?.value?.trim();
    const goal = document.getElementById('campaign-goal')?.value;
    const duration = document.getElementById('campaign-duration')?.value;
    let imageUrl = document.getElementById('campaign-image-url')?.value?.trim();
    
    if (!title) return showToast('Enter a title', 'error');
    if (!desc) return showToast('Enter a description', 'error');
    if (!goal || parseFloat(goal) < 0.01) return showToast('Goal must be at least 0.01 ETH', 'error');
    if (!duration || parseInt(duration) < 1) return showToast('Duration must be at least 1 day', 'error');
    
    // Upload image if file selected
    if (CS.pendingImageFile) {
        try {
            showToast('Uploading image...', 'info');
            imageUrl = await uploadImageToServer(CS.pendingImageFile);
        } catch (e) {
            console.error('Image upload failed:', e);
        }
    }
    
    const goalWei = ethers.parseEther(goal);
    const durationSec = parseInt(duration) * 86400;
    
    await CharityTx.createCampaign({
        title, description: desc, goalAmount: goalWei, duration: durationSec,
        button: document.getElementById('btn-create'),
        
        onSuccess: async (receipt, campaignId) => {
            if (campaignId) {
                try {
                    await fetch(CHARITY_API.saveCampaign, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: campaignId, title, description: desc, category, imageUrl, creator: State.userAddress })
                    });
                } catch (e) {}
            }
            
            showToast('🎉 Campaign created!', 'success');
            closeModal('create');
            CS.pendingImageFile = null;
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

async function donate() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const c = CS.currentCampaign;
    if (!c) return;
    
    const amount = document.getElementById('donate-amount')?.value;
    if (!amount || parseFloat(amount) < 0.001) return showToast('Minimum 0.001 ETH', 'error');
    
    const amountWei = ethers.parseEther(amount);
    
    await CharityTx.donate({
        campaignId: c.id, amount: amountWei,
        button: document.getElementById('btn-donate'),
        
        onSuccess: async () => {
            showToast('❤️ Thank you for your donation!', 'success');
            closeModal('donate');
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

async function donateDetail(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const amount = document.getElementById('detail-amount')?.value;
    if (!amount || parseFloat(amount) < 0.001) return showToast('Minimum 0.001 ETH', 'error');
    
    const amountWei = ethers.parseEther(amount);
    
    await CharityTx.donate({
        campaignId: id, amount: amountWei,
        button: document.getElementById('btn-donate-detail'),
        
        onSuccess: async () => {
            showToast('❤️ Thank you for your donation!', 'success');
            await loadData();
            await loadDetail(id);
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                showToast(error.message?.slice(0, 80) || 'Failed', 'error');
            }
        }
    });
}

async function cancel(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    if (!confirm('Cancel this campaign? This cannot be undone.')) return;
    
    await CharityTx.cancelCampaign({
        campaignId: id,
        button: document.getElementById('btn-cancel'),
        
        onSuccess: async () => {
            showToast('Campaign cancelled', 'success');
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

async function withdraw(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const c = CS.campaigns.find(x => x.id === id || x.id === String(id));
    if (!c) return;
    
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    let msg = `Withdraw ${fmt(c.raisedAmount)} ETH?\n\n5% platform fee applies.`;
    if (prog < 100) msg += `\nGoal not reached - partial withdrawal.`;
    if (!confirm(msg)) return;
    
    await CharityTx.withdraw({
        campaignId: id,
        button: document.getElementById(`btn-withdraw-${id}`) || document.getElementById('btn-withdraw'),
        
        onSuccess: async () => {
            showToast('✅ Funds withdrawn successfully!', 'success');
            closeModal('my');
            await loadData();
            render();
            if (CS.currentCampaign?.id === id) await loadDetail(id);
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                showToast(error.message?.slice(0, 80) || 'Failed', 'error');
            }
        }
    });
}

async function saveEdit() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const id = document.getElementById('edit-campaign-id')?.value;
    const title = document.getElementById('edit-title')?.value?.trim();
    const desc = document.getElementById('edit-desc')?.value?.trim();
    let imageUrl = document.getElementById('edit-image-url')?.value?.trim();
    const catEl = document.querySelector('#modal-edit .cp-cat-option.selected input');
    const category = catEl?.value || 'humanitarian';
    
    if (!title) return showToast('Enter title', 'error');
    
    // Upload new image if selected
    if (CS.pendingImageFile) {
        try {
            showToast('Uploading image...', 'info');
            imageUrl = await uploadImageToServer(CS.pendingImageFile);
        } catch (e) {
            console.error('Image upload failed:', e);
        }
    }
    
    const btn = document.getElementById('btn-save-edit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }
    
    try {
        await fetch(CHARITY_API.saveCampaign, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, description: desc, category, imageUrl, creator: State.userAddress })
        });
        
        showToast('✅ Campaign updated!', 'success');
        closeModal('edit');
        CS.pendingImageFile = null;
        await loadData();
        
        if (CS.currentCampaign?.id === id) {
            await loadDetail(id);
        } else {
            render();
        }
    } catch (e) {
        showToast('Failed to save', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Save'; }
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function share(platform) {
    const c = CS.currentCampaign;
    if (!c) return;
    const url = getShareUrl(c.id);
    const txt = `🙏 Support "${c.title}" on Backcoin Charity!\n\n${fmt(c.raisedAmount)} raised of ${fmt(c.goalAmount)} goal.\n\n`;
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
        .then(() => showToast('Link copied!', 'success'))
        .catch(() => showToast('Copy failed', 'error'));
}

function goBack() { clearUrl(); CS.currentCampaign = null; CS.currentView = 'main'; render(); }
function viewCampaign(id) { closeModal('my'); closeModal('donate'); closeModal('edit'); setUrl(id); loadDetail(id); }
function selectCat(cat) { CS.selectedCategory = CS.selectedCategory === cat ? null : cat; updateGrid(); }
function clearCat() { CS.selectedCategory = null; updateGrid(); }

function updateGrid() {
    const grid = document.getElementById('cp-grid');
    if (!grid) return;
    let active = CS.campaigns.filter(c => isCampaignActive(c));
    if (CS.selectedCategory) active = active.filter(c => c.category === CS.selectedCategory);
    active.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    grid.innerHTML = active.length ? active.map(c => renderCard(c)).join('') : renderEmpty('No campaigns');
}

async function loadDetail(id) {
    CS.currentView = 'detail';
    CS.isLoading = true;
    const container = getContainer();
    if (container) container.innerHTML = renderLoading();
    
    try {
        let c = CS.campaigns.find(x => x.id === id || x.id === String(id));
        if (!c) {
            const provider = State?.publicProvider;
            if (provider) {
                const contract = new ethers.Contract(addresses.charityPool, charityPoolABI, provider);
                const data = await contract.getCampaign(id);
                c = {
                    id: String(id),
                    creator: data.creator || data[0],
                    title: data.title || data[1] || `Campaign #${id}`,
                    description: data.description || data[2] || '',
                    goalAmount: BigInt((data.goalAmount || data[3]).toString()),
                    raisedAmount: BigInt((data.raisedAmount || data[4]).toString()),
                    donationCount: Number(data.donationCount || data[5]),
                    deadline: Number(data.deadline || data[6]),
                    createdAt: Number(data.createdAt || data[7]),
                    status: Number(data.status || data[10]),
                    category: 'humanitarian', imageUrl: null
                };
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
    
    const container = getContainer();
    if (!container) return;
    
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
    CS.campaigns = [];
    CS.stats = null;
    if (CS.currentView === 'detail' && CS.currentCampaign) {
        await loadDetail(CS.currentCampaign.id);
    } else {
        render();
    }
}

// Hash listener
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#charity')) {
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
    refresh, openModal, closeModal, openCreate, openDonate, openMyCampaigns, openEdit,
    create, donate, donateDetail, cancel, withdraw, saveEdit,
    selCatOpt, setAmt, goBack, viewCampaign, selectCat, clearCat, share, copyLink,
    handleImageSelect, removeImage, switchImageTab
};

window.CharityPage = CharityPage;