// js/pages/CharityPage.js
// ✅ PRODUCTION V5.0 - Improved Error Handling
// 
// V5.0 Changes:
// - Added user_rejected check for cleaner UX
// - Improved error message extraction
// - Minor code improvements
//
// V4.0 Changes:
// - Uses new modular transaction system
// - Automatic validation (network, wallet, balances)
// - Automatic token approvals
// - Automatic retry on RPC errors
// - Automatic UI state management
// - Better error handling

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

// Import transaction module
import { CharityTx } from '../modules/transactions/index.js';

const ethers = window.ethers;

// ============================================================================
// CAMPAIGN STATUS
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

// ============================================================================
// ABI (only for reads - transactions use CharityTx)
// ============================================================================

const charityPoolABI = [
    "function campaigns(uint256) view returns (address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status)",
    "function campaignCounter() view returns (uint256)",
    "function totalRaisedAllTime() view returns (uint256)",
    "function totalBurnedAllTime() view returns (uint256)",
    "function totalCampaignsCreated() view returns (uint256)",
    "function totalSuccessfulWithdrawals() view returns (uint256)",
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)"
];

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const CHARITY_API = { 
    getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app', 
    saveCampaign: 'https://savecharitycampaign-4wvdcuoouq-uc.a.run.app' 
};

const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

const PLACEHOLDER_IMAGES = { 
    animal: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80', 
    humanitarian: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80', 
    default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80' 
};

const CATEGORIES = { 
    animal: { name: 'Animal Welfare', emoji: '🐾', color: '#10b981' }, 
    humanitarian: { name: 'Humanitarian Aid', emoji: '💗', color: '#ec4899' } 
};

const STATUS_CONFIG = { 
    0: { label: 'Active', color: '#10b981', icon: 'fa-circle-play' }, 
    1: { label: 'Ended', color: '#3b82f6', icon: 'fa-circle-check' }, 
    2: { label: 'Cancelled', color: '#ef4444', icon: 'fa-circle-xmark' }, 
    3: { label: 'Completed', color: '#8b5cf6', icon: 'fa-circle-dollar-to-slot' } 
};

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
    pendingImage: null 
};

// ============================================================================
// STYLES (unchanged)
// ============================================================================

