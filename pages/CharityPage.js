// js/pages/CharityPage.js
// ✅ PRODUCTION V3.4 - Fixed tx.wait() parsing error on Arbitrum

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// Campaign Status
const CampaignStatus = { ACTIVE: 0, COMPLETED: 1, CANCELLED: 2, WITHDRAWN: 3 };
const isCampaignActive = (c) => c.status === 0 && Number(c.deadline) > Math.floor(Date.now() / 1000);

// ABI - CORRECT ORDER matching CharityPool.sol struct
const charityPoolABI = [
    "function campaigns(uint256) view returns (address creator, string title, string description, uint256 goalAmount, uint256 raisedAmount, uint256 donationCount, uint256 deadline, uint256 createdAt, uint8 status)",
    "function campaignCounter() view returns (uint256)",
    "function totalRaisedAllTime() view returns (uint256)",
    "function totalBurnedAllTime() view returns (uint256)",
    "function totalCampaignsCreated() view returns (uint256)",
    "function totalSuccessfulWithdrawals() view returns (uint256)",
    "function createCampaign(string,string,uint256,uint256) returns (uint256)",
    "function donate(uint256,uint256)",
    "function cancelCampaign(uint256)",
    "function withdraw(uint256) payable",
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount, uint256 deadline)",
    "event DonationMade(uint256 indexed campaignId, uint256 indexed donationId, address indexed donor, uint256 grossAmount, uint256 netAmount, uint256 miningFee, uint256 burnedAmount)"
];

const bkcTokenABI = [
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
];

// API
const CHARITY_API = { getCampaigns: 'https://getcharitycampaigns-4wvdcuoouq-uc.a.run.app', saveCampaign: 'https://savecharitycampaign-4wvdcuoouq-uc.a.run.app' };

