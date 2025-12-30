// js/pages/CharityPage.js
// ✅ PRODUCTION V1.0 - Charity Pool (Crowdfunding with Burn Mechanics)

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';
import { safeContractCall, API_ENDPOINTS } from '../modules/data.js';
import { showToast } from '../ui-feedback.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS
// ============================================================================
const CHARITY_IMAGE = "./assets/charity.png"; // Criar este asset
const IPFS_GATEWAY = "https://dweb.link/ipfs/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200/27272a/71717a?text=Campaign";

// Categories
const CATEGORIES = {
    animal: {
        id: 'animal',
        name: 'Animal Help',
        icon: 'fa-paw',
        color: 'emerald',
        colorHex: '#10b981',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 to-teal-500/10',
        description: 'Support animal shelters, rescue operations, veterinary care, and wildlife conservation.'
    },
    humanitarian: {
        id: 'humanitarian',
        name: 'Humanitarian Help',
        icon: 'fa-hand-holding-medical',
        color: 'pink',
        colorHex: '#f472b6',
        gradient: 'from-pink-500 to-rose-500',
        bgGradient: 'from-pink-500/20 to-rose-500/10',
        description: 'Support disaster relief, medical emergencies, education, and community development.'
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
    [STATUS.ACTIVE]: { label: 'Active', color: 'green', icon: 'fa-circle-play' },
    [STATUS.COMPLETED]: { label: 'Completed', color: 'blue', icon: 'fa-circle-check' },
    [STATUS.CANCELLED]: { label: 'Cancelled', color: 'red', icon: 'fa-circle-xmark' },
    [STATUS.WITHDRAWN]: { label: 'Withdrawn', color: 'zinc', icon: 'fa-circle-dollar' }
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
// STYLES
// ============================================================================
const injectStyles = () => {
    if (document.getElementById('charity-styles-v1')) return;
    
    const style = document.createElement('style');
    style.id = 'charity-styles-v1';
    style.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           CHARITY PAGE STYLES
           ═══════════════════════════════════════════════════════════════════ */
        
        /* Hero Section */
        .charity-hero {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(244, 114, 182, 0.08) 100%);
            border-radius: 1.25rem;
            padding: 2.5rem 2rem;
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
        
        /* Category Cards */
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
        
        /* Campaign Cards */
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
            position: relative;
        }
        
        .campaign-progress-fill.animal {
            background: linear-gradient(90deg, #10b981, #14b8a6);
        }
        
        .campaign-progress-fill.humanitarian {
            background: linear-gradient(90deg, #f472b6, #fb7185);
        }
        
        /* Stats Cards */
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
        
        /* Burn Badge */
        .burn-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 9999px;
            font-size: 0.7rem;
            color: #ef4444;
            font-weight: 600;
        }
        
        /* Modal Styles */
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
        }
        
        .charity-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .charity-modal-content {
            background: #18181b;
            border: 1px solid #3f3f46;
            border-radius: 1.25rem;
            width: 95%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.95) translateY(10px);
            transition: transform 0.3s ease;
        }
        
        .charity-modal.active .charity-modal-content {
            transform: scale(1) translateY(0);
        }
        
        /* Form Styles */
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
        
        /* Button Styles */
        .charity-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.875rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 700;
            font-size: 0.9375rem;
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
        }
        
        .charity-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
        }
        
        .charity-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
        }
        
        .charity-btn-primary:disabled {
            background: #3f3f46;
            color: #71717a;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
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
        
        .charity-btn-donate:hover {
            box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
        }
        
        /* Animations */
        @keyframes charity-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        
        @keyframes charity-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .charity-shimmer::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: charity-shimmer 2s infinite;
        }
        
        /* Scrollbar */
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
        
        /* Responsive */
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
    `;
    document.head.appendChild(style);
};

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
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${minutes}m left`;
}