function injectStyles() {
    if (document.getElementById('cp-styles-v4')) return;
    const s = document.createElement('style');
    s.id = 'cp-styles-v4';
    s.textContent = `
.charity-page { --cp-primary:#f59e0b; --cp-success:#10b981; --cp-danger:#ef4444; --cp-bg:#18181b; --cp-bg2:#27272a; --cp-bg3:#3f3f46; --cp-border:rgba(63,63,70,0.6); --cp-text:#fafafa; --cp-muted:#a1a1aa; --cp-radius:16px; max-width:1400px; margin:0 auto; padding:1rem; min-height:400px; }
.cp-hero { background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(236,72,153,0.08),rgba(245,158,11,0.05)); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:2rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; gap:1.5rem; flex-wrap:wrap; }
.cp-hero-left h1 { font-size:1.75rem; font-weight:800; color:var(--cp-text); margin:0 0 0.5rem; display:flex; align-items:center; gap:0.75rem; }
.cp-hero-left p { color:var(--cp-muted); font-size:0.9rem; max-width:500px; margin:0; }
.cp-hero-icon { width:48px; height:48px; background:linear-gradient(135deg,#10b981,#ec4899); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.25rem; color:#fff; }
.cp-actions { display:flex; gap:0.75rem; }
.cp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
.cp-stat { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:12px; padding:1rem; text-align:center; }
.cp-stat-val { font-size:1.5rem; font-weight:800; }
.cp-stat-val.g { color:var(--cp-success); } .cp-stat-val.b { color:#3b82f6; } .cp-stat-val.o { color:var(--cp-primary); } .cp-stat-val.p { color:#8b5cf6; }
.cp-stat-lbl { font-size:0.7rem; color:var(--cp-muted); text-transform:uppercase; margin-top:0.25rem; }
.cp-cats { display:grid; grid-template-columns:repeat(2,1fr); gap:1.5rem; margin-bottom:2rem; }
.cp-cat { background:var(--cp-bg2); border:2px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.5rem; cursor:pointer; transition:all 0.3s; text-align:center; }
.cp-cat:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.3); }
.cp-cat.animal:hover { border-color:#10b981; }
.cp-cat.humanitarian:hover { border-color:#ec4899; }
.cp-cat-icon { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; margin:0 auto 1rem; }
.cp-cat.animal .cp-cat-icon { background:rgba(16,185,129,0.15); color:#10b981; }
.cp-cat.humanitarian .cp-cat-icon { background:rgba(236,72,153,0.15); color:#ec4899; }
.cp-cat-name { font-size:1.125rem; font-weight:700; color:var(--cp-text); margin-bottom:0.5rem; }
.cp-cat-stats { display:flex; justify-content:center; gap:2rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--cp-border); font-size:0.8rem; }
.cp-cat-actions { display:flex; justify-content:center; gap:0.5rem; margin-top:1rem; }
.cp-section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.cp-section-title { font-size:1.25rem; font-weight:700; color:var(--cp-text); display:flex; align-items:center; gap:0.5rem; }
.cp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }
.cp-card { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); overflow:hidden; cursor:pointer; transition:all 0.3s; }
.cp-card:hover { transform:translateY(-4px); border-color:rgba(245,158,11,0.4); box-shadow:0 20px 40px rgba(0,0,0,0.3); }
.cp-card-img { width:100%; height:160px; object-fit:cover; background:var(--cp-bg3); }
.cp-card-body { padding:1rem; }
.cp-card-badges { display:flex; gap:0.375rem; margin-bottom:0.5rem; flex-wrap:wrap; }
.cp-badge { display:inline-flex; align-items:center; gap:0.25rem; padding:0.2rem 0.5rem; border-radius:9999px; font-size:0.6rem; font-weight:700; text-transform:uppercase; }
.cp-card-title { font-size:1rem; font-weight:700; color:var(--cp-text); margin-bottom:0.375rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.cp-card-creator { font-size:0.7rem; color:var(--cp-muted); margin-bottom:0.75rem; }
.cp-card-creator a { color:var(--cp-primary); text-decoration:none; }
.cp-progress { height:6px; background:var(--cp-bg3); border-radius:3px; overflow:hidden; margin-bottom:0.5rem; }
.cp-progress-fill { height:100%; border-radius:3px; transition:width 0.6s; }
.cp-progress-fill.animal { background:linear-gradient(90deg,#10b981,#059669); }
.cp-progress-fill.humanitarian { background:linear-gradient(90deg,#ec4899,#db2777); }
.cp-progress-stats { display:flex; justify-content:space-between; font-size:0.8rem; }
.cp-progress-raised { color:var(--cp-text); font-weight:600; }
.cp-progress-goal { color:var(--cp-muted); }
.cp-card-meta { display:flex; justify-content:space-between; font-size:0.7rem; color:var(--cp-muted); margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--cp-border); }
.cp-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.625rem 1.25rem; border-radius:8px; font-weight:600; font-size:0.875rem; border:none; cursor:pointer; transition:all 0.2s; }
.cp-btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; }
.cp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(245,158,11,0.3); }
.cp-btn-secondary { background:var(--cp-bg3); color:var(--cp-text); border:1px solid var(--cp-border); }
.cp-btn-secondary:hover { background:var(--cp-border); }
.cp-btn-success { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
.cp-btn-success:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(16,185,129,0.3); }
.cp-btn-danger { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; }
.cp-btn-danger:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(239,68,68,0.3); }
.cp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none !important; }
.cp-empty { text-align:center; padding:3rem 1rem; color:var(--cp-muted); }
.cp-empty i { font-size:3rem; margin-bottom:1rem; opacity:0.4; }
.cp-empty h3 { color:var(--cp-text); margin:0 0 0.5rem; }
.cp-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; gap:1rem; }
.cp-spinner { width:40px; height:40px; border:3px solid var(--cp-border); border-top-color:var(--cp-primary); border-radius:50%; animation:cp-spin 1s linear infinite; }
@keyframes cp-spin { to { transform:rotate(360deg); } }
.cp-modal { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center; padding:1rem; }
.cp-modal.active { display:flex; }
.cp-modal-content { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
.cp-modal-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid var(--cp-border); }
.cp-modal-title { font-size:1.125rem; font-weight:700; color:var(--cp-text); display:flex; align-items:center; gap:0.5rem; margin:0; }
.cp-modal-close { background:none; border:none; color:var(--cp-muted); font-size:1.25rem; cursor:pointer; padding:0.25rem; }
.cp-modal-close:hover { color:var(--cp-text); }
.cp-modal-body { padding:1.25rem; }
.cp-modal-footer { display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.25rem; border-top:1px solid var(--cp-border); }
.cp-form-group { margin-bottom:1rem; }
.cp-form-label { display:block; font-size:0.8rem; font-weight:600; color:var(--cp-text); margin-bottom:0.375rem; }
.cp-form-label span { color:var(--cp-muted); font-weight:400; }
.cp-form-input { width:100%; padding:0.625rem 0.875rem; background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-text); font-size:0.9rem; }
.cp-form-input:focus { outline:none; border-color:var(--cp-primary); }
.cp-form-textarea { min-height:100px; resize:vertical; }
.cp-form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.cp-cat-selector { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.cp-cat-option { display:flex; flex-direction:column; align-items:center; padding:1rem; background:var(--cp-bg); border:2px solid var(--cp-border); border-radius:10px; cursor:pointer; transition:all 0.2s; }
.cp-cat-option:hover { border-color:var(--cp-muted); }
.cp-cat-option.selected { border-color:var(--cp-primary); background:rgba(245,158,11,0.1); }
.cp-cat-option input { display:none; }
.cp-cat-option-icon { font-size:1.5rem; margin-bottom:0.375rem; }
.cp-cat-option-name { font-size:0.8rem; font-weight:600; color:var(--cp-text); }
.cp-donate-input-wrap { position:relative; }
.cp-donate-input { width:100%; padding:1rem; padding-right:4rem; font-size:1.5rem; font-weight:700; text-align:center; background:var(--cp-bg); border:2px solid var(--cp-border); border-radius:12px; color:var(--cp-text); }
.cp-donate-input:focus { outline:none; border-color:var(--cp-primary); }
.cp-donate-currency { position:absolute; right:1rem; top:50%; transform:translateY(-50%); color:var(--cp-muted); font-weight:600; }
.cp-donate-presets { display:flex; gap:0.5rem; margin:0.75rem 0; }
.cp-preset { flex:1; padding:0.5rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-text); font-weight:600; cursor:pointer; transition:all 0.2s; }
.cp-preset:hover { background:var(--cp-border); }
.cp-fee-info { text-align:center; font-size:0.75rem; color:var(--cp-muted); padding:0.75rem; background:var(--cp-bg); border-radius:8px; }
.cp-detail { max-width:900px; margin:0 auto; }
.cp-detail-header { display:flex; gap:0.75rem; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; }
.cp-detail-img { width:100%; height:300px; object-fit:cover; border-radius:var(--cp-radius); margin-bottom:1.5rem; background:var(--cp-bg3); }
.cp-detail-content { display:grid; grid-template-columns:1fr 320px; gap:1.5rem; }
.cp-detail-main { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.5rem; }
.cp-detail-title { font-size:1.5rem; font-weight:800; color:var(--cp-text); margin:0 0 0.5rem; }
.cp-detail-creator { font-size:0.85rem; color:var(--cp-muted); margin-bottom:1rem; }
.cp-detail-creator a { color:var(--cp-primary); text-decoration:none; }
.cp-detail-desc { color:var(--cp-muted); line-height:1.6; margin-bottom:1.5rem; white-space:pre-wrap; }
.cp-detail-sidebar { display:flex; flex-direction:column; gap:1rem; }
.cp-detail-card { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.25rem; }
.cp-detail-card h4 { margin:0 0 1rem; color:var(--cp-text); font-size:0.9rem; }
.cp-detail-progress { margin-bottom:1rem; }
.cp-detail-progress .cp-progress { height:10px; margin-bottom:0.75rem; }
.cp-detail-amount { font-size:1.75rem; font-weight:800; color:var(--cp-text); }
.cp-detail-goal { color:var(--cp-muted); font-size:0.9rem; }
.cp-detail-stats { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:1rem; }
.cp-detail-stat { text-align:center; padding:0.75rem; background:var(--cp-bg3); border-radius:8px; }
.cp-detail-stat-val { font-size:1rem; font-weight:700; color:var(--cp-text); }
.cp-detail-stat-lbl { font-size:0.7rem; color:var(--cp-muted); margin-top:0.125rem; }
.cp-detail-donate { display:flex; flex-direction:column; gap:0.75rem; }
.cp-detail-donate input { width:100%; padding:0.75rem; font-size:1.125rem; font-weight:600; text-align:center; background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-text); }
.cp-detail-donate input:focus { outline:none; border-color:var(--cp-primary); }
.cp-detail-presets { display:flex; gap:0.375rem; }
.cp-detail-presets button { flex:1; padding:0.375rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-text); font-size:0.75rem; cursor:pointer; }
.cp-detail-presets button:hover { background:var(--cp-border); }
.cp-share-box { background:var(--cp-bg3); border-radius:10px; padding:1rem; }
.cp-share-title { font-size:0.8rem; color:var(--cp-muted); margin-bottom:0.75rem; text-align:center; }
.cp-share-btns { display:flex; justify-content:center; gap:0.5rem; }
.cp-share-btn { width:40px; height:40px; border-radius:50%; border:none; cursor:pointer; font-size:1rem; transition:all 0.2s; }
.cp-share-btn:hover { transform:scale(1.1); }
.cp-share-btn.twitter { background:#000; color:#fff; }
.cp-share-btn.telegram { background:#0088cc; color:#fff; }
.cp-share-btn.whatsapp { background:#25d366; color:#fff; }
.cp-share-btn.copy { background:var(--cp-bg2); color:var(--cp-text); border:1px solid var(--cp-border); }
.tx-status { display:inline-flex; align-items:center; gap:0.375rem; }
.tx-icon { font-size:1rem; }
.tx-text { font-size:0.8rem; }
@media(max-width:768px) { .cp-stats { grid-template-columns:repeat(2,1fr); } .cp-cats { grid-template-columns:1fr; } .cp-detail-content { grid-template-columns:1fr; } .cp-detail-sidebar { order:-1; } }
    `;
    document.head.appendChild(s);
}