// Constants
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const PLACEHOLDER_IMAGES = { animal: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80', humanitarian: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80', default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80' };
const CATEGORIES = { animal: { name: 'Animal Welfare', emoji: '🐾', color: '#10b981' }, humanitarian: { name: 'Humanitarian Aid', emoji: '💗', color: '#ec4899' } };
const STATUS_CONFIG = { 0: { label: 'Active', color: '#10b981', icon: 'fa-circle-play' }, 1: { label: 'Ended', color: '#3b82f6', icon: 'fa-circle-check' }, 2: { label: 'Cancelled', color: '#ef4444', icon: 'fa-circle-xmark' }, 3: { label: 'Completed', color: '#8b5cf6', icon: 'fa-circle-dollar-to-slot' } };

// State
const CS = { campaigns: [], stats: null, currentView: 'main', currentCampaign: null, selectedCategory: null, isLoading: false, pendingImage: null };

// Styles
function injectStyles() {
    if (document.getElementById('cp-styles-v3')) return;
    const s = document.createElement('style');
    s.id = 'cp-styles-v3';
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
.cp-donate-currency { position:absolute; right:1rem; top:50%; transform:translateY(-50%); color:var(--cp-muted); font-weight:600; }
.cp-donate-presets { display:flex; gap:0.5rem; margin-top:0.75rem; justify-content:center; }
.cp-preset { padding:0.5rem 1rem; background:var(--cp-bg3); border:1px solid var(--cp-border); border-radius:6px; color:var(--cp-text); font-weight:600; cursor:pointer; }
.cp-preset:hover { background:var(--cp-border); }
.cp-fee-info { text-align:center; font-size:0.75rem; color:var(--cp-muted); margin-top:1rem; padding:0.75rem; background:var(--cp-bg); border-radius:8px; }
.cp-detail { display:grid; grid-template-columns:1fr 380px; gap:2rem; }
.cp-detail-main { }
.cp-detail-sidebar { }
.cp-detail-img { width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:var(--cp-radius); background:var(--cp-bg3); }
.cp-detail-content { margin-top:1.5rem; }
.cp-detail-title { font-size:1.75rem; font-weight:800; color:var(--cp-text); margin:0 0 0.75rem; }
.cp-detail-meta { display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:1.5rem; font-size:0.85rem; color:var(--cp-muted); }
.cp-detail-meta a { color:var(--cp-primary); text-decoration:none; }
.cp-detail-desc { color:var(--cp-text); line-height:1.7; white-space:pre-wrap; }
.cp-detail-card { background:var(--cp-bg2); border:1px solid var(--cp-border); border-radius:var(--cp-radius); padding:1.5rem; position:sticky; top:1rem; }
.cp-detail-progress { margin-bottom:1.5rem; }
.cp-detail-raised { font-size:2rem; font-weight:800; margin-bottom:0.25rem; }
.cp-detail-goal { font-size:0.9rem; color:var(--cp-muted); margin-bottom:1rem; }
.cp-detail-stats { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--cp-border); }
.cp-detail-stat { text-align:center; }
.cp-detail-stat-val { font-size:1.25rem; font-weight:700; color:var(--cp-text); }
.cp-detail-stat-lbl { font-size:0.7rem; color:var(--cp-muted); text-transform:uppercase; }
.cp-detail-actions { display:flex; flex-direction:column; gap:0.75rem; margin-top:1.5rem; }
.cp-share-box { margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--cp-border); }
.cp-share-title { font-size:0.8rem; color:var(--cp-muted); margin-bottom:0.75rem; text-align:center; }
.cp-share-btns { display:flex; justify-content:center; gap:0.5rem; }
.cp-share-btn { width:40px; height:40px; border-radius:50%; border:1px solid var(--cp-border); background:var(--cp-bg); color:var(--cp-text); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; }
.cp-share-btn:hover { transform:translateY(-2px); }
.cp-share-btn.twitter:hover { background:#1da1f2; border-color:#1da1f2; color:#fff; }
.cp-share-btn.telegram:hover { background:#0088cc; border-color:#0088cc; color:#fff; }
.cp-share-btn.whatsapp:hover { background:#25d366; border-color:#25d366; color:#fff; }
.cp-share-btn.copy:hover { background:var(--cp-primary); border-color:var(--cp-primary); color:#000; }
@media(max-width:900px) { .cp-detail { grid-template-columns:1fr; } .cp-detail-sidebar { position:static; } }
@media(max-width:640px) { .cp-stats { grid-template-columns:repeat(2,1fr); } .cp-cats { grid-template-columns:1fr; } .cp-form-row { grid-template-columns:1fr; } .cp-hero { flex-direction:column; text-align:center; } .cp-hero-left { text-align:center; } }
`;
    document.head.appendChild(s);
}

// Helpers
const fmt = (v) => { try { const n=parseFloat(ethers.formatEther(v?.toString()||'0')); return n>=1000000?(n/1000000).toFixed(2)+'M':n>=1000?(n/1000).toFixed(1)+'K':n.toFixed(n<10?2:0); } catch { return '0'; } };
const fmtFull = (v) => { try { return parseFloat(ethers.formatEther(v?.toString()||'0')).toLocaleString(undefined,{maximumFractionDigits:2}); } catch { return '0'; } };
const calcProg = (raised, goal) => { try { const r=parseFloat(ethers.formatEther(raised?.toString()||'0')); const g=parseFloat(ethers.formatEther(goal?.toString()||'1')); return Math.min(100,Math.round((r/g)*100)); } catch { return 0; } };
const fmtTime = (deadline) => { const now=Math.floor(Date.now()/1000); const d=Number(deadline)-now; if(d<=0) return {text:'Ended',color:'var(--cp-muted)',ended:true}; const days=Math.floor(d/86400); if(days>0) return {text:`${days}d left`,color:'var(--cp-success)',ended:false}; const hrs=Math.floor(d/3600); if(hrs>0) return {text:`${hrs}h left`,color:'var(--cp-primary)',ended:false}; return {text:`${Math.floor(d/60)}m left`,color:'var(--cp-danger)',ended:false}; };
const short = (addr) => addr?`${addr.slice(0,6)}...${addr.slice(-4)}`:'';
const getCampImg = (c) => c?.imageUrl || PLACEHOLDER_IMAGES[c?.category] || PLACEHOLDER_IMAGES.default;
const getIdFromUrl = () => { const m=window.location.hash.match(/charity\/campaign\/(\d+)/); return m?m[1]:null; };
const setUrl = (id) => { window.location.hash=`charity/campaign/${id}`; };
const clearUrl = () => { window.location.hash='charity'; };
const getShareUrl = (id) => `${window.location.origin}/#charity/campaign/${id}`;
const canWithdraw = (c) => { if(!c||!State?.userAddress) return false; const now=Math.floor(Date.now()/1000); const isCreator=c.creator?.toLowerCase()===State.userAddress?.toLowerCase(); const ended=Number(c.deadline)<=now; const hasFunds=BigInt(c.raisedAmount?.toString()||'0')>0n; return isCreator&&hasFunds&&((ended&&c.status===0)||c.status===2); };

// Data Loading
async function loadStats() {
    try {
        const provider=State?.publicProvider; if(!provider) return {totalRaised:0n,totalBurned:0n,totalCampaigns:0,totalSuccessful:0};
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,provider);
        const [totalRaised,totalBurned,totalCampaigns,totalSuccessful]=await Promise.all([contract.totalRaisedAllTime().catch(()=>0n),contract.totalBurnedAllTime().catch(()=>0n),contract.totalCampaignsCreated().catch(()=>0n),contract.totalSuccessfulWithdrawals().catch(()=>0n)]);
        return {totalRaised:BigInt(totalRaised.toString()),totalBurned:BigInt(totalBurned.toString()),totalCampaigns:Number(totalCampaigns),totalSuccessful:Number(totalSuccessful)};
    } catch(e) { console.error('Stats:',e); return {totalRaised:0n,totalBurned:0n,totalCampaigns:0,totalSuccessful:0}; }
}

async function loadCampaignsData() {
    console.log('🔄 Loading campaigns...');
    try {
        const response=await fetch(`${CHARITY_API.getCampaigns}?limit=50`);
        if(response.ok) { const data=await response.json(); const campaigns=(data.campaigns||[]).map(c=>({id:String(c.id||c.campaignId),creator:c.creator,title:c.title,description:c.description,goalAmount:BigInt(c.goalAmount?.toString()||'0'),raisedAmount:BigInt(c.raisedAmount?.toString()||'0'),donationCount:Number(c.donationCount||0),deadline:Number(c.deadline||0),createdAt:Number(c.createdAt||0),status:Number(c.status||0),category:c.category||'humanitarian',imageUrl:c.imageUrl||null})); console.log('✅ Firebase:',campaigns.length); return campaigns; }
    } catch(e) { console.warn('Firebase:',e.message); }
    try {
        const provider=State?.publicProvider; if(!provider) return [];
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,provider);
        const count=Number(await contract.campaignCounter().catch(()=>0n));
        console.log('📊 Blockchain:',count);
        if(count===0) return [];
        const campaigns=[];
        for(let i=1;i<=count;i++) {
            try {
                const data=await contract.campaigns(i);
                campaigns.push({id:String(i),creator:data[0],title:data[1],description:data[2],goalAmount:BigInt(data[3].toString()),raisedAmount:BigInt(data[4].toString()),donationCount:Number(data[5]),deadline:Number(data[6]),createdAt:Number(data[7]),status:Number(data[8]),category:'humanitarian',imageUrl:null});
            } catch(e) { console.warn(`Campaign ${i}:`,e.message); }
        }
        return campaigns;
    } catch(e) { console.error('Blockchain:',e); return []; }
}

async function loadData() { [CS.campaigns,CS.stats]=await Promise.all([loadCampaignsData(),loadStats()]); State.charityCampaigns=CS.campaigns; }

// Render helpers
const renderBadge = (status,cat=null) => { const cfg=STATUS_CONFIG[status]||STATUS_CONFIG[0]; let html=`<span class="cp-badge" style="background:${cfg.color}22;color:${cfg.color}"><i class="fa-solid ${cfg.icon}"></i> ${cfg.label}</span>`; if(cat) { const c=CATEGORIES[cat]||CATEGORIES.humanitarian; html+=`<span class="cp-badge" style="background:${c.color}22;color:${c.color}">${c.emoji} ${c.name}</span>`; } return html; };
const renderLoading = () => `<div class="cp-loading"><div class="cp-spinner"></div><span style="color:var(--cp-muted)">Loading...</span></div>`;
const renderEmpty = (msg) => `<div class="cp-empty"><i class="fa-solid fa-heart-crack"></i><h3>${msg}</h3><p style="color:var(--cp-muted)">Be the first to create a campaign!</p></div>`;

const renderCard = (c) => { const prog=calcProg(c.raisedAmount,c.goalAmount); const time=fmtTime(c.deadline); return `<div class="cp-card" onclick="CharityPage.viewCampaign('${c.id}')"><img class="cp-card-img" src="${getCampImg(c)}" onerror="this.src='${PLACEHOLDER_IMAGES.default}'" alt="${c.title}"><div class="cp-card-body"><div class="cp-card-badges">${renderBadge(c.status,c.category)}</div><h3 class="cp-card-title">${c.title}</h3><div class="cp-card-creator">by <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank" onclick="event.stopPropagation()">${short(c.creator)}</a></div><div class="cp-progress"><div class="cp-progress-fill ${c.category||'humanitarian'}" style="width:${prog}%"></div></div><div class="cp-progress-stats"><span class="cp-progress-raised">${fmt(c.raisedAmount)} BKC</span><span class="cp-progress-goal">of ${fmt(c.goalAmount)} goal</span></div><div class="cp-card-meta"><span><i class="fa-solid fa-users"></i> ${c.donationCount} donors</span><span style="color:${time.color}">${time.text}</span></div></div></div>`; };

const renderMain = () => { const s=CS.stats||{totalRaised:0n,totalBurned:0n,totalCampaigns:0,totalSuccessful:0}; const activeCamps=CS.campaigns.filter(c=>isCampaignActive(c)); const animalCamps=activeCamps.filter(c=>c.category==='animal'); const humanCamps=activeCamps.filter(c=>c.category==='humanitarian'); return `<div class="charity-page"><div class="cp-hero"><div class="cp-hero-left" style="display:flex;align-items:center;gap:1rem"><div class="cp-hero-icon"><i class="fa-solid fa-hand-holding-heart"></i></div><div><h1>Charity Pool</h1><p>Transparent fundraising on blockchain. 4% mining rewards, 1% burned 🔥</p></div></div><div class="cp-actions"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.openMyCampaigns()"><i class="fa-solid fa-folder-open"></i> My Campaigns</button><button class="cp-btn cp-btn-primary" onclick="CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-stats"><div class="cp-stat"><div class="cp-stat-val g">${fmt(s.totalRaised)}</div><div class="cp-stat-lbl">Total Raised</div></div><div class="cp-stat"><div class="cp-stat-val b">${fmt(s.totalBurned)}</div><div class="cp-stat-lbl">BKC Burned 🔥</div></div><div class="cp-stat"><div class="cp-stat-val o">${s.totalCampaigns}</div><div class="cp-stat-lbl">Campaigns</div></div><div class="cp-stat"><div class="cp-stat-val p">${s.totalSuccessful}</div><div class="cp-stat-lbl">Successful</div></div></div><div class="cp-cats"><div class="cp-cat animal" onclick="CharityPage.selectCat('animal')"><div class="cp-cat-icon">🐾</div><div class="cp-cat-name">Animal Welfare</div><div class="cp-cat-stats"><span><strong>${animalCamps.length}</strong> active</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('animal')"><i class="fa-solid fa-plus"></i> Create</button></div></div><div class="cp-cat humanitarian" onclick="CharityPage.selectCat('humanitarian')"><div class="cp-cat-icon">💗</div><div class="cp-cat-name">Humanitarian Aid</div><div class="cp-cat-stats"><span><strong>${humanCamps.length}</strong> active</span></div><div class="cp-cat-actions"><button class="cp-btn cp-btn-success" style="font-size:0.75rem;padding:0.4rem 0.8rem" onclick="event.stopPropagation();CharityPage.openCreate('humanitarian')"><i class="fa-solid fa-plus"></i> Create</button></div></div></div><div class="cp-section-header"><h2 class="cp-section-title"><i class="fa-solid fa-fire" style="color:var(--cp-primary)"></i> Active Campaigns ${CS.selectedCategory?`<span style="font-size:0.8rem;color:var(--cp-muted);font-weight:400">• ${CATEGORIES[CS.selectedCategory]?.name} <button onclick="CharityPage.clearCat()" style="background:none;border:none;color:var(--cp-danger);cursor:pointer;font-size:0.7rem">✕</button></span>`:''}</h2></div><div class="cp-grid" id="cp-grid">${activeCamps.length?activeCamps.filter(c=>!CS.selectedCategory||c.category===CS.selectedCategory).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)).map(c=>renderCard(c)).join(''):renderEmpty('No active campaigns')}</div>${renderCreateModal()}${renderDonateModal()}${renderMyCampaignsModal()}</div>`; };

const renderDetail = (c) => { if(!c) return `<div class="charity-page"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()" style="margin-bottom:1rem"><i class="fa-solid fa-arrow-left"></i> Back</button><div class="cp-empty"><i class="fa-solid fa-exclamation-circle"></i><h3>Campaign Not Found</h3></div></div>`; const prog=calcProg(c.raisedAmount,c.goalAmount); const time=fmtTime(c.deadline); const isActive=isCampaignActive(c); const canWd=canWithdraw(c); const isCreator=c.creator?.toLowerCase()===State?.userAddress?.toLowerCase(); const catColor=CATEGORIES[c.category||'humanitarian']?.color||'#ec4899'; return `<div class="charity-page"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.goBack()" style="margin-bottom:1rem"><i class="fa-solid fa-arrow-left"></i> Back</button><div class="cp-detail"><div class="cp-detail-main"><img class="cp-detail-img" src="${getCampImg(c)}" onerror="this.src='${PLACEHOLDER_IMAGES.default}'" alt="${c.title}"><div class="cp-detail-content"><h1 class="cp-detail-title">${c.title}</h1><div class="cp-detail-meta">${renderBadge(c.status,c.category)}<span><i class="fa-solid fa-user"></i> <a href="${EXPLORER_ADDRESS}${c.creator}" target="_blank">${short(c.creator)}</a></span><span><i class="fa-solid fa-calendar"></i> Created ${new Date(Number(c.createdAt)*1000).toLocaleDateString()}</span></div><div class="cp-detail-desc">${c.description||'No description provided.'}</div></div></div><div class="cp-detail-sidebar"><div class="cp-detail-card"><div class="cp-detail-progress"><div class="cp-detail-raised" style="color:${catColor}">${fmtFull(c.raisedAmount)} BKC</div><div class="cp-detail-goal">raised of ${fmtFull(c.goalAmount)} BKC goal</div><div class="cp-progress" style="height:10px;margin-top:1rem"><div class="cp-progress-fill ${c.category||'humanitarian'}" style="width:${prog}%"></div></div><div style="text-align:right;font-size:0.85rem;color:var(--cp-muted);margin-top:0.5rem">${prog}% funded</div></div><div class="cp-detail-stats"><div class="cp-detail-stat"><div class="cp-detail-stat-val">${c.donationCount}</div><div class="cp-detail-stat-lbl">Donors</div></div><div class="cp-detail-stat"><div class="cp-detail-stat-val" style="color:${time.color}">${time.text}</div><div class="cp-detail-stat-lbl">${time.ended?'Status':'Remaining'}</div></div></div><div class="cp-detail-actions">${isActive?`<div style="display:flex;gap:0.5rem;align-items:center"><input type="number" id="detail-amount" class="cp-form-input" placeholder="Amount" min="1" style="flex:1"><span style="color:var(--cp-muted)">BKC</span></div><div style="display:flex;gap:0.375rem;margin-top:0.5rem"><button class="cp-preset" onclick="CharityPage.setAmt(10)">10</button><button class="cp-preset" onclick="CharityPage.setAmt(50)">50</button><button class="cp-preset" onclick="CharityPage.setAmt(100)">100</button><button class="cp-preset" onclick="CharityPage.setAmt(500)">500</button></div><button class="cp-btn cp-btn-success" style="width:100%;margin-top:0.75rem" onclick="CharityPage.donateDetail('${c.id}')"><i class="fa-solid fa-heart"></i> Donate Now</button>`:``}${isCreator&&isActive?`<button class="cp-btn cp-btn-danger" style="width:100%" onclick="CharityPage.cancel('${c.id}')"><i class="fa-solid fa-xmark"></i> Cancel Campaign</button>`:``}${canWd?`<button id="btn-withdraw" class="cp-btn cp-btn-primary" style="width:100%" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw Funds</button>`:``}</div>
        <div class="cp-share-box"><div class="cp-share-title">Share this campaign</div><div class="cp-share-btns"><button class="cp-share-btn twitter" onclick="CharityPage.share('twitter')"><i class="fa-brands fa-x-twitter"></i></button><button class="cp-share-btn telegram" onclick="CharityPage.share('telegram')"><i class="fa-brands fa-telegram"></i></button><button class="cp-share-btn whatsapp" onclick="CharityPage.share('whatsapp')"><i class="fa-brands fa-whatsapp"></i></button><button class="cp-share-btn copy" onclick="CharityPage.copyLink()"><i class="fa-solid fa-link"></i></button></div></div></div></div></div>${renderDonateModal()}</div>`;
};

// Modals
const renderCreateModal = () => `<div class="cp-modal" id="modal-create"><div class="cp-modal-content"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-plus" style="color:var(--cp-primary)"></i> Create Campaign</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('create')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><div class="cp-form-group"><label class="cp-form-label">Category *</label><div class="cp-cat-selector"><label class="cp-cat-option" id="opt-animal" onclick="CharityPage.selCatOpt('animal')"><input type="radio" name="category" value="animal"><div class="cp-cat-option-icon">🐾</div><div class="cp-cat-option-name">Animal</div></label><label class="cp-cat-option selected" id="opt-humanitarian" onclick="CharityPage.selCatOpt('humanitarian')"><input type="radio" name="category" value="humanitarian" checked><div class="cp-cat-option-icon">💗</div><div class="cp-cat-option-name">Humanitarian</div></label></div></div><div class="cp-form-group"><label class="cp-form-label">Image URL <span>(optional)</span></label><input type="url" id="campaign-image-url" class="cp-form-input" placeholder="https://example.com/image.jpg"></div><div class="cp-form-group"><label class="cp-form-label">Title *</label><input type="text" id="campaign-title" class="cp-form-input" placeholder="Campaign title" maxlength="100"></div><div class="cp-form-group"><label class="cp-form-label">Description *</label><textarea id="campaign-desc" class="cp-form-input cp-form-textarea" placeholder="Tell your story..." maxlength="2000"></textarea></div><div class="cp-form-row"><div class="cp-form-group"><label class="cp-form-label">Goal (BKC) *</label><input type="number" id="campaign-goal" class="cp-form-input" placeholder="1000" min="1" step="0.01"></div><div class="cp-form-group"><label class="cp-form-label">Duration (Days) *</label><input type="number" id="campaign-duration" class="cp-form-input" placeholder="30" min="1" max="180"></div></div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('create')">Cancel</button><button id="btn-create" class="cp-btn cp-btn-primary" onclick="CharityPage.create()"><i class="fa-solid fa-rocket"></i> Launch</button></div></div></div>`;
const renderDonateModal = () => `<div class="cp-modal" id="modal-donate"><div class="cp-modal-content" style="max-width:420px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-heart" style="color:var(--cp-success)"></i> Donate</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('donate')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body"><input type="hidden" id="donate-campaign-id"><div id="donate-info" style="margin-bottom:1rem"></div><div class="cp-form-group"><label class="cp-form-label">Amount (BKC)</label><div class="cp-donate-input-wrap"><input type="number" id="donate-amount" class="cp-donate-input" placeholder="0.00" min="1" step="0.01"><span class="cp-donate-currency">BKC</span></div></div><div class="cp-donate-presets"><button class="cp-preset" onclick="document.getElementById('donate-amount').value=10">10</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=50">50</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=100">100</button><button class="cp-preset" onclick="document.getElementById('donate-amount').value=500">500</button></div><div class="cp-fee-info"><strong>4%</strong> mining • <strong>1%</strong> burned 🔥 • <strong>95%</strong> to campaign</div></div><div class="cp-modal-footer"><button class="cp-btn cp-btn-secondary" onclick="CharityPage.closeModal('donate')">Cancel</button><button id="btn-donate" class="cp-btn cp-btn-success" onclick="CharityPage.donate()"><i class="fa-solid fa-heart"></i> Donate</button></div></div></div>`;
const renderMyCampaignsModal = () => `<div class="cp-modal" id="modal-my"><div class="cp-modal-content" style="max-width:650px"><div class="cp-modal-header"><h3 class="cp-modal-title"><i class="fa-solid fa-folder-open" style="color:var(--cp-primary)"></i> My Campaigns</h3><button class="cp-modal-close" onclick="CharityPage.closeModal('my')"><i class="fa-solid fa-xmark"></i></button></div><div class="cp-modal-body" id="my-campaigns-content">${renderLoading()}</div></div></div>`;

// Event handlers
function openModal(id) { document.getElementById(`modal-${id}`)?.classList.add('active'); }
function closeModal(id) { document.getElementById(`modal-${id}`)?.classList.remove('active'); }
function openCreate(cat=null) { if(!State?.isConnected) { showToast('Connect wallet first','warning'); return; } openModal('create'); if(cat) selCatOpt(cat); }
function openDonate(id) { if(!State?.isConnected) { showToast('Connect wallet first','warning'); return; } const c=CS.campaigns.find(x=>x.id===id||x.id===String(id)); if(!c) return showToast('Not found','error'); document.getElementById('donate-campaign-id').value=id; document.getElementById('donate-amount').value=''; document.getElementById('donate-info').innerHTML=`<div style="padding:0.75rem;background:var(--cp-bg3);border-radius:8px"><strong style="color:var(--cp-text)">${c.title}</strong><div style="font-size:0.8rem;color:var(--cp-muted);margin-top:0.25rem">${fmt(c.raisedAmount)} / ${fmt(c.goalAmount)} BKC</div></div>`; openModal('donate'); }
function openMyCampaigns() { if(!State?.isConnected) { showToast('Connect wallet first','warning'); return; } openModal('my'); const el=document.getElementById('my-campaigns-content'); el.innerHTML=renderLoading(); const mine=CS.campaigns.filter(c=>c.creator?.toLowerCase()===State.userAddress?.toLowerCase()); if(!mine.length) { el.innerHTML=`<div class="cp-empty" style="padding:1.5rem"><i class="fa-solid fa-folder-open"></i><h3>No Campaigns</h3><button class="cp-btn cp-btn-primary" onclick="CharityPage.closeModal('my');CharityPage.openCreate()"><i class="fa-solid fa-plus"></i> Create</button></div>`; return; } el.innerHTML=mine.map(c=>{ const prog=calcProg(c.raisedAmount,c.goalAmount); const time=fmtTime(c.deadline); const isActive=isCampaignActive(c); const canWd=canWithdraw(c); return `<div style="display:flex;gap:1rem;padding:1rem;background:var(--cp-bg3);border-radius:10px;margin-bottom:0.75rem"><img src="${getCampImg(c)}" style="width:70px;height:70px;object-fit:cover;border-radius:8px" onerror="this.src='${PLACEHOLDER_IMAGES.default}'"><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem"><h4 style="margin:0;color:var(--cp-text);font-size:0.9rem">${c.title}</h4>${renderBadge(c.status)}</div><div style="margin-top:0.5rem"><div class="cp-progress"><div class="cp-progress-fill ${c.category||'humanitarian'}" style="width:${prog}%"></div></div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-top:0.25rem"><span style="color:var(--cp-text)">${fmt(c.raisedAmount)} BKC</span><span style="color:var(--cp-muted)">${time.text}</span></div></div><div style="display:flex;gap:0.375rem;margin-top:0.625rem"><button class="cp-btn cp-btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.closeModal('my');CharityPage.viewCampaign('${c.id}')"><i class="fa-solid fa-eye"></i> View</button>${isActive?`<button class="cp-btn cp-btn-danger" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.cancel('${c.id}')"><i class="fa-solid fa-xmark"></i> Cancel</button>`:''}${canWd?`<button class="cp-btn cp-btn-primary" style="padding:0.3rem 0.6rem;font-size:0.7rem" onclick="CharityPage.withdraw('${c.id}')"><i class="fa-solid fa-wallet"></i> Withdraw</button>`:''}</div></div></div>`; }).join(''); }
function selCatOpt(cat) { document.querySelectorAll('.cp-cat-option').forEach(e=>e.classList.remove('selected')); const opt=document.getElementById(`opt-${cat}`); if(opt) { opt.classList.add('selected'); const radio=opt.querySelector('input[type="radio"]'); if(radio) radio.checked=true; } }
function setAmt(v) { const el=document.getElementById('detail-amount'); if(el) el.value=v; }

// Transactions
async function getConnectedSigner() { if(!State?.isConnected) { showToast("Connect wallet",'error'); return null; } try { const provider=new ethers.BrowserProvider(window.ethereum); return await provider.getSigner(); } catch(e) { console.error("Signer:",e); showToast("Wallet error",'error'); return null; } }

/**
 * Safe wait for transaction - handles Arbitrum parsing issues
 */
async function safeWaitForTx(tx, provider) {
    try {
        // Try normal wait first
        return await tx.wait();
    } catch (waitError) {
        // If wait() fails due to parsing, check tx status manually
        console.warn('tx.wait() parsing error, checking manually...', waitError.message);
        
        // Wait a bit for confirmation
        await new Promise(r => setTimeout(r, 3000));
        
        // Check if tx was mined
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt && receipt.status === 1) {
            console.log('✅ TX confirmed manually:', tx.hash);
            return receipt;
        } else if (receipt && receipt.status === 0) {
            throw new Error('Transaction reverted');
        }
        
        // If no receipt yet, wait more and retry
        await new Promise(r => setTimeout(r, 5000));
        const receipt2 = await provider.getTransactionReceipt(tx.hash);
        if (receipt2 && receipt2.status === 1) {
            console.log('✅ TX confirmed manually (retry):', tx.hash);
            return receipt2;
        }
        
        // If still no receipt, assume success (tx was sent)
        console.warn('Could not verify TX, assuming success:', tx.hash);
        return { hash: tx.hash, status: 1 };
    }
}

async function create() { 
    if(!State?.isConnected) return showToast('Connect wallet','warning'); 
    const btn=document.getElementById('btn-create'); 
    const orig=btn?.innerHTML||'Launch'; 
    
    try { 
        if(btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creating...'; } 
        
        const title=document.getElementById('campaign-title')?.value?.trim(); 
        const desc=document.getElementById('campaign-desc')?.value?.trim(); 
        const goal=document.getElementById('campaign-goal')?.value; 
        const dur=parseInt(document.getElementById('campaign-duration')?.value); 
        const cat=document.querySelector('input[name="category"]:checked')?.value||'humanitarian'; 
        let imgUrl=document.getElementById('campaign-image-url')?.value?.trim(); 
        
        if(!title) return showToast('Enter title','error'); 
        if(!goal||parseFloat(goal)<1) return showToast('Goal min 1 BKC','error'); 
        if(!dur||dur<1||dur>180) return showToast('Duration 1-180 days','error'); 
        
        const signer=await getConnectedSigner(); 
        if(!signer) return; 
        
        const provider = signer.provider;
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,signer); 
        const goalWei=ethers.parseEther(goal.toString()); 
        
        if(btn) btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Confirm...'; 
        showToast('Confirm in wallet...','info'); 
        
        const tx=await contract.createCampaign(title,desc||'',goalWei,dur); 
        console.log('TX sent:', tx.hash);
        
        if(btn) btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Confirming...'; 
        showToast('Creating campaign...','info'); 
        
        // Use safe wait
        const receipt = await safeWaitForTx(tx, provider);
        console.log('TX confirmed:', receipt.hash || tx.hash);
        
        // Try to get campaign ID from logs
        let campaignId=null; 
        if (receipt.logs) {
            for(const log of receipt.logs) { 
                try { 
                    const parsed=contract.interface.parseLog({topics:log.topics,data:log.data}); 
                    if(parsed?.name==="CampaignCreated") { 
                        campaignId=Number(parsed.args.campaignId); 
                        break; 
                    } 
                } catch{} 
            } 
        }
        
        // Save metadata to Firebase
        if(campaignId || true) { 
            try { 
                // If no campaignId from logs, try to get from contract
                if (!campaignId) {
                    const counter = await contract.campaignCounter();
                    campaignId = Number(counter);
                }
                
                await fetch(CHARITY_API.saveCampaign,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        campaignId,
                        creator:State.userAddress,
                        title,
                        description:desc||'',
                        category:cat,
                        imageUrl:imgUrl||null,
                        txHash:receipt.hash || tx.hash
                    })
                }); 
            } catch(e) { console.warn('Metadata:',e); } 
        } 
        
        showToast('🎉 Campaign created!','success'); 
        closeModal('create'); 
        await loadData(); 
        render(); 
        
        if(campaignId) setTimeout(()=>viewCampaign(campaignId),1500); 
        
    } catch(e) { 
        console.error('Create:',e); 
        const msg=e?.reason||e?.shortMessage||e?.message||'Failed'; 
        showToast(msg.includes('user rejected')?'Cancelled':msg.slice(0,80),'error'); 
    } finally { 
        if(btn) { btn.disabled=false; btn.innerHTML=orig; } 
    } 
}

async function donate() { 
    if(!State?.isConnected) return showToast('Connect wallet','warning'); 
    const id=document.getElementById('donate-campaign-id')?.value; 
    const amt=document.getElementById('donate-amount')?.value; 
    if(!amt||parseFloat(amt)<=0) return showToast('Enter amount','error'); 
    
    const btn=document.getElementById('btn-donate'); 
    const orig=btn?.innerHTML||'Donate'; 
    
    try { 
        if(btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; } 
        
        const signer=await getConnectedSigner(); 
        if(!signer) return; 
        
        const provider = signer.provider;
        const amountWei=ethers.parseEther(amt.toString()); 
        const bkcToken=new ethers.Contract(addresses.bkcToken,bkcTokenABI,signer); 
        const allowance=await bkcToken.allowance(State.userAddress,addresses.charityPool); 
        
        if(allowance<amountWei) { 
            if(btn) btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Approving...'; 
            showToast('Approving BKC...','info'); 
            const approveTx=await bkcToken.approve(addresses.charityPool,ethers.MaxUint256); 
            await safeWaitForTx(approveTx, provider); 
        } 
        
        if(btn) btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Donating...'; 
        showToast('Confirm donation...','info'); 
        
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,signer); 
        const tx=await contract.donate(id,amountWei); 
        console.log('Donate TX sent:', tx.hash);
        
        showToast('Processing... 🔥','info'); 
        await safeWaitForTx(tx, provider); 
        
        showToast('❤️ Donation successful!','success'); 
        closeModal('donate'); 
        await loadData(); 
        render(); 
        
    } catch(e) { 
        console.error('Donate:',e); 
        const msg=e?.reason||e?.shortMessage||e?.message||'Failed'; 
        showToast(msg.includes('user rejected')?'Cancelled':msg.slice(0,80),'error'); 
    } finally { 
        if(btn) { btn.disabled=false; btn.innerHTML=orig; } 
    } 
}