function formatBKC(value) {
    if (!value) return '0';
    try {
        const formatted = ethers.formatEther(value);
        const num = parseFloat(formatted);
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    } catch {
        return '0';
    }
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

// ============================================================================
// MAIN RENDER
// ============================================================================
function render() {
    const container = document.getElementById('charity');
    if (!container) return;
    
    injectStyles();
    
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
                <button id="btn-my-campaigns" class="charity-btn charity-btn-secondary">
                    <i class="fa-solid fa-folder-open"></i>
                    <span>My Campaigns</span>
                </button>
            </div>
            
            <!-- MAIN CONTENT -->
            <div id="charity-content">
                ${renderMainView()}
            </div>
            
        </div>
        
        <!-- MODALS -->
        ${renderModals()}
    `;
    
    attachEventListeners();
    loadCharityData();
}

// ============================================================================
// VIEW RENDERERS
// ============================================================================
function renderMainView() {
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
        
        <!-- Recent Campaigns -->
        <div>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-fire text-orange-400"></i>
                    Active Campaigns
                </h2>
                <button id="btn-refresh-campaigns" class="text-xs text-amber-400 hover:text-white transition-colors flex items-center gap-1">
                    <i class="fa-solid fa-rotate"></i> Refresh
                </button>
            </div>
            <div id="campaigns-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${renderLoadingCards(3)}
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

function renderCategoryCard(categoryId) {
    const cat = CATEGORIES[categoryId];
    return `
        <div class="charity-category-card ${categoryId}" data-category="${categoryId}">
            <div class="charity-icon-box ${categoryId}">
                <i class="fa-solid ${cat.icon}"></i>
            </div>
            <h3 class="text-xl font-bold text-white text-center mb-2">${cat.name}</h3>
            <p class="text-zinc-400 text-center text-sm mb-4">${cat.description}</p>
            <div class="flex justify-center gap-6 text-sm mb-4">
                <div class="text-center">
                    <p class="text-${cat.color}-400 font-bold" id="cat-${categoryId}-campaigns">0</p>
                    <p class="text-zinc-500 text-xs">Campaigns</p>
                </div>
                <div class="text-center">
                    <p class="text-${cat.color}-400 font-bold" id="cat-${categoryId}-raised">0 BKC</p>
                    <p class="text-zinc-500 text-xs">Raised</p>
                </div>
            </div>
            <div class="flex justify-center">
                <span class="text-${cat.color}-400 text-sm font-medium flex items-center gap-2">
                    View Campaigns <i class="fa-solid fa-arrow-right"></i>
                </span>
            </div>
        </div>
    `;
}

function renderCampaignCard(campaign, category = 'animal') {
    const cat = CATEGORIES[category];
    const progress = calculateProgress(campaign.raisedAmount, campaign.goalAmount);
    const timeLeft = formatTimeRemaining(Number(campaign.deadline));
    const isActive = campaign.status === STATUS.ACTIVE && Date.now() / 1000 < Number(campaign.deadline);
    
    return `
        <div class="campaign-card" data-campaign-id="${campaign.id}">
            <div class="relative">
                <img src="${campaign.imageUrl || PLACEHOLDER_IMAGE}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
                ${isActive ? `
                    <div class="absolute top-3 right-3 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        ${timeLeft}
                    </div>
                ` : `
                    <div class="absolute top-3 right-3 px-2 py-1 rounded-full bg-zinc-700/90 text-zinc-300 text-xs font-bold">
                        ${STATUS_LABELS[campaign.status]?.label || 'Ended'}
                    </div>
                `}
            </div>
            <div class="p-4">
                <h4 class="font-bold text-white text-sm mb-2 line-clamp-2">${campaign.title}</h4>
                <p class="text-zinc-500 text-xs mb-3 line-clamp-2">${campaign.description || 'No description'}</p>
                
                <div class="campaign-progress mb-2">
                    <div class="campaign-progress-fill ${category}" style="width: ${progress}%"></div>
                </div>
                
                <div class="flex justify-between items-center text-xs mb-3">
                    <span class="text-${cat.color}-400 font-bold">${formatBKC(campaign.raisedAmount)} BKC</span>
                    <span class="text-zinc-500">of ${formatBKC(campaign.goalAmount)} BKC</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-zinc-500 text-xs">${campaign.donationCount || 0} donors</span>
                    ${isActive ? `
                        <button class="btn-donate-quick px-4 py-2 rounded-lg bg-${cat.color}-500 hover:bg-${cat.color}-600 text-white text-xs font-bold transition-colors" data-id="${campaign.id}">
                            Donate
                        </button>
                    ` : `
                        <span class="text-xs text-zinc-600">Campaign ended</span>
                    `}
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
                        <div class="h-8 bg-zinc-800 rounded w-1/4"></div>
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
// MODALS
// ============================================================================
function renderModals() {
    return `
        <!-- Create Campaign Modal -->
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
                <div class="p-5">
                    <form id="form-create-campaign" class="space-y-4">
                        <input type="hidden" id="create-category" value="">
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Campaign Title *</label>
                            <input type="text" id="create-title" class="charity-input" placeholder="e.g., Help rescue abandoned animals" required maxlength="100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                            <textarea id="create-description" class="charity-input charity-textarea" placeholder="Describe your campaign and how the funds will be used..." maxlength="500"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Image URL (optional)</label>
                            <input type="url" id="create-image" class="charity-input" placeholder="https://example.com/image.jpg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Contact Website (optional)</label>
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
        
        <!-- Donate Modal -->
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
        
        <!-- Category Modal -->
        <div id="modal-category" class="charity-modal">
            <div class="charity-modal-content max-w-3xl">
                <div class="p-5 border-b border-zinc-800">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div id="category-modal-icon" class="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <i class="fa-solid fa-paw text-xl text-emerald-400"></i>
                            </div>
                            <div>
                                <h2 id="category-modal-title" class="text-lg font-bold text-white">Animal Help</h2>
                                <p id="category-modal-subtitle" class="text-zinc-500 text-xs">Support animal welfare causes</p>
                            </div>
                        </div>
                        <button class="btn-close-modal text-zinc-500 hover:text-white text-xl" data-modal="category">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-5">
                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-3 mb-5">
                        <div class="charity-stat">
                            <p class="text-xl font-bold text-emerald-400" id="category-stat-raised">0 BKC</p>
                            <p class="text-xs text-zinc-500">Raised</p>
                        </div>
                        <div class="charity-stat">
                            <p class="text-xl font-bold text-white" id="category-stat-count">0</p>
                            <p class="text-xs text-zinc-500">Campaigns</p>
                        </div>
                        <div class="charity-stat">
                            <p class="text-xl font-bold text-red-400" id="category-stat-burned">0 BKC</p>
                            <p class="text-xs text-zinc-500">Burned 🔥</p>
                        </div>
                    </div>
                    
                    <!-- Create Button -->
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-sm font-bold text-white">Active Campaigns</h3>
                        <button id="btn-create-in-category" class="charity-btn charity-btn-primary text-sm py-2">
                            <i class="fa-solid fa-plus"></i>
                            <span>Create Campaign</span>
                        </button>
                    </div>
                    
                    <!-- Campaigns Grid -->
                    <div id="category-campaigns-grid" class="grid sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto charity-scroll">
                        ${renderLoadingCards(2)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function attachEventListeners() {
    const container = document.getElementById('charity');
    if (!container) return;
    
    // Category cards
    container.querySelectorAll('.charity-category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            openCategoryModal(category);
        });
    });
    
    // My Campaigns button
    document.getElementById('btn-my-campaigns')?.addEventListener('click', openMyCampaignsModal);
    document.getElementById('btn-my-campaigns-mobile')?.addEventListener('click', openMyCampaignsModal);
    
    // Refresh
    document.getElementById('btn-refresh-campaigns')?.addEventListener('click', loadCharityData);
    
    // Close modals
    container.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            closeModal(modalId);
        });
    });
    
    // Modal backdrop click
    container.querySelectorAll('.charity-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Create campaign form
    document.getElementById('form-create-campaign')?.addEventListener('submit', handleCreateCampaign);
    
    // Donate form
    document.getElementById('form-donate')?.addEventListener('submit', handleDonate);
    
    // Donate amount change
    document.getElementById('donate-amount')?.addEventListener('input', updateDonationFees);
    
    // Quick amount buttons
    container.querySelectorAll('.btn-quick-amount').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            document.getElementById('donate-amount').value = amount;
            updateDonationFees();
        });
    });
    
    // Create in category
    document.getElementById('btn-create-in-category')?.addEventListener('click', () => {
        const category = Charity.selectedCategory;
        closeModal('category');
        setTimeout(() => openCreateModal(category), 200);
    });
    
    // Delegate click for donate buttons
    container.addEventListener('click', (e) => {
        const donateBtn = e.target.closest('.btn-donate-quick');
        if (donateBtn) {
            const campaignId = donateBtn.dataset.id;
            openDonateModal(campaignId);
        }
        
        const campaignCard = e.target.closest('.campaign-card');
        if (campaignCard && !e.target.closest('.btn-donate-quick')) {
            const campaignId = campaignCard.dataset.campaignId;
            // Could open detail modal here
        }
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.charity-modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
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

function openCategoryModal(category) {
    Charity.selectedCategory = category;
    const cat = CATEGORIES[category];
    
    // Update modal content
    document.getElementById('category-modal-icon').className = `w-11 h-11 rounded-full bg-${cat.color}-500/20 flex items-center justify-center`;
    document.getElementById('category-modal-icon').innerHTML = `<i class="fa-solid ${cat.icon} text-xl text-${cat.color}-400"></i>`;
    document.getElementById('category-modal-title').textContent = cat.name;
    document.getElementById('category-modal-subtitle').textContent = cat.description;
    
    openModal('category');
    loadCategoryCampaigns(category);
}

function openCreateModal(category) {
    Charity.selectedCategory = category;
    const cat = CATEGORIES[category];
    
    document.getElementById('create-category').value = category;
    document.getElementById('create-modal-icon').className = `w-11 h-11 rounded-full bg-${cat.color}-500/20 flex items-center justify-center`;
    document.getElementById('create-modal-icon').innerHTML = `<i class="fa-solid ${cat.icon} text-xl text-${cat.color}-400"></i>`;
    document.getElementById('create-modal-subtitle').textContent = `Create a ${cat.name.toLowerCase()} campaign`;
    
    // Reset form
    document.getElementById('form-create-campaign').reset();
    
    openModal('create');
}

function openDonateModal(campaignId) {
    const campaign = Charity.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
        showToast('Campaign not found', 'error');
        return;
    }
    
    document.getElementById('donate-campaign-id').value = campaignId;
    document.getElementById('donate-campaign-title').textContent = campaign.title;
    document.getElementById('donate-raised').textContent = `${formatBKC(campaign.raisedAmount)} BKC`;
    document.getElementById('donate-goal').textContent = `${formatBKC(campaign.goalAmount)} BKC`;
    
    const progress = calculateProgress(campaign.raisedAmount, campaign.goalAmount);
    document.getElementById('donate-progress').style.width = `${progress}%`;
    
    // Reset form
    document.getElementById('form-donate').reset();
    updateDonationFees();
    
    openModal('donate');
}

function openMyCampaignsModal() {
    // TODO: Implement my campaigns view
    showToast('Coming soon: My Campaigns view', 'info');
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

// ============================================================================
// FORM HANDLERS
// ============================================================================
async function handleCreateCampaign(e) {
    e.preventDefault();
    
    if (!State.isConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    const title = document.getElementById('create-title').value.trim();
    const description = document.getElementById('create-description').value.trim();
    const goal = document.getElementById('create-goal').value;
    const duration = document.getElementById('create-duration').value;
    const category = document.getElementById('create-category').value;
    const imageUrl = document.getElementById('create-image').value.trim();
    const website = document.getElementById('create-website').value.trim();
    
    if (!title || !goal || !duration) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const btn = document.getElementById('btn-submit-create');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Creating...';
    
    try {
        // TODO: Call smart contract to create campaign
        // For now, simulate success
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast('Campaign created successfully! 🎉', 'success');
        closeModal('create');
        loadCharityData();
        
    } catch (error) {
        console.error('Create campaign error:', error);
        showToast('Failed to create campaign: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rocket"></i> <span>Launch Campaign</span>';
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
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Processing...';
    
    try {
        // TODO: Call smart contract to donate
        // For now, simulate success
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast('Donation successful! Thank you! ❤️', 'success');
        closeModal('donate');
        loadCharityData();
        
    } catch (error) {
        console.error('Donate error:', error);
        showToast('Donation failed: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-heart"></i> <span>Donate Now</span>';
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadCharityData() {
    Charity.isLoading = true;
    
    try {
        // TODO: Load from smart contract
        // For now, use mock data
        
        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock campaigns
        Charity.campaigns = [
            {
                id: '1',
                creator: '0x1234...5678',
                title: 'Help Save Abandoned Dogs',
                description: 'We are building a shelter for abandoned dogs in our city. Every donation helps provide food, medicine, and care.',
                goalAmount: ethers.parseEther('5000'),
                raisedAmount: ethers.parseEther('2350'),
                donationCount: 47,
                deadline: Math.floor(Date.now() / 1000) + 86400 * 15,
                createdAt: Math.floor(Date.now() / 1000) - 86400 * 10,
                status: STATUS.ACTIVE,
                category: 'animal',
                imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'
            },
            {
                id: '2',
                creator: '0xabcd...efgh',
                title: 'Emergency Medical Fund',
                description: 'Supporting families affected by natural disasters with medical supplies and healthcare.',
                goalAmount: ethers.parseEther('10000'),
                raisedAmount: ethers.parseEther('7800'),
                donationCount: 123,
                deadline: Math.floor(Date.now() / 1000) + 86400 * 7,
                createdAt: Math.floor(Date.now() / 1000) - 86400 * 20,
                status: STATUS.ACTIVE,
                category: 'humanitarian',
                imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400'
            },
            {
                id: '3',
                creator: '0x9876...5432',
                title: 'Wildlife Conservation Project',
                description: 'Protecting endangered species in the Amazon rainforest through habitat preservation.',
                goalAmount: ethers.parseEther('8000'),
                raisedAmount: ethers.parseEther('1200'),
                donationCount: 28,
                deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
                createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
                status: STATUS.ACTIVE,
                category: 'animal',
                imageUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400'
            }
        ];
        
        // Mock global stats
        Charity.globalStats = {
            totalRaised: ethers.parseEther('125000'),
            totalCampaigns: 45,
            totalBurned: ethers.parseEther('1250'),
            totalWithdrawals: 32
        };
        
        updateStatsUI();
        updateCampaignsGrid();
        
    } catch (error) {
        console.error('Load charity data error:', error);
        showToast('Failed to load campaigns', 'error');
    } finally {
        Charity.isLoading = false;
    }
}

async function loadCategoryCampaigns(category) {
    const grid = document.getElementById('category-campaigns-grid');
    if (!grid) return;
    
    grid.innerHTML = renderLoadingCards(2);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const campaigns = Charity.campaigns.filter(c => c.category === category);
        
        if (campaigns.length === 0) {
            grid.innerHTML = renderEmptyState('No campaigns in this category yet', 'fa-seedling');
            return;
        }
        
        grid.innerHTML = campaigns.map(c => renderCampaignCard(c, category)).join('');
        
        // Update category stats
        const raised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0n), 0n);
        document.getElementById('category-stat-raised').textContent = `${formatBKC(raised)} BKC`;
        document.getElementById('category-stat-count').textContent = campaigns.length;
        
    } catch (error) {
        console.error('Load category campaigns error:', error);
        grid.innerHTML = renderEmptyState('Failed to load campaigns', 'fa-exclamation-triangle');
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateStatsUI() {
    const { totalRaised, totalCampaigns, totalBurned, totalWithdrawals } = Charity.globalStats;
    
    document.getElementById('stat-total-raised').textContent = formatBKC(totalRaised);
    document.getElementById('stat-total-campaigns').textContent = totalCampaigns;
    document.getElementById('stat-total-burned').textContent = formatBKC(totalBurned);
    document.getElementById('stat-total-success').textContent = totalWithdrawals;
    
    // Update category stats
    const animalCampaigns = Charity.campaigns.filter(c => c.category === 'animal');
    const humanCampaigns = Charity.campaigns.filter(c => c.category === 'humanitarian');
    
    document.getElementById('cat-animal-campaigns').textContent = animalCampaigns.length;
    document.getElementById('cat-humanitarian-campaigns').textContent = humanCampaigns.length;
    
    const animalRaised = animalCampaigns.reduce((sum, c) => {
        try { return sum + BigInt(c.raisedAmount || 0); } catch { return sum; }
    }, 0n);
    const humanRaised = humanCampaigns.reduce((sum, c) => {
        try { return sum + BigInt(c.raisedAmount || 0); } catch { return sum; }
    }, 0n);
    
    document.getElementById('cat-animal-raised').textContent = `${formatBKC(animalRaised)} BKC`;
    document.getElementById('cat-humanitarian-raised').textContent = `${formatBKC(humanRaised)} BKC`;
}

function updateCampaignsGrid() {
    const grid = document.getElementById('campaigns-grid');
    if (!grid) return;
    
    const activeCampaigns = Charity.campaigns.filter(c => 
        c.status === STATUS.ACTIVE && Date.now() / 1000 < Number(c.deadline)
    );
    
    if (activeCampaigns.length === 0) {
        grid.innerHTML = renderEmptyState('No active campaigns yet. Be the first to create one!', 'fa-heart');
        return;
    }
    
    grid.innerHTML = activeCampaigns.map(c => renderCampaignCard(c, c.category)).join('');
}

// ============================================================================
// EXPORT
// ============================================================================
export const CharityPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
    },
    
    update() {
        updateStatsUI();
        updateCampaignsGrid();
    },
    
    refresh() {
        loadCharityData();
    }
};

window.CharityPage = CharityPage;