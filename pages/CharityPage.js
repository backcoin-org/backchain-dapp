// js/pages/CharityPage.js
// ✅ PRODUCTION V3.0 - Charity Pool Redesign

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';
import {
    loadCharityStats, loadCampaigns, loadCampaignDetails,
    clearCharityCache, CampaignStatus, isCampaignActive
} from '../modules/charity-data.js';
import {
    executeCreateCampaign, executeDonate, executeCancelCampaign,
    executeWithdraw, uploadCampaignImage
} from '../modules/charity-transactions.js';

const ethers = window.ethers;

// Constants
const EXPLORER_ADDRESS = "https://arbiscan.io/address/";
const SHARE_BASE_URL = window.location.origin;
const PLACEHOLDER_IMAGES = {
    animal: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    humanitarian: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
    default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'
};

const CATEGORIES = {
    animal: { id: 'animal', name: 'Animal Welfare', icon: 'fa-paw', emoji: '🐾', color: '#10b981' },
    humanitarian: { id: 'humanitarian', name: 'Humanitarian Aid', icon: 'fa-hand-holding-heart', emoji: '💗', color: '#ec4899' }
};

// State
const CS = { campaigns: [], stats: null, currentView: 'main', currentCampaign: null, selectedCategory: null, isLoading: false, pendingImage: null };