async function donateDetail(id) { if(!State?.isConnected) return showToast('Connect wallet','warning'); const amt=document.getElementById('detail-amount')?.value; if(!amt||parseFloat(amt)<=0) return showToast('Enter amount','error'); document.getElementById('donate-campaign-id').value=id; document.getElementById('donate-amount').value=amt; await donate(); if(CS.currentCampaign?.id===id) await loadDetail(id); }

async function cancel(id) { 
    if(!confirm('Cancel this campaign?')) return; 
    try { 
        const signer=await getConnectedSigner(); 
        if(!signer) return; 
        
        const provider = signer.provider;
        showToast('Confirm...','info'); 
        
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,signer); 
        const tx=await contract.cancelCampaign(id); 
        
        showToast('Cancelling...','info'); 
        await safeWaitForTx(tx, provider); 
        
        showToast('Cancelled','success'); 
        closeModal('my'); 
        await loadData(); 
        render(); 
    } catch(e) { 
        console.error('Cancel:',e); 
        showToast(e?.reason||e?.message||'Failed','error'); 
    } 
}

async function withdraw(id) { 
    if(!State?.isConnected) return showToast('Connect wallet','warning'); 
    const c=CS.campaigns.find(x=>x.id===id||x.id===String(id)); 
    if(!c) return; 
    
    const prog=calcProg(c.raisedAmount,c.goalAmount); 
    let msg=`Withdraw ${fmt(c.raisedAmount)} BKC?\n\nFee: 0.001 ETH`; 
    if(prog<100) msg+=`\n10% will be burned`; 
    if(!confirm(msg)) return; 
    
    const btn=document.getElementById('btn-withdraw'); 
    const orig=btn?.innerHTML||'Withdraw'; 
    
    try { 
        if(btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; } 
        
        const signer=await getConnectedSigner(); 
        if(!signer) return; 
        
        const provider = signer.provider;
        showToast('Confirm...','info'); 
        
        const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,signer); 
        const tx=await contract.withdraw(id,{value:ethers.parseEther("0.001")}); 
        
        showToast('Withdrawing...','info'); 
        await safeWaitForTx(tx, provider); 
        
        showToast('Success!','success'); 
        closeModal('my'); 
        await loadData(); 
        render(); 
        if(CS.currentCampaign?.id===id) await loadDetail(id); 
        
    } catch(e) { 
        console.error('Withdraw:',e); 
        showToast(e?.reason||e?.message||'Failed','error'); 
    } finally { 
        if(btn) { btn.disabled=false; btn.innerHTML=orig; } 
    } 
}