// ============================================================================
// UTILITIES (unchanged)
// ============================================================================

const fmt = (v) => { try { const n = Number(ethers.formatEther(BigInt(v || 0))); return n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toFixed(n < 10 ? 2 : 0); } catch { return '0'; } };
const fmtAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '';
const calcProg = (r, g) => { const rn = Number(r || 0), gn = Number(g || 1); return Math.min(100, Math.round((rn / gn) * 100)); };
const fmtTime = (d) => { const now = Math.floor(Date.now() / 1000); const diff = Number(d) - now; if (diff <= 0) return { text: 'Ended', color: 'var(--cp-danger)' }; const days = Math.floor(diff / 86400); if (days > 0) return { text: `${days}d left`, color: 'var(--cp-success)' }; const hours = Math.floor(diff / 3600); return { text: `${hours}h left`, color: 'var(--cp-primary)' }; };
const getCampImg = (c) => c?.imageUrl || PLACEHOLDER_IMAGES[c?.category] || PLACEHOLDER_IMAGES.default;
const getShareUrl = (id) => `${window.location.origin}${window.location.pathname}#charity/${id}`;
const getIdFromUrl = () => { const h = window.location.hash; const m = h.match(/#charity\/(\d+)/); return m ? m[1] : null; };
const setUrl = (id) => { window.location.hash = `charity/${id}`; };
const clearUrl = () => { if (window.location.hash.startsWith('#charity/')) window.location.hash = 'charity'; };
const canWithdraw = (c) => { const status = normalizeStatus(c.status); const ended = Number(c.deadline) <= Math.floor(Date.now() / 1000); return (status === 0 || status === 1) && ended && !c.withdrawn && BigInt(c.raisedAmount || 0) > 0n; };

// ============================================================================
// DATA LOADING (unchanged)
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
                        const data = await contract.campaigns(id);
                        const apiData = apiCampaigns.find(c => String(c.id) === String(id));
                        return {
                            id: String(id),
                            creator: data[0],
                            title: data[1] || apiData?.title || `Campaign #${id}`,
                            description: data[2] || apiData?.description || '',
                            goalAmount: BigInt(data[3].toString()),
                            raisedAmount: BigInt(data[4].toString()),
                            donationCount: Number(data[5]),
                            deadline: Number(data[6]),
                            createdAt: Number(data[7]),
                            status: Number(data[8]),
                            category: apiData?.category || 'humanitarian',
                            imageUrl: apiData?.imageUrl || null
                        };
                    } catch (e) {
                        console.warn(`Campaign ${id}:`, e);
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
        const [raised, burned, created, withdrawals] = await Promise.all([
            contract.totalRaisedAllTime(),
            contract.totalBurnedAllTime(),
            contract.totalCampaignsCreated(),
            contract.totalSuccessfulWithdrawals()
        ]);
        
        return { raised, burned, created: Number(created), withdrawals: Number(withdrawals) };
    } catch (e) {
        console.error('Stats:', e);
        return null;
    }
}