// Styles
function injectStyles() {
    if (document.getElementById('cp-styles')) return;
    const s = document.createElement('style');
    s.id = 'cp-styles';
    s.textContent = `
.charity-page { --cp-primary:#f59e0b; --cp-success:#10b981; --cp-danger:#ef4444; --cp-bg:#18181b; --cp-bg2:#27272a; --cp-bg3:#3f3f46; --cp-border:rgba(63,63,70,0.6); --cp-text:#fafafa; --cp-muted:#a1a1aa; --cp-radius:16px; max-width:1400px; margin:0 auto; padding:0 1rem; }
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
.cp-card-badges { display:flex; gap:0.375rem; margin-bottom:0.5rem; }
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
.cp-card-footer { display:flex; justify-content:space-between; align-items:center; padding-top:0.75rem; margin-top:0.75rem; border-top:1px solid var(--cp-border); font-size:0.7rem; color:var(--cp-muted); }
.cp-card-time.urgent { color:var(--cp-danger); }
.cp-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.625rem 1rem; border-radius:10px; font-weight:700; font-size:0.8rem; cursor:pointer; transition:all 0.2s; border:none; text-decoration:none; }
.cp-btn:disabled { opacity:0.5; cursor:not-allowed; }
.cp-btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; }
.cp-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 25px rgba(245,158,11,0.4); }
.cp-btn-secondary { background:var(--cp-bg3); color:var(--cp-muted); border:1px solid var(--cp-border); }
.cp-btn-secondary:hover:not(:disabled) { background:var(--cp-bg2); color:var(--cp-text); }
.cp-btn-success { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
.cp-btn-success:hover:not(:disabled) { box-shadow:0 10px 25px rgba(16,185,129,0.4); }
.cp-btn-danger { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; }
.cp-btn-lg { padding:0.875rem 1.5rem; font-size:0.9rem; }
.cp-btn-block { width:100%; }
.cp-empty { text-align:center; padding:3rem 1.5rem; color:var(--cp-muted); }
.cp-empty i { font-size:3rem; margin-bottom:1rem; opacity:0.5; }
.cp-empty h3 { font-size:1.125rem; color:var(--cp-text); margin-bottom:0.5rem; }
.cp-loading { display:flex; flex-direction:column; align-items:center; padding:3rem; }
.cp-spinner { width:40px; height:40px; border:3px solid var(--cp-border); border-top-color:var(--cp-primary); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:1rem; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Modal */
.cp-modal { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); opacity:0; visibility:hidden; transition:all 0.3s; padding:1rem; }
.cp-modal.active { opacity:1; visibility:visible; }
.cp-modal-content { background:var(--cp-bg); border:1px solid var(--cp-border); border-radius:var(--cp-radius); width:100%; max-width:550px; max-height:90vh; overflow-y:auto; transform:scale(0.95); transition:transform 0.3s; }
.cp-modal.active .cp-modal-content { transform:scale(1); }
.cp-modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border-bottom:1px solid var(--cp-border); }
.cp-modal-title { font-size:1.125rem; font-weight:700; color:var(--cp-text); }
.cp-modal-close { width:32px; height:32px; border-radius:50%; background:var(--cp-bg3); border:none; color:var(--cp-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; }
.cp-modal-close:hover { background:var(--cp-danger); color:#fff; }
.cp-modal-body { padding:1.25rem; }
.cp-modal-footer { padding:1.25rem; border-top:1px solid var(--cp-border); display:flex; gap:0.75rem; justify-content:flex-end; }

/* Form */
.cp-form-group { margin-bottom:1rem; }
.cp-form-label { display:block; font-size:0.8rem; font-weight:600; color:var(--cp-text); margin-bottom:0.375rem; }
.cp-form-label span { color:var(--cp-muted); font-weight:400; }
.cp-form-input, .cp-form-textarea, .cp-form-select { width:100%; padding:0.75rem; background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:10px; color:var(--cp-text); font-size:0.875rem; }
.cp-form-input:focus, .cp-form-textarea:focus { outline:none; border-color:var(--cp-primary); }
.cp-form-input::placeholder, .cp-form-textarea::placeholder { color:var(--cp-muted); }
.cp-form-textarea { min-height:100px; resize:vertical; }
.cp-form-hint { font-size:0.7rem; color:var(--cp-muted); margin-top:0.25rem; }
.cp-form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.cp-cat-selector { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.cp-cat-option { padding:0.75rem; background:var(--cp-bg2); border:2px solid var(--cp-border); border-radius:10px; cursor:pointer; text-align:center; transition:all 0.2s; }
.cp-cat-option:hover { border-color:var(--cp-muted); }
.cp-cat-option.selected { border-color:var(--cp-primary); background:rgba(245,158,11,0.1); }
.cp-cat-option input { display:none; }
.cp-cat-option-icon { font-size:1.25rem; margin-bottom:0.25rem; }
.cp-cat-option-name { font-size:0.8rem; font-weight:600; color:var(--cp-text); }
.cp-img-upload { border:2px dashed var(--cp-border); border-radius:10px; padding:1.5rem; text-align:center; cursor:pointer; transition:all 0.2s; position:relative; }
.cp-img-upload:hover { border-color:var(--cp-primary); background:rgba(245,158,11,0.05); }
.cp-img-upload input { position:absolute; inset:0; opacity:0; cursor:pointer; }
.cp-img-upload-placeholder { color:var(--cp-muted); }
.cp-img-upload-placeholder i { font-size:2rem; margin-bottom:0.5rem; display:block; }
.cp-img-preview { width:100%; height:150px; object-fit:cover; border-radius:8px; }
.cp-img-remove { position:absolute; top:0.5rem; right:0.5rem; width:28px; height:28px; border-radius:50%; background:var(--cp-danger); color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; }
.cp-donate-presets { display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; margin-bottom:1rem; }
.cp-preset { padding:0.5rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-muted); font-size:0.8rem; cursor:pointer; transition:all 0.2s; }
.cp-preset:hover { background:var(--cp-primary); border-color:var(--cp-primary); color:#000; }
.cp-fee-info { padding:0.75rem; background:rgba(245,158,11,0.1); border-radius:8px; font-size:0.75rem; color:var(--cp-muted); }
.cp-fee-info strong { color:var(--cp-primary); }

/* Detail Page */
.cp-detail { animation:fadeIn 0.4s; }
.cp-back { display:inline-flex; align-items:center; gap:0.5rem; color:var(--cp-muted); font-size:0.875rem; cursor:pointer; margin-bottom:1.5rem; transition:color 0.2s; }
.cp-back:hover { color:var(--cp-primary); }
.cp-detail-grid { display:grid; grid-template-columns:1fr 380px; gap:1.5rem; }
.cp-detail-main { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); overflow:hidden; }
.cp-detail-img { width:100%; height:350px; object-fit:cover; background:var(--cp-bg3); }
.cp-detail-content { padding:1.5rem; }
.cp-detail-title { font-size:1.5rem; font-weight:800; color:var(--cp-text); margin-bottom:0.5rem; }
.cp-detail-creator { font-size:0.875rem; color:var(--cp-muted); margin-bottom:1.25rem; }
.cp-detail-creator a { color:var(--cp-primary); text-decoration:none; }
.cp-detail-desc { color:var(--cp-muted); line-height:1.7; white-space:pre-wrap; margin-bottom:1.5rem; }
.cp-detail-links { display:flex; flex-wrap:wrap; gap:0.5rem; }
.cp-detail-link { display:inline-flex; align-items:center; gap:0.375rem; padding:0.5rem 0.875rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:8px; color:var(--cp-text); font-size:0.8rem; text-decoration:none; transition:all 0.2s; }
.cp-detail-link:hover { background:var(--cp-primary); border-color:var(--cp-primary); color:#000; }
.cp-sidebar { position:sticky; top:1rem; }
.cp-donate-box { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.25rem; margin-bottom:1rem; }
.cp-donate-amounts { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.75rem; }
.cp-donate-raised { font-size:1.5rem; font-weight:800; color:var(--cp-success); }
.cp-donate-goal { font-size:0.9rem; color:var(--cp-muted); }
.cp-donate-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; margin:1rem 0; padding:0.875rem; background:var(--cp-bg3); border-radius:10px; text-align:center; }
.cp-donate-stat-val { font-size:1rem; font-weight:700; color:var(--cp-text); }
.cp-donate-stat-lbl { font-size:0.65rem; color:var(--cp-muted); text-transform:uppercase; }
.cp-donate-input-wrap { position:relative; margin-bottom:0.75rem; }
.cp-donate-input { width:100%; padding:0.875rem; padding-right:50px; background:var(--cp-bg); border:2px solid var(--cp-border); border-radius:10px; color:var(--cp-text); font-size:1rem; font-weight:600; }
.cp-donate-input:focus { outline:none; border-color:var(--cp-primary); }
.cp-donate-currency { position:absolute; right:1rem; top:50%; transform:translateY(-50%); color:var(--cp-muted); font-weight:600; }
.cp-share-box { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1rem; text-align:center; }
.cp-share-title { font-size:0.8rem; font-weight:600; color:var(--cp-text); margin-bottom:0.75rem; }
.cp-share-btns { display:flex; justify-content:center; gap:0.5rem; }
.cp-share-btn { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; cursor:pointer; transition:all 0.2s; border:none; }
.cp-share-btn.twitter { background:rgba(29,161,242,0.15); color:#1da1f2; }
.cp-share-btn.twitter:hover { background:#1da1f2; color:#fff; }
.cp-share-btn.telegram { background:rgba(0,136,204,0.15); color:#0088cc; }
.cp-share-btn.telegram:hover { background:#0088cc; color:#fff; }
.cp-share-btn.whatsapp { background:rgba(37,211,102,0.15); color:#25d366; }
.cp-share-btn.whatsapp:hover { background:#25d366; color:#fff; }
.cp-share-btn.copy { background:var(--cp-bg3); color:var(--cp-muted); }
.cp-share-btn.copy:hover { background:var(--cp-primary); color:#000; }

@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@media (max-width:1024px) { .cp-detail-grid { grid-template-columns:1fr; } .cp-sidebar { position:static; } }
@media (max-width:768px) { .cp-hero { flex-direction:column; text-align:center; } .cp-stats { grid-template-columns:repeat(2,1fr); } .cp-cats { grid-template-columns:1fr; } .cp-grid { grid-template-columns:1fr; } }
`;
    document.head.appendChild(s);
}