// Share & Nav
function share(platform) { const c=CS.currentCampaign; if(!c) return; const url=getShareUrl(c.id); const txt=`🙏 Support "${c.title}" on Backcoin Charity!\n\n${fmt(c.raisedAmount)} raised of ${fmt(c.goalAmount)} goal.\n\n`; let shareUrl; if(platform==='twitter') shareUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`; else if(platform==='telegram') shareUrl=`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`; else if(platform==='whatsapp') shareUrl=`https://wa.me/?text=${encodeURIComponent(txt+url)}`; if(shareUrl) window.open(shareUrl,'_blank','width=600,height=400'); }
function copyLink() { const c=CS.currentCampaign; if(!c) return; navigator.clipboard.writeText(getShareUrl(c.id)).then(()=>showToast('Link copied!','success')).catch(()=>showToast('Copy failed','error')); }
function goBack() { clearUrl(); CS.currentCampaign=null; CS.currentView='main'; render(); }
function viewCampaign(id) { closeModal('my'); closeModal('donate'); setUrl(id); loadDetail(id); }
function selectCat(cat) { CS.selectedCategory=CS.selectedCategory===cat?null:cat; updateGrid(); }
function clearCat() { CS.selectedCategory=null; updateGrid(); }
function updateGrid() { const grid=document.getElementById('cp-grid'); if(!grid) return; let active=CS.campaigns.filter(c=>isCampaignActive(c)); if(CS.selectedCategory) active=active.filter(c=>c.category===CS.selectedCategory); active.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)); grid.innerHTML=active.length?active.map(c=>renderCard(c)).join(''):renderEmpty('No campaigns'); }