// ============================================================================
// RENDER FUNCTIONS (unchanged - just UI)
// ============================================================================

const renderBadge = (status) => { const s = STATUS_CONFIG[normalizeStatus(status)] || STATUS_CONFIG[0]; return `<span class="cp-badge" style="background:${s.color}20;color:${s.color}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`; };
const renderLoading = () => `<div class="cp-loading"><div class="cp-spinner"></div><span style="color:var(--cp-muted)">Loading...</span></div>`;
const renderEmpty = (msg) => `<div class="cp-empty"><i class="fa-solid fa-inbox"></i><h3>${msg}</h3></div>`;

const renderCard = (c) => {
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    return `<div class="cp-card" onclick="CharityPage.viewCampaign('${c.id}')"><img src="${getCampImg(c)}" class="cp-card-img" onerror="this.src='${PLACEHOLDER_IMAGES.default}'"><div class="cp-card-body"><div class="cp-card-badges">${renderBadge(c.status)}<span class="cp-badge" style="background:${CATEGORIES[cat]?.color || '#666'}20;color:${CATEGORIES[cat]?.color || '#666'}">${CATEGORIES[cat]?.emoji || '💗'} ${CATEGORIES[cat]?.name || 'Other'}</span></div><h3 class="cp-card-title">${c.title}</h3><div class="cp-card-creator">by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank">${fmtAddr(c.creator)}</a></div><div class="cp-progress"><div class="cp-progress-fill ${cat}" style="width:${prog}%"></div></div><div class="cp-progress-stats"><span class="cp-progress-raised">${fmt(c.raisedAmount)} BKC</span><span class="cp-progress-goal">${prog}% of ${fmt(c.goalAmount)}</span></div><div class="cp-card-meta"><span><i class="fa-solid fa-heart"></i> ${c.donationCount || 0}</span><span style="color:${time.color}">${time.text}</span></div></div></div>`;
};