// Utilities
const fmt = (v) => { if (!v) return '0'; try { const n = parseFloat(ethers.formatEther(v)); if (n >= 1e6) return (n/1e6).toFixed(2)+'M'; if (n >= 1e3) return (n/1e3).toFixed(2)+'K'; return n.toLocaleString('en-US', {maximumFractionDigits:2}); } catch { return '0'; } };
const fmtAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '...';
const fmtTime = (d) => { const r = Number(d) - Math.floor(Date.now()/1000); if (r <= 0) return {text:'Ended',ended:true,urgent:false}; const dy = Math.floor(r/86400), hr = Math.floor((r%86400)/3600); if (dy > 0) return {text:`${dy}d ${hr}h left`,ended:false,urgent:dy<=3}; if (hr > 0) return {text:`${hr}h left`,ended:false,urgent:true}; return {text:`${Math.floor((r%3600)/60)}m left`,ended:false,urgent:true}; };
const calcProg = (r,g) => { if (!g) return 0; try { return Math.min((parseFloat(ethers.formatEther(r||0n)) / parseFloat(ethers.formatEther(g))) * 100, 100); } catch { return 0; } };
const getCampImg = (c) => c.imageUrl || PLACEHOLDER_IMAGES[c.category] || PLACEHOLDER_IMAGES.default;
const getIdFromUrl = () => { const m = window.location.hash.match(/charity\/campaign\/(\d+)/); return m ? m[1] : null; };
const setUrl = (id) => window.location.hash = `charity/campaign/${id}`;
const clearUrl = () => window.location.hash = 'charity';
const getShareUrl = (id) => `${SHARE_BASE_URL}/#charity/campaign/${id}`;
const canWithdraw = (c) => { if (!c || !State.userAddress) return false; const now = Math.floor(Date.now()/1000); const isCreator = c.creator?.toLowerCase() === State.userAddress.toLowerCase(); const ended = Number(c.deadline) <= now; const hasFunds = BigInt(c.raisedAmount?.toString()||'0') > 0n; return isCreator && hasFunds && ((ended && c.status === 0) || c.status === 2); };

// Render Functions
const renderBadge = (status) => { const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[0]; return `<span class="cp-badge" style="background:${cfg.color}20;color:${cfg.color};border:1px solid ${cfg.color}"><i class="fa-solid ${cfg.icon}"></i> ${cfg.label}</span>`; };
const renderCatBadge = (cat) => { const c = CATEGORIES[cat]; return c ? `<span class="cp-badge" style="background:${c.color}20;color:${c.color}">${c.emoji} ${c.name}</span>` : ''; };

const renderCard = (c) => {
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    return `<div class="cp-card" onclick="CharityPage.viewCampaign('${c.id}')">
        <img src="${getCampImg(c)}" class="cp-card-img" onerror="this.src='${PLACEHOLDER_IMAGES[cat]}'" alt="${c.title}">
        <div class="cp-card-body">
            <div class="cp-card-badges">${renderBadge(c.status)}${renderCatBadge(cat)}</div>
            <h3 class="cp-card-title">${c.title}</h3>
            <div class="cp-card-creator">by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" onclick="event.stopPropagation()">${fmtAddr(c.creator)}</a></div>
            <div class="cp-progress"><div class="cp-progress-fill ${cat}" style="width:${prog}%"></div></div>
            <div class="cp-progress-stats"><span class="cp-progress-raised">${fmt(c.raisedAmount)} BKC</span><span class="cp-progress-goal">of ${fmt(c.goalAmount)}</span></div>
            <div class="cp-card-footer"><span class="cp-card-time ${time.urgent?'urgent':''}"><i class="fa-regular fa-clock"></i> ${time.text}</span><span>${c.donationCount||0} donors</span></div>
        </div>
    </div>`;
};