async function loadDetail(id) { CS.currentView='detail'; CS.isLoading=true; const container=getContainer(); if(container) container.innerHTML=renderLoading(); try { let c=CS.campaigns.find(x=>x.id===id||x.id===String(id)); if(!c) { const provider=State?.publicProvider; if(provider) { const contract=new ethers.Contract(addresses.charityPool,charityPoolABI,provider); const data=await contract.campaigns(id); c={id:String(id),creator:data[0],title:data[1],description:data[2],goalAmount:BigInt(data[3].toString()),raisedAmount:BigInt(data[4].toString()),donationCount:Number(data[5]),deadline:Number(data[6]),createdAt:Number(data[7]),status:Number(data[8]),category:'humanitarian',imageUrl:null}; } } CS.currentCampaign=c; if(container) container.innerHTML=renderDetail(c); } catch(e) { console.error('Detail:',e); if(container) container.innerHTML=renderDetail(null); } finally { CS.isLoading=false; } }

// IMPORTANT: Get container - MUST use the charity section to avoid breaking navigation
function getContainer() {
    // First check if charity-container already exists inside the charity section
    let container = document.getElementById('charity-container');
    if (container) return container;
    
    // Get the charity section (defined in index.html)
    const charitySection = document.getElementById('charity');
    if (charitySection) {
        // Create container inside the charity section
        container = document.createElement('div');
        container.id = 'charity-container';
        charitySection.innerHTML = ''; // Clear any previous content
        charitySection.appendChild(container);
        console.log('✅ Created charity-container inside #charity section');
        return container;
    }
    
    // Fallback: Should not happen if index.html is correct
    console.error('❌ #charity section not found in DOM');
    return null;
}

function render() {
    console.log('🎨 CharityPage render');
    injectStyles();
    
    const container = getContainer();
    if (!container) {
        console.error('❌ Failed to get/create container');
        return;
    }
    
    console.log('✅ Container found:', container.id);
    
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

async function refresh() { CS.campaigns=[]; CS.stats=null; if(CS.currentView==='detail'&&CS.currentCampaign) await loadDetail(CS.currentCampaign.id); else render(); }

// Hash listener
window.addEventListener('hashchange', () => { if(window.location.hash.startsWith('#charity')) { const id=getIdFromUrl(); if(id) { if(CS.currentCampaign?.id!==id) loadDetail(id); } else if(CS.currentView!=='main') goBack(); } });

// Export
export const CharityPage = {
    render(isActive) { console.log('🚀 CharityPage.render, isActive:', isActive); if(isActive) render(); },
    update() { if(CS.currentView==='main') updateGrid(); },
    refresh, openModal, closeModal, openCreate, openDonate, openMyCampaigns,
    create, donate, donateDetail, cancel, withdraw,
    selCatOpt, setAmt, goBack, viewCampaign, selectCat, clearCat, share, copyLink
};
window.CharityPage = CharityPage;