const renderMain = () => {
    const active = CS.campaigns.filter(c => isCampaignActive(c));
    const animal = active.filter(c => c.category === 'animal');
    const humanitarian = active.filter(c => c.category === 'humanitarian');
    
    return `<div class="charity-page">${renderCreateModal()}${renderMyCampaignsModal()}<div class="cp-hero"><div class="cp-hero-left" style="display:flex;align-items:center;gap:1rem"><div class="cp-hero-icon">💝</div><div><h1>Charity Pool</h1><p>Support causes you care about with BKC tokens. 95% goes directly to campaigns.</p></div></div><div class="cp-actions"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()"><i class="fa-solid fa-folder-open"></i> My Campaigns</button><button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-stats"><div class="cp-stat"><div class="cp-stat-val g">${CS.stats ? fmt(CS.stats.raised) : '...'}</div><div class="cp-stat-lbl">Total Raised</div></div><div class="cp-stat"><div class="cp-stat-val b">${CS.stats ? fmt(CS.stats.burned) : '...'}</div><div class="cp-stat-lbl">Burned 🔥</div></div><div class="cp-stat"><div class="cp-stat-val o">${CS.stats?.created ?? '...'}</div><div class="cp-stat-lbl">Campaigns</div></div><div class="cp-stat"><div class="cp-stat-val p">${CS.stats?.withdrawals ?? '...'}</div><div class="cp-stat-lbl">Completed</div></div></div><div class="cp-cats"><div class="cp-cat animal" onclick="CharityPage.selectCat('animal')"><div class="cp-cat-icon">🐾</div><div class="cp-cat-name">Animal Welfare</div><div class="cp-cat-stats"><span><strong>${animal.length}</strong> active</span><span><strong>${fmt(animal.reduce((s,c)=>s+BigInt(c.raisedAmount||0),0n))}</strong> raised</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('animal')"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-cat humanitarian" onclick="CharityPage.selectCat('humanitarian')"><div class="cp-cat-icon">💗</div><div class="cp-cat-name">Humanitarian Aid</div><div class="cp-cat-stats"><span><strong>${humanitarian.length}</strong> active</span><span><strong>${fmt(humanitarian.reduce((s,c)=>s+BigInt(c.raisedAmount||0),0n))}</strong> raised</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')"><i class="fa-solid fa-plus"></i> Create</button></div></div></div><div class="cp-section-header"><h2 class="cp-section-title">${CS.selectedCategory ? `<span style="cursor:pointer" onclick="CharityPage.clearCat()">←</span> ${CATEGORIES[CS.selectedCategory]?.name}` : '<i class="fa-solid fa-fire" style="color:var(--cp-primary)"></i> Active Campaigns'}</h2></div><div class="cp-grid" id="cp-grid">${active.length ? active.filter(c => !CS.selectedCategory || c.category === CS.selectedCategory).sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0)).map(c => renderCard(c)).join('') : renderEmpty('No active campaigns')}</div></div>`;
};

const renderDetail = (c) => {
    if (!c) return `<div class="charity-page"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button><div class="cp-empty" style="margin-top:2rem"><i class="fa-solid fa-circle-question"></i><h3>Campaign not found</h3></div></div>`;
    
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    const isActive = isCampaignActive(c);
    const isCreator = c.creator?.toLowerCase() === State?.userAddress?.toLowerCase();
    const canWd = canWithdraw(c);
    
    return `<div class="charity-page"><div class="cp-detail"><div class="cp-detail-header"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>${renderBadge(c.status)}<span class="cp-badge" style="background:${CATEGORIES[cat]?.color}20;color:${CATEGORIES[cat]?.color}">${CATEGORIES[cat]?.emoji} ${CATEGORIES[cat]?.name}</span>${isCreator ? '<span class="cp-badge" style="background:var(--cp-primary)20;color:var(--cp-primary)"><i class="fa-solid fa-user"></i> Your Campaign</span>' : ''}</div><img src="${getCampImg(c)}" class="cp-detail-img" onerror="this.src='${PLACEHOLDER_IMAGES.default}'"><div class="cp-detail-content"><div class="cp-detail-main"><h1 class="cp-detail-title">${c.title}</h1><div class="cp-detail-creator">Created by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank">${fmtAddr(c.creator)}</a></div><p class="cp-detail-desc">${c.description || 'No description provided.'}</p></div><div class="cp-detail-sidebar"><div class="cp-detail-card"><div class="cp-detail-progress"><div class="cp-progress"><div class="cp-progress-fill ${cat}" style="width:${prog}%"></div></div><div class="cp-detail-amount">${fmt(c.raisedAmount)} BKC</div><div class="cp-detail-goal">raised of ${fmt(c.goalAmount)} BKC goal (${prog}%)</div></div><div class="cp-detail-stats"><div class="cp-detail-stat"><div class="cp-detail-stat-val">${c.donationCount || 0}</div><div class="cp-detail-stat-lbl">Donations</div></div><div class="cp-detail-stat"><div class="cp-detail-stat-val" style="color:${time.color}">${time.text}</div><div class="cp-detail-stat-lbl">${isActive ? 'Remaining' : 'Status'}</div></div></div></div>${isActive ? `<div class="cp-detail-card"><h4><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Make a Donation</h4><div class="cp-detail-donate"><input type="number" id="detail-amount" placeholder="Amount in BKC" min="1"><div class="cp-detail-presets"><button onclick="CharityPage.setAmt(10)">10</button><button onclick="CharityPage.setAmt(50)">50</button><button onclick="CharityPage.setAmt(100)">100</button><button onclick="CharityPage.setAmt(500)">500</button></div><button id="btn-donate-detail" class="cp-btn cp-btn-success" onclick="CharityPage.donateDetail('${c.id}')"><i class="fa-solid fa-heart"></i> Donate Now</button></div><div class="cp-fee-info" style="margin-top:0.75rem"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥</div></div>` : ''}${isCreator && isActive ? `<button id="btn-cancel" class="cp-btn cp-btn-danger" style="width:100%" onclick="CharityPage.cancel('${c.id}')"><i class="fa-solid fa-xmark"></i> Cancel Campaign</button>` : ''}${isCreator && canWd ? `<button id="btn-withdraw" class="cp-btn cp-btn-primary" style="width:100%" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw Funds</button>` : ''}<div class="cp-share-box"><div class="cp-share-title">Share this campaign</div><div class="cp-share-btns"><button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')"><i class="fa-brands fa-x-twitter"></i></button><button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')"><i class="fa-brands fa-telegram"></i></button><button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')"><i class="fa-brands fa-whatsapp"></i></button><button class="cp-share-btn copy" onclick="CharityPage.copyLink()"><i class="fa-solid fa-link"></i></button></div></div></div></div></div>${renderDonateModal()}</div>`;
};