const renderEmpty = (msg) => `<div class="cp-empty"><i class="fa-solid fa-heart-crack"></i><h3>${msg}</h3><p>Be the first to create a campaign!</p><button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create Campaign</button></div>`;
const renderLoading = () => `<div class="cp-loading"><div class="cp-spinner"></div><span>Loading...</span></div>`;

// Main View
function renderMain() {
    const stats = CS.stats || {};
    const camps = CS.campaigns || [];
    const active = camps.filter(c => isCampaignActive(c));
    const animalCamps = camps.filter(c => c.category === 'animal');
    const humanCamps = camps.filter(c => c.category === 'humanitarian');
    const animalActive = animalCamps.filter(c => isCampaignActive(c));
    const humanActive = humanCamps.filter(c => isCampaignActive(c));
    const animalRaised = animalCamps.reduce((s,c) => s + BigInt(c.raisedAmount?.toString()||'0'), 0n);
    const humanRaised = humanCamps.reduce((s,c) => s + BigInt(c.raisedAmount?.toString()||'0'), 0n);
    
    let filtered = CS.selectedCategory ? active.filter(c => c.category === CS.selectedCategory) : active;
    filtered.sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0));
    
    return `<div class="charity-page">
        <div class="cp-hero">
            <div class="cp-hero-left">
                <h1><span class="cp-hero-icon"><i class="fa-solid fa-hand-holding-heart"></i></span> Charity Pool</h1>
                <p>Transparent crowdfunding with deflationary impact. Every donation burns 1% of BKC.</p>
            </div>
            <div class="cp-actions">
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()"><i class="fa-solid fa-folder-open"></i> My Campaigns</button>
                <button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button>
            </div>
        </div>
        <div class="cp-stats">
            <div class="cp-stat"><div class="cp-stat-val g">${fmt(stats.totalRaised||0n)}</div><div class="cp-stat-lbl">BKC Raised</div></div>
            <div class="cp-stat"><div class="cp-stat-val b">${stats.totalCampaigns||0}</div><div class="cp-stat-lbl">Campaigns</div></div>
            <div class="cp-stat"><div class="cp-stat-val o">${fmt(stats.totalBurned||0n)}</div><div class="cp-stat-lbl">BKC Burned 🔥</div></div>
            <div class="cp-stat"><div class="cp-stat-val p">${stats.totalSuccessful||0}</div><div class="cp-stat-lbl">Successful</div></div>
        </div>
        <div class="cp-cats">
            <div class="cp-cat animal" onclick="CharityPage.selectCat('animal')">
                <div class="cp-cat-icon"><i class="fa-solid fa-paw"></i></div>
                <div class="cp-cat-name">🐾 Animal Welfare</div>
                <div class="cp-cat-stats"><div><strong>${animalActive.length}</strong> Active</div><div><strong>${fmt(animalRaised)}</strong> Raised</div></div>
                <div class="cp-cat-actions"><button class="cp-btn cp-btn-success" onclick="event.stopPropagation();CharityPage.openCreate('animal')"><i class="fa-solid fa-plus"></i> Create</button></div>
            </div>
            <div class="cp-cat humanitarian" onclick="CharityPage.selectCat('humanitarian')">
                <div class="cp-cat-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
                <div class="cp-cat-name">💗 Humanitarian Aid</div>
                <div class="cp-cat-stats"><div><strong>${humanActive.length}</strong> Active</div><div><strong>${fmt(humanRaised)}</strong> Raised</div></div>
                <div class="cp-cat-actions"><button class="cp-btn cp-btn-success" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')"><i class="fa-solid fa-plus"></i> Create</button></div>
            </div>
        </div>
        <div class="cp-section-header">
            <h2 class="cp-section-title"><i class="fa-solid fa-fire" style="color:var(--cp-primary)"></i> ${CS.selectedCategory ? CATEGORIES[CS.selectedCategory].name : 'Active Campaigns'}</h2>
            <div style="display:flex;gap:0.5rem">
                ${CS.selectedCategory ? `<button class="cp-btn cp-btn-secondary" onclick="CharityPage.clearCat()"><i class="fa-solid fa-times"></i> Clear</button>` : ''}
                <button class="cp-btn cp-btn-secondary" onclick="CharityPage.refresh()"><i class="fa-solid fa-rotate"></i> Refresh</button>
            </div>
        </div>
        <div class="cp-grid" id="cp-grid">${CS.isLoading ? renderLoading() : filtered.length ? filtered.map(c=>renderCard(c)).join('') : renderEmpty('No active campaigns')}</div>
        ${renderCreateModal()}${renderDonateModal()}${renderMyCampaignsModal()}
    </div>`;
}