const renderCreateModal = () => `<div class="cp-modal" id="modal-create"><div class="cp-modal-content"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-plus" style="color:var(--cp-primary)"></i> Create Campaign</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('create')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><div class="cp-form-group"><label class="cp-form-label">Category *</label><div class="cp-cat-selector"><label class="cp-cat-option" id="opt-animal" onclick="CharityPage.selCatOpt('animal')"><input type="radio" name="category" value="animal"><div class="cp-cat-option-icon">🐾</div><div class="cp-cat-option-name">Animal</div></label><label class="cp-cat-option selected" id="opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian')"><input type="radio" name="category" value="humanitarian" checked><div class="cp-cat-option-icon">💗</div><div class="cp-cat-option-name">Humanitarian</div></label></div></div><div class="cp-form-group"><label class="cp-form-label">Image URL <span>(optional)</span></label><input type="url" id="campaign-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg"></div><div class="cp-form-group"><label class="cp-form-label">Title *</label><input type="text" id="campaign-title" class="cp-form-input" placeholder="Campaign title" maxlength="100"></div><div class="cp-form-group"><label class="cp-form-label">Description *</label><textarea id="campaign-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." maxlength="2000"></textarea></div><div class="cp-form-row"><div class="cp-form-group"><label class="cp-form-label">Goal (BKC) *</label><input type="number" id="campaign-goal" class="cp-form-input" placeholder="1000" min="1" step="0.01"></div><div class="cp-form-group"><label class="cp-form-label">Duration (Days) *</label><input type="number" id="campaign-duration" class="cp-form-input" placeholder="30" min="1" max="180"></div></div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('create')">Cancel</button><button id="btn-create" class="cp-btn cp-btn-primary" onclick="CharityPage.create()"><i class="fa-solid fa-rocket"></i> Launch</button></div></div></div>`;

const renderDonateModal = () => `<div class="cp-modal" id="modal-donate"><div class="cp-modal-content" style="max-width:420px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Donate</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><input type="hidden" id="donate-campaign-id"><div id="donate-info" style="margin-bottom:1rem"></div><div class="cp-form-group"><label class="cp-form-label">Amount (BKC)</label><div class="cp-donate-input-wrap"><input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.00" min="1" step="0.01"><span class="cp-donate-currency">BKC</span></div></div><div class="cp-donate-presets"><button class="cp-preset" onclick="document.getElementById('donate-amount').value=10">10</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=50">50</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=100">100</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=500">500</button></div><div class="cp-fee-info"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥 • <strong>95%</strong> to campaign</div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button><button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button></div></div></div>`;

const renderMyCampaignsModal = () => `<div class="cp-modal" id="modal-my"><div class="cp-modal-content" style="max-width:650px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-folder-open" style="color:var(--cp-primary)"></i> My Campaigns</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body" id="my-campaigns-content">${renderLoading()}</div></div></div>`;

// ============================================================================
// EVENT HANDLERS (unchanged)
// ============================================================================

function openModal(id) { document.getElementById(`modal-${id}`)?.classList.add('active'); }
function closeModal(id) { document.getElementById(`modal-${id}`)?.classList.remove('active'); }
function openCreate(cat = null) { if (!State?.isConnected) { showToast('Connect wallet first', 'warning'); return; } openModal('create'); if (cat) selCatOpt(cat); }
function openDonate(id) { if (!State?.isConnected) { showToast('Connect wallet first', 'warning'); return; } const c = CS.campaigns.find(x => x.id === id || x.id === String(id)); if (!c) return showToast('Not found', 'error'); document.getElementById('donate-campaign-id').value = id; document.getElementById('donate-amount').value = ''; document.getElementById('donate-info').innerHTML = `<div style="padding:0.75rem;background:var(--cp-bg3);border-radius:8px"><strong style="color:var(--cp-text)">${c.title}</strong><div style="font-size:0.8rem;color:var(--cp-muted);margin-top:0.25rem">${fmt(c.raisedAmount)} / ${fmt(c.goalAmount)} BKC</div></div>`; openModal('donate'); }
function openMyCampaigns() { if (!State?.isConnected) { showToast('Connect wallet first', 'warning'); return; } openModal('my'); const el = document.getElementById('my-campaigns-content'); el.innerHTML = renderLoading(); const mine = CS.campaigns.filter(c => c.creator?.toLowerCase() === State.userAddress?.toLowerCase()); if (!mine.length) { el.innerHTML = `<div class="cp-empty" style="padding:1.5rem"><i class="fa-solid fa-folder-open"></i><h3>No Campaigns</h3><button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div>`; return; } el.innerHTML = mine.map(c => { const prog = calcProg(c.raisedAmount, c.goalAmount); const time = fmtTime(c.deadline); const isActive = isCampaignActive(c); const canWd = canWithdraw(c); return `<div style="display:flex;gap:1rem;padding:1rem;background:var(--cp-bg3);border-radius:10px;margin-bottom:0.75rem"><img src="${getCampImg(c)}" style="width:70px;height:70px;object-fit:cover;border-radius:8px" onerror="this.src='${PLACEHOLDER_IMAGES.default}'"><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem"><h4 style="margin:0;color:var(--cp-text);font-size:0.9rem">${c.title}</h4>${renderBadge(c.status)}</div><div style="margin-top:0.5rem"><div class="cp-progress"><div class="cp-progress-fill ${c.category || 'humanitarian'}" style="width:${prog}%"></div></div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-top:0.25rem"><span style="color:var(--cp-text)">${fmt(c.raisedAmount)} BKC</span><span style="color:var(--cp-muted)">${time.text}</span></div></div><div style="display:flex;gap:0.375rem;margin-top:0.625rem"><button class="cp-btn cp-btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.closeModal('my');CharityPage.viewCampaign('${c.id}')"><i class="fa-solid fa-eye"></i> View</button>${isActive ? `<button id="btn-cancel-${c.id}" class="cp-btn cp-btn-danger" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.cancel('${c.id}')"><i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}${canWd ? `<button id="btn-withdraw-${c.id}" class="cp-btn cp-btn-primary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw</button>` : ''}</div></div></div>`; }).join(''); }
function selCatOpt(cat) { document.querySelectorAll('.cp-cat-option').forEach(e => e.classList.remove('selected')); const opt = document.getElementById(`opt-${cat}`); if (opt) { opt.classList.add('selected'); const radio = opt.querySelector('input[type="radio"]'); if (radio) radio.checked = true; } }
function setAmt(v) { const el = document.getElementById('detail-amount'); if (el) el.value = v; }

// ============================================================================
// TRANSACTIONS - USING NEW TRANSACTION ENGINE
// ============================================================================

/**
 * Create Campaign - Now uses CharityTx module
 */
async function create() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const title = document.getElementById('campaign-title')?.value?.trim();
    const desc = document.getElementById('campaign-desc')?.value?.trim();
    const goal = document.getElementById('campaign-goal')?.value;
    const dur = parseInt(document.getElementById('campaign-duration')?.value);
    const cat = document.querySelector('input[name="category"]:checked')?.value || 'humanitarian';
    const imgUrl = document.getElementById('campaign-image-url')?.value?.trim();
    
    // Basic validation
    if (!title) return showToast('Enter title', 'error');
    if (!goal || parseFloat(goal) < 1) return showToast('Goal min 1 BKC', 'error');
    if (!dur || dur < 1 || dur > 180) return showToast('Duration 1-180 days', 'error');
    
    const goalWei = ethers.parseEther(goal.toString());
    
    const result = await CharityTx.createCampaign({
        title,
        description: desc || '',
        goalAmount: goalWei,
        durationDays: dur,
        button: document.getElementById('btn-create'),
        
        onSuccess: async (receipt, campaignId) => {
            // Save metadata to Firebase
            if (campaignId) {
                try {
                    await fetch(CHARITY_API.saveCampaign, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            campaignId,
                            creator: State.userAddress,
                            title,
                            description: desc || '',
                            category: cat,
                            imageUrl: imgUrl || null,
                            txHash: receipt.hash
                        })
                    });
                } catch (e) { console.warn('Metadata:', e); }
            }
            
            showToast('🎉 Campaign created!', 'success');
            closeModal('create');
            await loadData();
            render();
            
            if (campaignId) setTimeout(() => viewCampaign(campaignId), 1500);
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                const msg = error.message || error.reason || 'Failed';
                showToast(msg.slice(0, 80), 'error');
            }
        }
    });
}

/**
 * Donate - Now uses CharityTx module
 */
async function donate() {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const id = document.getElementById('donate-campaign-id')?.value;
    const amt = document.getElementById('donate-amount')?.value;
    
    if (!amt || parseFloat(amt) <= 0) return showToast('Enter amount', 'error');
    
    const amountWei = ethers.parseEther(amt.toString());
    
    await CharityTx.donate({
        campaignId: id,
        amount: amountWei,
        button: document.getElementById('btn-donate'),
        
        onSuccess: async () => {
            showToast('❤️ Donation successful!', 'success');
            closeModal('donate');
            await loadData();
            render();
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                const msg = error.message || error.reason || 'Failed';
                showToast(msg.slice(0, 80), 'error');
            }
        }
    });
}

/**
 * Donate from detail page
 */