// Detail View
function renderDetail(c) {
    if (!c) return `<div class="charity-page"><div class="cp-empty"><i class="fa-solid fa-circle-exclamation"></i><h3>Campaign Not Found</h3><button class="cp-btn cp-btn-primary" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button></div></div>`;
    
    const prog = calcProg(c.raisedAmount, c.goalAmount);
    const time = fmtTime(c.deadline);
    const cat = c.category || 'humanitarian';
    const isActive = isCampaignActive(c);
    const canWd = canWithdraw(c);
    const links = [];
    if (c.websiteUrl) links.push({icon:'fa-globe',url:c.websiteUrl,label:'Website'});
    if (c.youtubeUrl) links.push({icon:'fa-brands fa-youtube',url:c.youtubeUrl,label:'YouTube'});
    if (c.twitterUrl) links.push({icon:'fa-brands fa-x-twitter',url:c.twitterUrl,label:'Twitter'});
    if (c.telegramUrl) links.push({icon:'fa-brands fa-telegram',url:c.telegramUrl,label:'Telegram'});
    
    return `<div class="charity-page cp-detail">
        <div class="cp-back" onclick="CharityPage.goBack()"><i class="fa-solid fa-arrow-left"></i> Back to Campaigns</div>
        <div class="cp-detail-grid">
            <div class="cp-detail-main">
                <img src="${getCampImg(c)}" class="cp-detail-img" onerror="this.src='${PLACEHOLDER_IMAGES[cat]}'" alt="${c.title}">
                <div class="cp-detail-content">
                    <div class="cp-card-badges" style="margin-bottom:0.75rem">${renderBadge(c.status)}${renderCatBadge(cat)}</div>
                    <h1 class="cp-detail-title">${c.title}</h1>
                    <div class="cp-detail-creator">Created by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank">${fmtAddr(c.creator)}</a></div>
                    <div class="cp-detail-desc">${c.description || 'No description provided.'}</div>
                    ${links.length ? `<div class="cp-detail-links">${links.map(l=>`<a href="${l.url}" target="_blank" class="cp-detail-link"><i class="${l.icon}"></i> ${l.label}</a>`).join('')}</div>` : ''}
                </div>
            </div>
            <div class="cp-sidebar">
                <div class="cp-donate-box">
                    <div class="cp-donate-amounts"><span class="cp-donate-raised">${fmt(c.raisedAmount)} BKC</span><span class="cp-donate-goal">of ${fmt(c.goalAmount)}</span></div>
                    <div class="cp-progress" style="height:10px"><div class="cp-progress-fill ${cat}" style="width:${prog}%"></div></div>
                    <div class="cp-donate-stats">
                        <div><div class="cp-donate-stat-val">${prog.toFixed(1)}%</div><div class="cp-donate-stat-lbl">Funded</div></div>
                        <div><div class="cp-donate-stat-val">${c.donationCount||0}</div><div class="cp-donate-stat-lbl">Donors</div></div>
                        <div><div class="cp-donate-stat-val">${time.text}</div><div class="cp-donate-stat-lbl">Left</div></div>
                    </div>
                    ${isActive ? `
                        <div class="cp-donate-input-wrap"><input type="number" id="detail-amount" class="cp-donate-input" placeholder="0.00" min="1" step="0.01"><span class="cp-donate-currency">BKC</span></div>
                        <div class="cp-donate-presets"><button class="cp-preset" onclick="CharityPage.setAmt(10)">10</button><button class="cp-preset" onclick="CharityPage.setAmt(50)">50</button><button class="cp-preset" onclick="CharityPage.setAmt(100)">100</button><button class="cp-preset" onclick="CharityPage.setAmt(500)">500</button></div>
                        <div class="cp-fee-info"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥 • <strong>95%</strong> to campaign</div>
                        <button id="btn-detail-donate" class="cp-btn cp-btn-success cp-btn-lg cp-btn-block" style="margin-top:1rem" onclick="CharityPage.donateDetail('${c.id}')"><i class="fa-solid fa-heart"></i> Donate Now</button>
                    ` : canWd ? `
                        <button id="btn-withdraw" class="cp-btn cp-btn-primary cp-btn-lg cp-btn-block" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw Funds</button>
                        <div class="cp-fee-info" style="margin-top:0.75rem">Fee: <strong>0.001 ETH</strong>${prog<100?' • 10% burned (goal not met)':''}</div>
                    ` : `<div class="cp-fee-info" style="text-align:center">This campaign has ended.</div>`}
                </div>
                <div class="cp-share-box">
                    <div class="cp-share-title">Share this campaign</div>
                    <div class="cp-share-btns">
                        <button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')"><i class="fa-brands fa-x-twitter"></i></button>
                        <button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')"><i class="fa-brands fa-telegram"></i></button>
                        <button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')"><i class="fa-brands fa-whatsapp"></i></button>
                        <button class="cp-share-btn copy" onclick="CharityPage.copyLink()"><i class="fa-solid fa-link"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// Modals
const renderCreateModal = () => `<div class="cp-modal" id="modal-create">
    <div class="cp-modal-content">
        <div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-plus" style="color:var(--cp-primary)"></i> Create Campaign</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('create')"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="cp-modal-body">
            <div class="cp-form-group"><label class="cp-form-label">Category *</label><div class="cp-cat-selector">
                <label class="cp-cat-option" id="opt-animal"><input type="radio" name="category" value="animal" onchange="CharityPage.selCat(this)"><div class="cp-cat-option-icon">🐾</div><div class="cp-cat-option-name">Animal</div></label>
                <label class="cp-cat-option selected" id="opt-humanitarian"><input type="radio" name="category" value="humanitarian" checked onchange="CharityPage.selCat(this)"><div class="cp-cat-option-icon">💗</div><div class="cp-cat-option-name">Humanitarian</div></label>
            </div></div>
            <div class="cp-form-group"><label class="cp-form-label">Image <span>(optional)</span></label>
                <div class="cp-img-upload" id="img-upload"><input type="file" id="campaign-image" accept="image/*" onchange="CharityPage.onImage(event)"><div class="cp-img-upload-placeholder" id="img-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i><p>Click to upload (max 5MB)</p></div></div>
                <input type="url" id="campaign-image-url" class="cp-form-input" placeholder="Or paste image URL" style="margin-top:0.5rem">
            </div>
            <div class="cp-form-group"><label class="cp-form-label">Title *</label><input type="text" id="campaign-title" class="cp-form-input" placeholder="Campaign title" required maxlength="100"></div>
            <div class="cp-form-group"><label class="cp-form-label">Description *</label><textarea id="campaign-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." required maxlength="2000"></textarea></div>
            <div class="cp-form-row">
                <div class="cp-form-group"><label class="cp-form-label">Goal (BKC) *</label><input type="number" id="campaign-goal" class="cp-form-input" placeholder="1000" required min="1" step="0.01"></div>
                <div class="cp-form-group"><label class="cp-form-label">Duration (Days) *</label><input type="number" id="campaign-duration" class="cp-form-input" placeholder="30" required min="1" max="180"></div>
            </div>
            <details class="cp-form-group"><summary style="cursor:pointer;color:var(--cp-muted)"><i class="fa-solid fa-link"></i> Social Links (optional)</summary>
                <div style="display:grid;gap:0.5rem;margin-top:0.75rem">
                    <input type="url" id="campaign-website" class="cp-form-input" placeholder="Website URL">
                    <input type="url" id="campaign-youtube" class="cp-form-input" placeholder="YouTube URL">
                    <input type="url" id="campaign-twitter" class="cp-form-input" placeholder="Twitter/X URL">
                    <input type="url" id="campaign-telegram" class="cp-form-input" placeholder="Telegram URL">
                </div>
            </details>
        </div>
        <div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('create')">Cancel</button><button id="btn-create" class="cp-btn cp-btn-primary" onclick="CharityPage.create()"><i class="fa-solid fa-rocket"></i> Launch</button></div>
    </div>
</div>`;

const renderDonateModal = () => `<div class="cp-modal" id="modal-donate">
    <div class="cp-modal-content" style="max-width:420px">
        <div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Donate</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="cp-modal-body">
            <input type="hidden" id="donate-campaign-id">
            <div id="donate-info" style="margin-bottom:1rem"></div>
            <div class="cp-form-group"><label class="cp-form-label">Amount (BKC)</label><div class="cp-donate-input-wrap"><input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.00" min="1" step="0.01"><span class="cp-donate-currency">BKC</span></div></div>
            <div class="cp-donate-presets"><button class="cp-preset" onclick="document.getElementById('donate-amount').value=10">10</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=50">50</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=100">100</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=500">500</button></div>
            <div class="cp-fee-info"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥 • <strong>95%</strong> to campaign</div>
        </div>
        <div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button><button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button></div>
    </div>
</div>`;

const renderMyCampaignsModal = () => `<div class="cp-modal" id="modal-my"><div class="cp-modal-content" style="max-width:650px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-folder-open" style="color:var(--cp-primary)"></i> My Campaigns</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body" id="my-campaigns-content">${renderLoading()}</div></div></div>`;

// Event Handlers
function openModal(id) { document.getElementById(`modal-${id}`)?.classList.add('active'); }
function closeModal(id) { document.getElementById(`modal-${id}`)?.classList.remove('active'); if (id==='create') CS.pendingImage = null; }
function openCreate(cat=null) { if (!State.isConnected) { showToast('Connect wallet first','warning'); return; } openModal('create'); if (cat) { const r = document.querySelector(`input[name="category"][value="${cat}"]`); if (r) { r.checked = true; selCat(r); } } resetImgUpload(); }
function openDonate(id) { if (!State.isConnected) { showToast('Connect wallet first','warning'); return; } const c = CS.campaigns.find(x=>x.id===id||x.id===String(id)); if (!c) return showToast('Campaign not found','error'); document.getElementById('donate-campaign-id').value = id; document.getElementById('donate-amount').value = ''; document.getElementById('donate-info').innerHTML = `<div style="padding:0.75rem;background:var(--cp-bg3);border-radius:8px"><strong style="color:var(--cp-text)">${c.title}</strong><div style="font-size:0.8rem;color:var(--cp-muted);margin-top:0.25rem">${fmt(c.raisedAmount)} / ${fmt(c.goalAmount)} BKC</div></div>`; openModal('donate'); }
async function openMyCampaigns() { if (!State.isConnected) { showToast('Connect wallet first','warning'); return; } openModal('my'); const el = document.getElementById('my-campaigns-content'); el.innerHTML = renderLoading(); const mine = CS.campaigns.filter(c=>c.creator?.toLowerCase()===State.userAddress.toLowerCase()); if (!mine.length) { el.innerHTML = `<div class="cp-empty" style="padding:1.5rem"><i class="fa-solid fa-folder-open"></i><h3>No Campaigns</h3><button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div>`; return; } el.innerHTML = mine.map(c=>{ const prog = calcProg(c.raisedAmount,c.goalAmount); const time = fmtTime(c.deadline); const isActive = isCampaignActive(c); const canWd = canWithdraw(c); return `<div style="display:flex;gap:1rem;padding:1rem;background:var(--cp-bg3);border-radius:10px;margin-bottom:0.75rem"><img src="${getCampImg(c)}" style="width:70px;height:70px;object-fit:cover;border-radius:8px" onerror="this.src='${PLACEHOLDER_IMAGES.default}'"><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem"><h4 style="margin:0;color:var(--cp-text);font-size:0.9rem">${c.title}</h4>${renderBadge(c.status)}</div><div style="margin-top:0.5rem"><div class="cp-progress"><div class="cp-progress-fill ${c.category||'humanitarian'}" style="width:${prog}%"></div></div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-top:0.25rem"><span style="color:var(--cp-text)">${fmt(c.raisedAmount)} BKC</span><span style="color:var(--cp-muted)">${time.text}</span></div></div><div style="display:flex;gap:0.375rem;margin-top:0.625rem"><button class="cp-btn cp-btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.closeModal('my');CharityPage.viewCampaign('${c.id}')"><i class="fa-solid fa-eye"></i> View</button>${isActive?`<button class="cp-btn cp-btn-danger" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.cancel('${c.id}')"><i class="fa-solid fa-xmark"></i> Cancel</button>`:''}${canWd?`<button class="cp-btn cp-btn-primary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw</button>`:''}</div></div></div>`; }).join(''); }

function selCat(input) { document.querySelectorAll('.cp-cat-option').forEach(e=>e.classList.remove('selected')); input.closest('.cp-cat-option').classList.add('selected'); }
function onImage(e) { const f = e.target.files[0]; if (!f) return; if (f.size > 5*1024*1024) return showToast('Max 5MB','error'); if (!f.type.startsWith('image/')) return showToast('Select image','error'); CS.pendingImage = f; const reader = new FileReader(); reader.onload = (ev) => { const el = document.getElementById('img-upload'); el.innerHTML = `<img src="${ev.target.result}" class="cp-img-preview"><button type="button" class="cp-img-remove" onclick="event.stopPropagation();CharityPage.removeImg()"><i class="fa-solid fa-xmark"></i></button><input type="file" id="campaign-image" accept="image/*" onchange="CharityPage.onImage(event)">`; }; reader.readAsDataURL(f); }
function removeImg() { CS.pendingImage = null; resetImgUpload(); }
function resetImgUpload() { const el = document.getElementById('img-upload'); if (el) el.innerHTML = `<input type="file" id="campaign-image" accept="image/*" onchange="CharityPage.onImage(event)"><div class="cp-img-upload-placeholder" id="img-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i><p>Click to upload (max 5MB)</p></div>`; }
function setAmt(v) { const el = document.getElementById('detail-amount'); if (el) el.value = v; }

// Transactions
async function create() { if (!State.isConnected) return showToast('Connect wallet','warning'); const btn = document.getElementById('btn-create'); const orig = btn.innerHTML; try { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...'; const title = document.getElementById('campaign-title').value.trim(); const desc = document.getElementById('campaign-desc').value.trim(); const goal = document.getElementById('campaign-goal').value; const dur = parseInt(document.getElementById('campaign-duration').value); const cat = document.querySelector('input[name="category"]:checked')?.value || 'humanitarian'; let imgUrl = document.getElementById('campaign-image-url').value.trim(); if (!title) return showToast('Enter title','error'); if (!goal || parseFloat(goal) < 1) return showToast('Goal min 1 BKC','error'); if (!dur || dur < 1 || dur > 180) return showToast('Duration 1-180 days','error'); if (CS.pendingImage && !imgUrl) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...'; const up = await uploadCampaignImage(CS.pendingImage); if (up.success) imgUrl = up.url; } btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirm...'; const result = await executeCreateCampaign({ title, description: desc, goalAmount: goal, durationDays: dur, category: cat, imageUrl: imgUrl, websiteUrl: document.getElementById('campaign-website')?.value.trim()||null, youtubeUrl: document.getElementById('campaign-youtube')?.value.trim()||null, twitterUrl: document.getElementById('campaign-twitter')?.value.trim()||null, telegramUrl: document.getElementById('campaign-telegram')?.value.trim()||null }, btn); if (result.success) { closeModal('create'); clearCharityCache(); await loadData(); if (result.campaignId) setTimeout(()=>viewCampaign(result.campaignId),1500); } } catch (e) { console.error(e); showToast('Failed','error'); } finally { btn.disabled = false; btn.innerHTML = orig; } }

async function donate() { if (!State.isConnected) return showToast('Connect wallet','warning'); const id = document.getElementById('donate-campaign-id').value; const amt = document.getElementById('donate-amount').value; if (!amt || parseFloat(amt) <= 0) return showToast('Enter amount','error'); const btn = document.getElementById('btn-donate'); const r = await executeDonate(id, amt, btn); if (r.success) { closeModal('donate'); clearCharityCache(); await loadData(); } }

async function donateDetail(id) { if (!State.isConnected) return showToast('Connect wallet','warning'); const amt = document.getElementById('detail-amount').value; if (!amt || parseFloat(amt) <= 0) return showToast('Enter amount','error'); const btn = document.getElementById('btn-detail-donate'); const r = await executeDonate(id, amt, btn); if (r.success) { clearCharityCache(); await loadData(); await loadDetail(id); } }

async function cancel(id) { if (!confirm('Cancel this campaign?')) return; const r = await executeCancelCampaign(id); if (r.success) { closeModal('my'); clearCharityCache(); await loadData(); } }

async function withdraw(id) { if (!State.isConnected) return showToast('Connect wallet','warning'); const c = CS.campaigns.find(x=>x.id===id||x.id===String(id)); if (!c) return; const prog = calcProg(c.raisedAmount, c.goalAmount); let msg = `Withdraw ${fmt(c.raisedAmount)} BKC?\n\nFee: 0.001 ETH`; if (prog < 100) msg += `\n10% will be burned (goal not met)`; if (!confirm(msg)) return; const btn = document.getElementById('btn-withdraw'); const r = await executeWithdraw(id, btn); if (r.success) { closeModal('my'); clearCharityCache(); await loadData(); if (CS.currentCampaign?.id === id) await loadDetail(id); } }

// Share
function share(platform) { const c = CS.currentCampaign; if (!c) return; const url = getShareUrl(c.id); const txt = `🙏 Support "${c.title}" on Backcoin Charity!\n\n${fmt(c.raisedAmount)} raised of ${fmt(c.goalAmount)} goal.\n\n`; let shareUrl; if (platform==='twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`; else if (platform==='telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`; else if (platform==='whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(txt+url)}`; if (shareUrl) window.open(shareUrl,'_blank','width=600,height=400'); }
function copyLink() { const c = CS.currentCampaign; if (!c) return; navigator.clipboard.writeText(getShareUrl(c.id)).then(()=>showToast('Link copied!','success')).catch(()=>showToast('Copy failed','error')); }

// Navigation
function goBack() { clearUrl(); CS.currentCampaign = null; CS.currentView = 'main'; render(); }
function viewCampaign(id) { closeModal('my'); closeModal('donate'); setUrl(id); loadDetail(id); }
function selectCat(cat) { CS.selectedCategory = CS.selectedCategory === cat ? null : cat; updateGrid(); }
function clearCat() { CS.selectedCategory = null; updateGrid(); }
function updateGrid() { const grid = document.getElementById('cp-grid'); if (!grid) return; let active = CS.campaigns.filter(c=>isCampaignActive(c)); if (CS.selectedCategory) active = active.filter(c=>c.category===CS.selectedCategory); active.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)); grid.innerHTML = active.length ? active.map(c=>renderCard(c)).join('') : renderEmpty('No campaigns'); }

// Data Loading
async function loadData() { CS.isLoading = true; try { const [stats, camps] = await Promise.all([loadCharityStats(false), loadCampaigns({forceRefresh:false})]); CS.stats = stats; CS.campaigns = camps || []; } catch (e) { console.error(e); } finally { CS.isLoading = false; } }
async function loadDetail(id) { CS.currentView = 'detail'; CS.isLoading = true; const container = document.getElementById('charity-container'); if (container) container.innerHTML = renderLoading(); try { let c = CS.campaigns.find(x=>x.id===id||x.id===String(id)); if (!c) c = await loadCampaignDetails(id); CS.currentCampaign = c; if (container) container.innerHTML = renderDetail(c); } catch (e) { console.error(e); if (container) container.innerHTML = renderDetail(null); } finally { CS.isLoading = false; } }

// Main Render
function render() { injectStyles(); const container = document.getElementById('charity-container') || document.querySelector('.page-content'); if (!container) return; container.id = 'charity-container'; const id = getIdFromUrl(); if (id) loadDetail(id); else { CS.currentView = 'main'; CS.currentCampaign = null; container.innerHTML = renderMain(); loadData().then(()=>{ if (CS.currentView==='main') { const c = document.getElementById('charity-container'); if (c) c.innerHTML = renderMain(); } }); } }
async function refresh() { clearCharityCache(); CS.campaigns = []; CS.stats = null; if (CS.currentView==='detail' && CS.currentCampaign) await loadDetail(CS.currentCampaign.id); else render(); }

// Hash listener
window.addEventListener('hashchange', () => { if (window.location.hash.startsWith('#charity')) { const id = getIdFromUrl(); if (id) { if (CS.currentCampaign?.id !== id) loadDetail(id); } else if (CS.currentView !== 'main') goBack(); } });

// Export
export const CharityPage = {
    async render(isActive) { if (isActive) render(); },
    update() { if (CS.currentView==='main') updateGrid(); },
    refresh,
    openModal, closeModal, openCreate, openDonate, openMyCampaigns,
    create, donate, donateDetail, cancel, withdraw,
    onImage, removeImg, selCat, setAmt,
    goBack, viewCampaign, selectCat, clearCat,
    share, copyLink
};
window.CharityPage = CharityPage;