async function donateDetail(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const amt = document.getElementById('detail-amount')?.value;
    if (!amt || parseFloat(amt) <= 0) return showToast('Enter amount', 'error');
    
    const amountWei = ethers.parseEther(amt.toString());
    
    await CharityTx.donate({
        campaignId: id,
        amount: amountWei,
        button: document.getElementById('btn-donate-detail'),
        
        onSuccess: async () => {
            showToast('❤️ Donation successful!', 'success');
            await loadData();
            if (CS.currentCampaign?.id === id) await loadDetail(id);
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                const msg = error.message || error.reason || 'Failed';
                showToast(msg.slice(0, 80), 'error');
            }
        }
    });
}

/**
 * Cancel Campaign - Now uses CharityTx module
 */
async function cancel(id) {
    if (!confirm('Cancel this campaign?')) return;
    
    await CharityTx.cancelCampaign({
        campaignId: id,
        button: document.getElementById(`btn-cancel-${id}`) || document.getElementById('btn-cancel'),
        
        onSuccess: async () => {
            showToast('Campaign cancelled', 'success');
            closeModal('my');
            await loadData();
            render();
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                const msg = error.message || error.reason || 'Failed';
                showToast(msg.slice(0, 80), 'error');
            }
        }
    });
}

/**
 * Withdraw - Now uses CharityTx module
 */
async function withdraw(id) {
    if (!State?.isConnected) return showToast('Connect wallet', 'warning');
    
    const c = CS.campaigns.find(x => x.id === id || x.id === String(id));
    if (!c) return;
    
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    let msg = `Withdraw ${fmt(c.raisedAmount)} BKC?\n\nFee: 0.001 ETH`;
    if (prog < 100) msg += `\n10% will be burned`;
    if (!confirm(msg)) return;
    
    await CharityTx.withdraw({
        campaignId: id,
        button: document.getElementById(`btn-withdraw-${id}`) || document.getElementById('btn-withdraw'),
        
        onSuccess: async () => {
            showToast('Success!', 'success');
            closeModal('my');
            await loadData();
            render();
            if (CS.currentCampaign?.id === id) await loadDetail(id);
        },
        
        onError: (error) => {
            if (!error.cancelled && error.type !== 'user_rejected') {
                const msg = error.message || error.reason || 'Failed';
                showToast(msg.slice(0, 80), 'error');
            }
        }
    });
}

// ============================================================================
// NAVIGATION (unchanged)
// ============================================================================

function share(platform) { const c = CS.currentCampaign; if (!c) return; const url = getShareUrl(c.id); const txt = `🙏 Support "${c.title}" on Backcoin Charity!\n\n${fmt(c.raisedAmount)} raised of ${fmt(c.goalAmount)} goal.\n\n`; let shareUrl; if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`; else if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`; else if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(txt + url)}`; if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400'); }
function copyLink() { const c = CS.currentCampaign; if (!c) return; navigator.clipboard.writeText(getShareUrl(c.id)).then(() => showToast('Link copied!', 'success')).catch(() => showToast('Copy failed', 'error')); }
function goBack() { clearUrl(); CS.currentCampaign = null; CS.currentView = 'main'; render(); }
function viewCampaign(id) { closeModal('my'); closeModal('donate'); setUrl(id); loadDetail(id); }
function selectCat(cat) { CS.selectedCategory = CS.selectedCategory === cat ? null : cat; updateGrid(); }
function clearCat() { CS.selectedCategory = null; updateGrid(); }
function updateGrid() { const grid = document.getElementById('cp-grid'); if (!grid) return; let active = CS.campaigns.filter(c => isCampaignActive(c)); if (CS.selectedCategory) active = active.filter(c => c.category === CS.selectedCategory); active.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); grid.innerHTML = active.length ? active.map(c => renderCard(c)).join('') : renderEmpty('No campaigns'); }

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
                const data = await contract.campaigns(id); 
                c = { id: String(id), creator: data[0], title: data[1], description: data[2], goalAmount: BigInt(data[3].toString()), raisedAmount: BigInt(data[4].toString()), donationCount: Number(data[5]), deadline: Number(data[6]), createdAt: Number(data[7]), status: Number(data[8]), category: 'humanitarian', imageUrl: null }; 
            } 
        } 
        CS.currentCampaign = c; 
        if (container) container.innerHTML = renderDetail(c); 
    } catch (e) { 
        console.error('Detail:', e); 
        if (container) container.innerHTML = renderDetail(null); 
    } finally { 
        CS.isLoading = false; 
    } 
}

// ============================================================================
// CONTAINER & RENDER (unchanged)
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
    
    console.error('❌ #charity section not found');
    return null;
}

function render() {
    console.log('🎨 CharityPage render v4.0');
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
    render(isActive) { console.log('🚀 CharityPage.render v4.0, isActive:', isActive); if (isActive) render(); },
    update() { if (CS.currentView === 'main') updateGrid(); },
    refresh, openModal, closeModal, openCreate, openDonate, openMyCampaigns,
    create, donate, donateDetail, cancel, withdraw,
    selCatOpt, setAmt, goBack, viewCampaign, selectCat, clearCat, share, copyLink
};

window.CharityPage = CharityPage;