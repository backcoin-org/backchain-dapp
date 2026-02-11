// js/pages/DashboardPage.js
// ✅ PRODUCTION V69.3 — Dashboard Redesign
// ═══════════════════════════════════════════════════════════════════════════════
//                          BACKCHAIN PROTOCOL
//                    Dashboard — Command Center
// ═══════════════════════════════════════════════════════════════════════════════
//
// V69.1 Changes:
// - Removed sidebar (Network Status, AirBNFT, Portfolio Stats)
// - Activity feed now full-width
// - Faucet always visible with prominent design (BKC + ETH)
// - Enhanced mobile experience (filter chips scroll, better breakpoints)
// - Visual polish (hero gradient border, claim shimmer, faucet glow)
//
// Website: https://backcoin.org
// ═══════════════════════════════════════════════════════════════════════════════

const ethers = window.ethers;

import { State } from '../state.js';
import { DOMElements } from '../dom-elements.js';
import {
    loadUserData,
    calculateUserTotalRewards,
    getHighestBoosterBoostFromAPI,
    safeContractCall,
    calculateClaimDetails,
    API_ENDPOINTS
} from '../modules/data.js';
import { StakingTx } from '../modules/transactions/index.js';
import {
    formatBigNumber, formatPStake, renderLoading,
    renderNoData, renderError
} from '../utils.js';
import { showToast, addNftToWallet } from '../ui-feedback.js';
import { addresses, boosterTiers, getTierByBoost, getBurnRateFromBoost, getKeepRateFromBoost } from '../config.js';

// ============================================================================
// LOCAL STATE
// ============================================================================
const DashboardState = {
    hasRenderedOnce: false,
    lastUpdate: 0,
    activities: [],
    networkActivities: [],
    filteredActivities: [],
    userProfile: null,
    pagination: { currentPage: 1, itemsPerPage: 8 },
    filters: { type: 'ALL', sort: 'NEWEST' },
    metricsCache: {},
    economicData: null,
    isLoadingNetworkActivity: false,
    networkActivitiesTimestamp: 0,
    faucet: {
        canClaim: true,
        cooldownEnd: null,
        isLoading: false,
        lastCheck: 0
    }
};

// ============================================================================
// CONFIG
// ============================================================================
const EXPLORER_BASE_URL = "https://sepolia.arbiscan.io/tx/";
const FAUCET_API_URL = "/api/faucet";
const NETWORK_ACTIVITY_API = "https://getrecentactivity-4wvdcuoouq-uc.a.run.app";
const SYSTEM_DATA_API = "https://getsystemdata-4wvdcuoouq-uc.a.run.app";
const FAUCET_BKC_AMOUNT = "1,000";
const FAUCET_ETH_AMOUNT = "0.01";

// ============================================================================
// ACTIVITY ICONS — All 76+ types preserved
// ============================================================================
const ACTIVITY_ICONS = {
    STAKING: { icon: 'fa-lock', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🔒 Staked', emoji: '🔒' },
    UNSTAKING: { icon: 'fa-unlock', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '🔓 Unstaked', emoji: '🔓' },
    FORCE_UNSTAKE: { icon: 'fa-bolt', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '⚡ Force Unstaked', emoji: '⚡' },
    CLAIM: { icon: 'fa-coins', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', label: '🪙 Rewards Claimed', emoji: '🪙' },
    NFT_BUY: { icon: 'fa-bag-shopping', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🛍️ Bought NFT', emoji: '🛍️' },
    NFT_SELL: { icon: 'fa-hand-holding-dollar', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '💰 Sold NFT', emoji: '💰' },
    NFT_MINT: { icon: 'fa-gem', color: '#fde047', bg: 'rgba(234,179,8,0.15)', label: '💎 Minted Booster', emoji: '💎' },
    NFT_TRANSFER: { icon: 'fa-arrow-right-arrow-left', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: '↔️ Transfer', emoji: '↔️' },
    RENTAL_LIST: { icon: 'fa-tag', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🏷️ Listed NFT', emoji: '🏷️' },
    RENTAL_RENT: { icon: 'fa-clock', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', label: '⏰ Rented NFT', emoji: '⏰' },
    RENTAL_WITHDRAW: { icon: 'fa-rotate-left', color: '#fb923c', bg: 'rgba(249,115,22,0.15)', label: '↩️ Withdrawn', emoji: '↩️' },
    RENTAL_PROMOTE: { icon: 'fa-bullhorn', color: '#fbbf24', bg: 'rgba(251,191,36,0.2)', label: '📢 Promoted NFT', emoji: '📢' },
    FORTUNE_COMMIT: { icon: 'fa-lock', color: '#a855f7', bg: 'rgba(168,85,247,0.2)', label: '🔐 Game Committed', emoji: '🔐' },
    FORTUNE_REVEAL: { icon: 'fa-dice', color: '#f97316', bg: 'rgba(249,115,22,0.2)', label: '🎲 Game Revealed', emoji: '🎲' },
    FORTUNE_BET: { icon: 'fa-paw', color: '#f97316', bg: 'rgba(249,115,22,0.2)', label: '🐯 Fortune Bet', emoji: '🐯' },
    FORTUNE_COMBO: { icon: 'fa-rocket', color: '#a855f7', bg: 'rgba(168,85,247,0.2)', label: '🚀 Combo Mode', emoji: '🚀' },
    FORTUNE_JACKPOT: { icon: 'fa-crown', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', label: '👑 Jackpot Mode', emoji: '👑' },
    FORTUNE_WIN: { icon: 'fa-trophy', color: '#facc15', bg: 'rgba(234,179,8,0.25)', label: '🏆 Winner!', emoji: '🏆' },
    FORTUNE_LOSE: { icon: 'fa-dice', color: '#71717a', bg: 'rgba(39,39,42,0.5)', label: '🎲 No Luck', emoji: '🎲' },
    NOTARY: { icon: 'fa-stamp', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', label: '📜 Notarized', emoji: '📜' },
    BACKCHAT_POST: { icon: 'fa-comment', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', label: '💬 Posted', emoji: '💬' },
    BACKCHAT_LIKE: { icon: 'fa-heart', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', label: '❤️ Liked', emoji: '❤️' },
    BACKCHAT_REPLY: { icon: 'fa-reply', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: '↩️ Replied', emoji: '↩️' },
    BACKCHAT_SUPERLIKE: { icon: 'fa-star', color: '#fbbf24', bg: 'rgba(251,191,36,0.2)', label: '⭐ Super Liked', emoji: '⭐' },
    BACKCHAT_REPOST: { icon: 'fa-retweet', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: '🔄 Reposted', emoji: '🔄' },
    BACKCHAT_FOLLOW: { icon: 'fa-user-plus', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: '👥 Followed', emoji: '👥' },
    BACKCHAT_PROFILE: { icon: 'fa-user', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: '👤 Profile Created', emoji: '👤' },
    BACKCHAT_BOOST: { icon: 'fa-rocket', color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: '🚀 Profile Boosted', emoji: '🚀' },
    BACKCHAT_BADGE: { icon: 'fa-circle-check', color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: '✅ Badge Activated', emoji: '✅' },
    BACKCHAT_TIP: { icon: 'fa-coins', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: '💰 Tipped BKC', emoji: '💰' },
    BACKCHAT_WITHDRAW: { icon: 'fa-wallet', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: '💸 ETH Withdrawn', emoji: '💸' },
    CHARITY_DONATE: { icon: 'fa-heart', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', label: '💝 Donated', emoji: '💝' },
    CHARITY_CREATE: { icon: 'fa-hand-holding-heart', color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: '🌱 Campaign Created', emoji: '🌱' },
    CHARITY_CANCEL: { icon: 'fa-heart-crack', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '💔 Campaign Cancelled', emoji: '💔' },
    CHARITY_WITHDRAW: { icon: 'fa-hand-holding-dollar', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: '💰 Funds Withdrawn', emoji: '💰' },
    CHARITY_GOAL_REACHED: { icon: 'fa-trophy', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: '🏆 Goal Reached!', emoji: '🏆' },
    FAUCET: { icon: 'fa-droplet', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', label: '💧 Faucet Claim', emoji: '💧' },
    DEFAULT: { icon: 'fa-circle', color: '#71717a', bg: 'rgba(39,39,42,0.5)', label: 'Activity', emoji: '📋' }
};

// ============================================================================
// HELPERS
// ============================================================================
function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    } catch (e) { return 'Recent'; }
}

function formatFullDateTime(timestamp) {
    if (!timestamp) return '';
    try {
        const secs = timestamp.seconds || timestamp._seconds || (new Date(timestamp).getTime() / 1000);
        const date = new Date(secs * 1000);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

function formatCompact(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toFixed(0);
}

function truncateAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatCooldownTime(endTime) {
    if (!endTime) return '';
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getActivityStyle(type, details = {}) {
    const t = (type || '').toUpperCase().trim();
    if (t === 'STAKING' || t === 'STAKED' || t === 'STAKE' || t === 'DELEGATED' || t === 'DELEGATION' || t.includes('DELEGAT')) return ACTIVITY_ICONS.STAKING;
    if (t === 'UNSTAKING' || t === 'UNSTAKED' || t === 'UNSTAKE' || t === 'UNDELEGATED') return ACTIVITY_ICONS.UNSTAKING;
    if (t === 'FORCE_UNSTAKE' || t === 'FORCEUNSTAKE' || t === 'FORCE_UNSTAKED') return ACTIVITY_ICONS.FORCE_UNSTAKE;
    if (t === 'CLAIM' || t === 'CLAIMED' || t === 'REWARD' || t === 'REWARDS' || t === 'REWARD_CLAIMED' || t === 'REWARDCLAIMED') return ACTIVITY_ICONS.CLAIM;
    if (t === 'NFT_BUY' || t === 'NFTBUY' || t === 'BOOSTER_BUY' || t === 'BOOSTERBUY' || t === 'BOOSTERBOUGHT' || (t.includes('BUY') && (t.includes('NFT') || t.includes('BOOSTER')))) return ACTIVITY_ICONS.NFT_BUY;
    if (t === 'NFT_SELL' || t === 'NFTSELL' || t === 'BOOSTER_SELL' || t === 'BOOSTERSELL' || t === 'BOOSTERSOLD' || (t.includes('SELL') && (t.includes('NFT') || t.includes('BOOSTER')))) return ACTIVITY_ICONS.NFT_SELL;
    if (t === 'NFT_MINT' || t === 'NFTMINT' || t === 'BOOSTER_MINT' || t === 'BOOSTERMINT' || t === 'MINTED' || t === 'BOOSTERMINTED') return ACTIVITY_ICONS.NFT_MINT;
    if (t === 'NFT_TRANSFER' || t === 'NFTTRANSFER' || t === 'BOOSTER_TRANSFER' || t === 'BOOSTERTRANSFER' || t === 'TRANSFER') return ACTIVITY_ICONS.NFT_TRANSFER;
    if (t === 'RENTAL_LIST' || t === 'RENTALLISTED' || t === 'RENTAL_LISTED' || t === 'LISTED' || (t.includes('LIST') && t.includes('RENTAL'))) return ACTIVITY_ICONS.RENTAL_LIST;
    if (t === 'RENTAL_RENT' || t === 'RENTALRENTED' || t === 'RENTAL_RENTED' || t === 'RENTED' || (t.includes('RENT') && !t.includes('LIST'))) return ACTIVITY_ICONS.RENTAL_RENT;
    if (t === 'RENTAL_WITHDRAW' || t === 'RENTALWITHDRAWN' || t === 'RENTAL_WITHDRAWN') return ACTIVITY_ICONS.RENTAL_WITHDRAW;
    if (t === 'RENTAL_PROMOTE' || t === 'RENTALPROMOTED' || t === 'RENTAL_PROMOTED' || t.includes('PROMOT') || t.includes('ADS') || t.includes('ADVERTIS')) return ACTIVITY_ICONS.RENTAL_PROMOTE;
    if (t === 'FORTUNE_COMMIT' || t === 'GAMECOMMITTED' || t === 'GAME_COMMITTED' || t === 'COMMITTED') return ACTIVITY_ICONS.FORTUNE_COMMIT;
    if (t === 'FORTUNE_REVEAL' || t === 'GAMEREVEALED' || t === 'GAME_REVEALED' || t === 'REVEALED') return ACTIVITY_ICONS.FORTUNE_REVEAL;
    const isFortune = t.includes('GAME') || t.includes('FORTUNE') || t.includes('REQUEST') || t.includes('FULFILLED') || t.includes('RESULT');
    if (isFortune) {
        const isWin = details?.isWin || (details?.prizeWon && BigInt(details.prizeWon || 0) > 0n);
        if (isWin) return ACTIVITY_ICONS.FORTUNE_WIN;
        const isCumulative = details?.isCumulative;
        if (isCumulative) return ACTIVITY_ICONS.FORTUNE_COMBO;
        return ACTIVITY_ICONS.FORTUNE_BET;
    }
    if (t === 'POSTCREATED' || t === 'POST_CREATED' || t === 'POSTED' || t === 'BACKCHAT_POST' || (t.includes('POST') && !t.includes('REPOST'))) return ACTIVITY_ICONS.BACKCHAT_POST;
    if (t === 'SUPERLIKED' || t === 'SUPER_LIKED' || t.includes('SUPERLIKE')) return ACTIVITY_ICONS.BACKCHAT_SUPERLIKE;
    if (t === 'LIKED' || t === 'POSTLIKED' || t === 'POST_LIKED' || (t.includes('LIKE') && !t.includes('SUPER'))) return ACTIVITY_ICONS.BACKCHAT_LIKE;
    if (t === 'REPLYCREATED' || t === 'REPLY_CREATED' || t.includes('REPLY')) return ACTIVITY_ICONS.BACKCHAT_REPLY;
    if (t === 'REPOSTCREATED' || t === 'REPOST_CREATED' || t.includes('REPOST')) return ACTIVITY_ICONS.BACKCHAT_REPOST;
    if (t === 'FOLLOWED' || t === 'USER_FOLLOWED' || t.includes('FOLLOW')) return ACTIVITY_ICONS.BACKCHAT_FOLLOW;
    if (t === 'PROFILECREATED' || t === 'PROFILE_CREATED' || t.includes('PROFILE') && t.includes('CREAT')) return ACTIVITY_ICONS.BACKCHAT_PROFILE;
    if (t === 'PROFILEBOOSTED' || t === 'PROFILE_BOOSTED' || t === 'BOOSTED' || (t.includes('BOOST') && !t.includes('NFT'))) return ACTIVITY_ICONS.BACKCHAT_BOOST;
    if (t === 'BADGEACTIVATED' || t === 'BADGE_ACTIVATED' || t.includes('BADGE')) return ACTIVITY_ICONS.BACKCHAT_BADGE;
    if (t === 'TIPPROCESSED' || t === 'TIP_PROCESSED' || t === 'TIPPED' || t.includes('TIP')) return ACTIVITY_ICONS.BACKCHAT_TIP;
    if (t === 'ETHWITHDRAWN' || t === 'ETH_WITHDRAWN' || t === 'BACKCHAT_WITHDRAW') return ACTIVITY_ICONS.BACKCHAT_WITHDRAW;
    if (t === 'CHARITYDONATION' || t === 'DONATIONMADE' || t === 'CHARITY_DONATE' || t === 'DONATED' || t === 'DONATION' || t.includes('DONATION')) return ACTIVITY_ICONS.CHARITY_DONATE;
    if (t === 'CHARITYCAMPAIGNCREATED' || t === 'CAMPAIGNCREATED' || t === 'CHARITY_CREATE' || t === 'CAMPAIGN_CREATED' || t.includes('CAMPAIGNCREATED')) return ACTIVITY_ICONS.CHARITY_CREATE;
    if (t === 'CHARITYCAMPAIGNCANCELLED' || t === 'CAMPAIGNCANCELLED' || t === 'CHARITY_CANCEL' || t === 'CAMPAIGN_CANCELLED' || t.includes('CANCELLED')) return ACTIVITY_ICONS.CHARITY_CANCEL;
    if (t === 'CHARITYFUNDSWITHDRAWN' || t === 'FUNDSWITHDRAWN' || t === 'CHARITY_WITHDRAW' || t === 'CAMPAIGN_WITHDRAW' || t.includes('WITHDRAWN')) return ACTIVITY_ICONS.CHARITY_WITHDRAW;
    if (t === 'CHARITYGOALREACHED' || t === 'GOALREACHED' || t === 'CHARITY_GOAL' || t === 'CAMPAIGN_COMPLETED') return ACTIVITY_ICONS.CHARITY_GOAL_REACHED;
    if (t === 'NOTARYREGISTER' || t === 'NOTARIZED' || t.includes('NOTARY') || t.includes('DOCUMENT')) return ACTIVITY_ICONS.NOTARY;
    if (t === 'FAUCETCLAIM' || t.includes('FAUCET') || t.includes('DISTRIBUTED')) return ACTIVITY_ICONS.FAUCET;
    return ACTIVITY_ICONS.DEFAULT;
}

// ============================================================================
// REWARDS ANIMATION
// ============================================================================
let animationFrameId = null;
let displayedRewardValue = 0n;

function animateClaimableRewards(targetNetValue) {
    const rewardsEl = document.getElementById('dash-user-rewards');
    if (!rewardsEl || !State.isConnected) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
    }
    const diff = targetNetValue - displayedRewardValue;
    if (diff > -1000000000n && diff < 1000000000n) displayedRewardValue = targetNetValue;
    else displayedRewardValue += diff / 8n;
    if (displayedRewardValue < 0n) displayedRewardValue = 0n;
    rewardsEl.innerHTML = `${formatBigNumber(displayedRewardValue).toFixed(4)} <span class="dash-reward-suffix">BKC</span>`;
    if (displayedRewardValue !== targetNetValue) {
        animationFrameId = requestAnimationFrame(() => animateClaimableRewards(targetNetValue));
    }
}

// ============================================================================
// FAUCET FUNCTIONS
// ============================================================================
async function requestSmartFaucet(btnElement) {
    if (!State.isConnected || !State.userAddress) return showToast("Conecte a wallet primeiro", "error");
    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Enviando...`;
    DashboardState.faucet.isLoading = true;

    // Tentar API primeiro (relayer paga gas)
    let apiSuccess = false;
    try {
        console.log('[Faucet] Tentando API relayer...');
        const response = await fetch(`${FAUCET_API_URL}?address=${State.userAddress}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = await response.json();
        console.log('[Faucet] API response:', response.status, data);

        if (response.ok && data.success) {
            apiSuccess = true;
            showToast(`Faucet: ${FAUCET_BKC_AMOUNT} BKC + ${FAUCET_ETH_AMOUNT} ETH enviados!`, "success");
            DashboardState.faucet.canClaim = false;
            DashboardState.faucet.cooldownEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            updateFaucetWidget();
            setTimeout(() => { DashboardPage.update(true); }, 4000);
        } else {
            const msg = data.error || data.message || "API indisponível";
            console.warn('[Faucet] API falhou:', msg);

            // Se for cooldown, não tenta on-chain
            if (msg.toLowerCase().includes("cooldown") || msg.toLowerCase().includes("wait") || msg.toLowerCase().includes("hour")) {
                showToast(msg, "warning");
                const hoursMatch = msg.match(/(\d+)\s*hour/i);
                if (hoursMatch) {
                    DashboardState.faucet.canClaim = false;
                    DashboardState.faucet.cooldownEnd = new Date(Date.now() + parseInt(hoursMatch[1]) * 3600000).toISOString();
                    updateFaucetWidget();
                }
                apiSuccess = true; // Não tentar fallback para cooldown
            }
        }
    } catch (e) {
        console.warn('[Faucet] API offline:', e.message);
    }

    // Fallback: claim on-chain direto (user paga gas)
    if (!apiSuccess) {
        try {
            console.log('[Faucet] Fallback: claim on-chain direto...');
            btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Claim on-chain...`;

            const { FaucetTx } = await import('../modules/transactions/index.js');
            const result = await FaucetTx.claimOnChain({
                button: null,
                onSuccess: () => {
                    showToast(`Faucet: ${FAUCET_BKC_AMOUNT} BKC + ${FAUCET_ETH_AMOUNT} ETH recebidos!`, "success");
                    DashboardState.faucet.canClaim = false;
                    DashboardState.faucet.cooldownEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    updateFaucetWidget();
                    setTimeout(() => { DashboardPage.update(true); }, 4000);
                },
                onError: (err) => {
                    console.error('[Faucet] On-chain falhou:', err);
                    const msg = err.message || 'Erro no claim';
                    if (msg.includes('Aguarde') || msg.includes('cooldown')) {
                        showToast(msg, "warning");
                    } else if (msg.includes('InsufficientTokens') || msg.includes('InsufficientETH')) {
                        showToast("Faucet sem saldo. Contate o admin.", "error");
                    } else if (msg.includes('user rejected') || msg.includes('denied')) {
                        showToast("Transação cancelada", "warning");
                    } else {
                        showToast(`Faucet: ${msg}`, "error");
                    }
                }
            });
        } catch (e) {
            console.error('[Faucet] On-chain erro:', e);
            const msg = e.message || '';
            if (msg.includes('Aguarde') || msg.includes('cooldown')) {
                showToast(msg, "warning");
            } else {
                showToast("Faucet indisponível. Tente novamente.", "error");
            }
        }
    }

    DashboardState.faucet.isLoading = false;
    btnElement.disabled = false;
    btnElement.innerHTML = originalHTML;
}

function updateFaucetWidget() {
    const widget = document.getElementById('dashboard-faucet-widget');
    if (!widget) return;

    const titleEl = document.getElementById('faucet-title');
    const descEl = document.getElementById('faucet-desc');
    const statusEl = document.getElementById('faucet-status');
    const btn = document.getElementById('faucet-action-btn');

    if (!State.isConnected) {
        widget.style.opacity = '0.5';
        if (titleEl) titleEl.innerText = "Get Free Testnet Tokens";
        if (descEl) descEl.innerText = "Connect your wallet to claim BKC + ETH for gas";
        if (statusEl) statusEl.classList.add('hidden');
        if (btn) { btn.className = 'dash-btn-secondary'; btn.innerHTML = '<i class="fa-solid fa-wallet"></i> Connect Wallet'; btn.disabled = true; }
        return;
    }
    widget.style.opacity = '1';

    const cooldownTime = formatCooldownTime(DashboardState.faucet.cooldownEnd);
    const canClaim = DashboardState.faucet.canClaim && !cooldownTime;

    if (!canClaim && cooldownTime) {
        if (titleEl) titleEl.innerText = "Faucet Cooldown";
        if (descEl) descEl.innerText = "Come back when the timer ends";
        if (statusEl) { statusEl.classList.remove('hidden'); statusEl.innerHTML = `<i class="fa-solid fa-clock" style="margin-right:4px"></i>${cooldownTime} remaining`; }
        if (btn) { btn.className = 'dash-btn-secondary'; btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> On Cooldown'; btn.disabled = true; }
    } else {
        if (titleEl) titleEl.innerText = "Get Free Testnet Tokens";
        if (descEl) descEl.innerText = "Claim BKC tokens and ETH for gas — free every 24h";
        if (statusEl) statusEl.classList.add('hidden');
        if (btn) { btn.className = 'dash-btn-primary dash-btn-cyan'; btn.innerHTML = '<i class="fa-solid fa-faucet"></i> Claim Free Tokens'; btn.disabled = false; }
    }
}

// ============================================================================
// REFERRAL FUNCTIONS
// ============================================================================
function detectReferralFromURL() {
    try {
        const hash = window.location.hash || '';
        const qIdx = hash.indexOf('?');
        if (qIdx === -1) return;
        const params = new URLSearchParams(hash.substring(qIdx));
        const ref = params.get('ref');
        if (ref && ethers.isAddress(ref)) {
            const current = localStorage.getItem('backchain_referrer');
            if (!current || current.toLowerCase() !== ref.toLowerCase()) {
                localStorage.setItem('backchain_referrer', ref);
                console.log('[Referral] Saved referrer from URL:', ref);
            }
        }
    } catch (e) { /* ignore */ }
}

// tryAutoSetReferrer removed — now handled gaslessly by api/referral.js + app.js processReferralAfterConnect()

async function loadReferralData() {
    if (!State.isConnected || !State.userAddress) return { count: 0, referrer: null };
    try {
        const ecosystemAddr = addresses?.backchainEcosystem;
        if (!ecosystemAddr) return { count: 0, referrer: null };
        const { ecosystemManagerABI } = await import('../config.js');
        const { NetworkManager } = await import('../modules/core/index.js');
        const provider = NetworkManager.getProvider();
        const eco = new ethers.Contract(ecosystemAddr, ecosystemManagerABI, provider);
        const [count, referrer] = await Promise.all([
            eco.referralCount(State.userAddress),
            eco.referredBy(State.userAddress)
        ]);
        return {
            count: Number(count),
            referrer: referrer !== '0x0000000000000000000000000000000000000000' ? referrer : null
        };
    } catch (e) {
        console.warn('[Referral] Load failed:', e.message);
        return { count: 0, referrer: null };
    }
}

async function updateReferralWidget() {
    const widget = document.getElementById('dashboard-referral-widget');
    if (!widget) return;

    const titleEl = document.getElementById('referral-title');
    const descEl = document.getElementById('referral-desc');
    const statsEl = document.getElementById('referral-stats');
    const linkContainer = document.getElementById('referral-link-container');
    const linkText = document.getElementById('referral-link-text');
    const shareBtn = document.getElementById('referral-share-btn');
    const countEl = document.getElementById('referral-count');

    if (!State.isConnected || !State.userAddress) {
        widget.style.opacity = '0.5';
        if (titleEl) titleEl.innerText = "Invite & Earn Forever";
        if (descEl) descEl.innerText = "Connect your wallet to get your referral link";
        if (statsEl) statsEl.style.display = 'none';
        if (linkContainer) linkContainer.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        return;
    }

    widget.style.opacity = '1';
    const refLink = `${window.location.origin}/#dashboard?ref=${State.userAddress}`;

    if (linkText) linkText.textContent = refLink;
    if (linkContainer) linkContainer.style.display = 'flex';
    if (shareBtn) shareBtn.style.display = '';

    // Load stats async
    const data = await loadReferralData();
    if (countEl) countEl.textContent = data.count;
    if (statsEl) statsEl.style.display = 'flex';

    if (data.count > 0) {
        if (titleEl) titleEl.innerText = `${data.count} Referral${data.count > 1 ? 's' : ''} Earning for You`;
        if (descEl) descEl.innerText = "You earn 5% of every staking reward they claim. Keep sharing!";
    } else {
        if (titleEl) titleEl.innerText = "Invite & Earn Forever";
        if (descEl) descEl.innerText = "Share your link. Earn 5% of every staking reward your referrals claim — forever.";
    }
}

function copyReferralLink() {
    if (!State.userAddress) return;
    const link = `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast('Referral link copied!', 'success');
        const btn = document.getElementById('referral-copy-btn');
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i>'; }, 2000); }
    }).catch(() => showToast('Failed to copy', 'error'));
}

function shareReferralLink() {
    if (!State.userAddress) return;
    const link = `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
    const text = `Join Backchain and earn crypto!\n\nStake BKC and earn daily rewards\nRefer friends and earn 5% of their rewards — FOREVER\n\n${link}\n\n#Backchain #DeFi #Arbitrum #Web3`;

    if (navigator.share) {
        navigator.share({ title: 'Backchain — Invite & Earn', text, url: link }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => showToast('Share text copied!', 'success')).catch(() => {});
    }
}

async function checkGasAndWarn() {
    try {
        const nativeBalance = await State.provider.getBalance(State.userAddress);
        if (nativeBalance < ethers.parseEther("0.002")) {
            const modal = document.getElementById('no-gas-modal-dash');
            if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
            return false;
        }
        return true;
    } catch (e) { return true; }
}

// ============================================================================
// CSS INJECTION
// ============================================================================
function injectStyles() {
    if (document.getElementById('dash-styles-v69')) return;
    const style = document.createElement('style');
    style.id = 'dash-styles-v69';
    style.textContent = `
        /* ── CSS Variables ── */
        .dash-shell {
            --dash-bg: #0c0c0e;
            --dash-surface: #141417;
            --dash-surface-2: #1c1c21;
            --dash-surface-3: #222228;
            --dash-border: rgba(255,255,255,0.06);
            --dash-border-h: rgba(255,255,255,0.12);
            --dash-text: #f0f0f2;
            --dash-text-2: #a0a0ab;
            --dash-text-3: #5c5c68;
            --dash-accent: #f59e0b;
            --dash-green: #4ade80;
            --dash-purple: #a78bfa;
            --dash-cyan: #22d3ee;
            --dash-radius: 16px;
            --dash-radius-sm: 10px;
            --dash-tr: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Animations ── */
        @keyframes dash-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dash-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes dash-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dash-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes dash-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes dash-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }

        /* ── Shell ── */
        .dash-shell { max-width: 1200px; margin: 0 auto; padding: 0 16px 40px; animation: dash-fadeIn 0.4s ease-out; }

        /* ── Hero Section ── */
        .dash-hero {
            position: relative;
            background: linear-gradient(135deg, rgba(20,20,23,0.95), rgba(12,12,14,0.98));
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius);
            padding: 28px 24px;
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out;
        }
        .dash-hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 4s ease-in-out infinite;
        }
        .dash-hero-inner { display: flex; gap: 24px; position: relative; z-index: 1; }
        .dash-hero-left { flex: 1.2; min-width: 0; }
        .dash-hero-right { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .dash-hero-label { font-size: 11px; color: var(--dash-text-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; }
        .dash-reward-value {
            font-size: clamp(28px, 5vw, 40px);
            font-weight: 800;
            color: var(--dash-green);
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            text-shadow: 0 0 30px rgba(74,222,128,0.2);
        }
        .dash-reward-suffix { font-size: 14px; color: rgba(74,222,128,0.6); font-weight: 600; }
        .dash-hero-pstake { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dash-border); }
        .dash-hero-pstake-label { font-size: 10px; color: var(--dash-text-3); text-transform: uppercase; }
        .dash-hero-pstake-value { font-size: 18px; font-weight: 700; color: var(--dash-purple); font-family: 'SF Mono', monospace; }
        .dash-hero-ghost {
            position: absolute;
            top: 12px;
            right: 16px;
            width: 64px;
            height: 64px;
            opacity: 0.06;
            animation: dash-float 6s ease-in-out infinite;
            pointer-events: none;
        }

        /* ── Claim Button ── */
        .dash-claim-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            padding: 10px 24px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white;
            font-weight: 700;
            font-size: 14px;
            border-radius: var(--dash-radius-sm);
            border: none;
            cursor: pointer;
            transition: all var(--dash-tr);
            box-shadow: 0 4px 20px rgba(34,197,94,0.25);
        }
        .dash-claim-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(34,197,94,0.35); }
        .dash-claim-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .dash-stake-link {
            font-size: 12px; color: var(--dash-purple); font-weight: 600; cursor: pointer;
            transition: color var(--dash-tr); margin-left: auto;
        }
        .dash-stake-link:hover { color: var(--dash-text); }

        /* ── Gain Upsell ── */
        .dash-gain-area {
            display: none;
            margin-top: 10px;
            padding: 6px 10px;
            background: linear-gradient(90deg, rgba(245,158,11,0.08), rgba(74,222,128,0.08));
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 8px;
            font-size: 10px;
            color: var(--dash-accent);
            font-weight: 700;
        }
        .dash-gain-area.visible { display: inline-block; }

        /* ── Faucet Section ── */
        .dash-faucet-section {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px 22px;
            background: linear-gradient(135deg, rgba(6,182,212,0.06), rgba(34,197,94,0.04));
            border: 1px solid rgba(6,182,212,0.15);
            border-radius: var(--dash-radius);
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out 0.1s both;
            transition: opacity var(--dash-tr);
        }
        .dash-faucet-section::before {
            content: '';
            position: absolute;
            top: -60%; left: -15%;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 5s ease-in-out infinite;
        }
        .dash-faucet-icon {
            width: 48px; height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(34,197,94,0.1));
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; color: #22d3ee;
            flex-shrink: 0;
            animation: dash-float 4s ease-in-out infinite;
            position: relative; z-index: 1;
        }
        .dash-faucet-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .dash-faucet-info h3 { font-size: 14px; font-weight: 800; color: var(--dash-text); margin: 0 0 2px; }
        .dash-faucet-info p { font-size: 11px; color: var(--dash-text-2); margin: 0; }
        .dash-faucet-amounts { display: flex; gap: 10px; margin-top: 8px; }
        .dash-faucet-badge {
            font-size: 11px; font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--dash-border);
            display: inline-flex; align-items: center; gap: 4px;
        }
        .dash-faucet-info .faucet-status-text { font-size: 12px; color: var(--dash-accent); font-family: 'SF Mono', monospace; margin-top: 6px; }
        .dash-faucet-actions { position: relative; z-index: 1; flex-shrink: 0; }

        /* ── Referral Section ── */
        .dash-referral-section {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px 22px;
            background: linear-gradient(135deg, rgba(167,139,250,0.06), rgba(139,92,246,0.04));
            border: 1px solid rgba(167,139,250,0.15);
            border-radius: var(--dash-radius);
            overflow: hidden;
            animation: dash-scaleIn 0.5s ease-out 0.15s both;
            transition: opacity var(--dash-tr);
        }
        .dash-referral-section::before {
            content: '';
            position: absolute;
            top: -60%; right: -15%;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%);
            pointer-events: none;
            animation: dash-glow 5s ease-in-out infinite 1s;
        }
        .dash-referral-icon {
            width: 48px; height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.1));
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; color: #a78bfa;
            flex-shrink: 0;
            animation: dash-float 4s ease-in-out infinite 0.5s;
            position: relative; z-index: 1;
        }
        .dash-referral-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .dash-referral-info h3 { font-size: 14px; font-weight: 800; color: var(--dash-text); margin: 0 0 2px; }
        .dash-referral-info p { font-size: 11px; color: var(--dash-text-2); margin: 0; }
        .dash-referral-stats {
            display: flex; gap: 12px; margin-top: 8px;
        }
        .dash-referral-stat {
            font-size: 11px; font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--dash-border);
            display: inline-flex; align-items: center; gap: 4px;
        }
        .dash-referral-link-box {
            display: flex; align-items: center; gap: 6px;
            margin-top: 8px;
            padding: 6px 10px;
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            border-radius: 8px;
            font-size: 11px;
            font-family: 'SF Mono', 'Fira Code', monospace;
            color: var(--dash-text-3);
            max-width: 380px;
        }
        .dash-referral-link-box span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dash-referral-link-box button {
            background: none; border: none; color: #a78bfa; cursor: pointer;
            padding: 2px 6px; font-size: 12px; border-radius: 4px;
            transition: background var(--dash-tr);
        }
        .dash-referral-link-box button:hover { background: rgba(167,139,250,0.1); }
        .dash-referral-actions { position: relative; z-index: 1; flex-shrink: 0; display: flex; gap: 8px; }
        .dash-btn-purple {
            background: linear-gradient(135deg, #a78bfa, #8b5cf6);
            color: #fff;
            box-shadow: 0 4px 20px rgba(139,92,246,0.25);
        }
        .dash-btn-purple:hover { box-shadow: 0 4px 28px rgba(139,92,246,0.4); transform: translateY(-1px); }
        @media (max-width: 640px) {
            .dash-referral-section { flex-direction: column; text-align: center; padding: 16px; }
            .dash-referral-actions { width: 100%; justify-content: center; }
            .dash-referral-link-box { max-width: 100%; }
            .dash-referral-stats { justify-content: center; }
        }

        /* ── Quick Actions Grid ── */
        .dash-actions-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .dash-action-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius-sm);
            cursor: pointer;
            transition: all var(--dash-tr);
            text-decoration: none;
            position: relative;
            overflow: hidden;
        }
        .dash-action-card::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity var(--dash-tr);
            pointer-events: none;
        }
        .dash-action-card:hover { border-color: var(--dash-border-h); transform: translateY(-2px); }
        .dash-action-card:hover::before { opacity: 1; }
        .dash-action-icon {
            width: 38px; height: 38px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }
        .dash-action-text h4 { font-size: 13px; font-weight: 700; color: var(--dash-text); margin: 0; }
        .dash-action-text p { font-size: 10px; color: var(--dash-text-3); margin: 2px 0 0; }
        .dash-action-arrow { font-size: 10px; color: var(--dash-text-3); margin-left: auto; transition: transform var(--dash-tr); }
        .dash-action-card:hover .dash-action-arrow { transform: translateX(3px); color: var(--dash-text-2); }

        /* Action card themes */
        .dash-action-card.backchat::before { background: linear-gradient(135deg, rgba(6,182,212,0.06), transparent); }
        .dash-action-card.backchat:hover { border-color: rgba(6,182,212,0.3); }
        .dash-action-card.stake::before { background: linear-gradient(135deg, rgba(167,139,250,0.06), transparent); }
        .dash-action-card.stake:hover { border-color: rgba(167,139,250,0.3); }
        .dash-action-card.fortune::before { background: linear-gradient(135deg, rgba(249,115,22,0.06), transparent); }
        .dash-action-card.fortune:hover { border-color: rgba(249,115,22,0.3); }
        .dash-action-card.notary::before { background: linear-gradient(135deg, rgba(129,140,248,0.06), transparent); }
        .dash-action-card.notary:hover { border-color: rgba(129,140,248,0.3); }
        .dash-action-card.charity::before { background: linear-gradient(135deg, rgba(236,72,153,0.06), transparent); }
        .dash-action-card.charity:hover { border-color: rgba(236,72,153,0.3); }
        .dash-action-card.nft::before { background: linear-gradient(135deg, rgba(245,158,11,0.06), transparent); }
        .dash-action-card.nft:hover { border-color: rgba(245,158,11,0.3); }

        /* ── Metrics Bar ── */
        .dash-metrics-bar {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
        }
        .dash-metric-pill {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 10px 12px;
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius-sm);
            transition: border-color var(--dash-tr);
        }
        .dash-metric-pill:hover { border-color: var(--dash-border-h); }
        .dash-metric-pill-label { font-size: 9px; color: var(--dash-text-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .dash-metric-pill-label i { font-size: 9px; }
        .dash-metric-pill-value { font-size: 14px; font-weight: 700; color: var(--dash-text); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Activity Panel ── */
        .dash-activity-panel {
            background: var(--dash-surface);
            border: 1px solid var(--dash-border);
            border-radius: var(--dash-radius);
            padding: 16px;
            animation: dash-fadeIn 0.5s ease-out 0.1s both;
        }
        .dash-activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .dash-activity-title { font-size: 13px; font-weight: 700; color: var(--dash-text); display: flex; align-items: center; gap: 8px; }
        .dash-activity-title i { color: var(--dash-text-3); font-size: 12px; }
        .dash-sort-btn {
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            color: var(--dash-text-3);
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all var(--dash-tr);
        }
        .dash-sort-btn:hover { color: var(--dash-text); border-color: var(--dash-border-h); }

        /* ── Filter Chips ── */
        .dash-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .dash-chip {
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 600;
            color: var(--dash-text-3);
            background: var(--dash-surface-2);
            border: 1px solid var(--dash-border);
            border-radius: 20px;
            cursor: pointer;
            transition: all var(--dash-tr);
            white-space: nowrap;
        }
        .dash-chip:hover { color: var(--dash-text-2); border-color: var(--dash-border-h); }
        .dash-chip.active { color: var(--dash-accent); background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); }
        .dash-chip i { opacity: 0.5; transition: opacity var(--dash-tr); }
        .dash-chip.active i { opacity: 1; }

        /* ── Activity List ── */
        .dash-activity-list { display: flex; flex-direction: column; gap: 6px; min-height: 150px; max-height: 520px; overflow-y: auto; }
        .dash-activity-list::-webkit-scrollbar { width: 4px; }
        .dash-activity-list::-webkit-scrollbar-track { background: transparent; }
        .dash-activity-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .dash-activity-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
            background: var(--dash-surface-2);
            border: 1px solid transparent;
            border-radius: 8px;
            transition: all var(--dash-tr);
            text-decoration: none;
            gap: 10px;
        }
        .dash-activity-item:hover { background: var(--dash-surface-3); border-color: var(--dash-border-h); }
        .dash-activity-item-icon {
            width: 32px; height: 32px;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            font-size: 12px;
        }
        .dash-activity-item-info { flex: 1; min-width: 0; }
        .dash-activity-item-label { font-size: 12px; font-weight: 600; color: var(--dash-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dash-activity-item-meta { font-size: 10px; color: var(--dash-text-3); margin-top: 1px; }
        .dash-activity-item-amount { font-size: 12px; font-weight: 600; color: var(--dash-text); font-family: 'SF Mono', monospace; text-align: right; white-space: nowrap; }
        .dash-activity-item-amount .unit { font-size: 10px; color: var(--dash-text-3); }
        .dash-activity-item-link { font-size: 9px; color: var(--dash-text-3); transition: color var(--dash-tr); }
        .dash-activity-item:hover .dash-activity-item-link { color: #60a5fa; }

        /* Fortune special item */
        .dash-fortune-item {
            display: block;
            padding: 10px 12px;
            background: var(--dash-surface-2);
            border: 1px solid transparent;
            border-radius: 8px;
            text-decoration: none;
            transition: all var(--dash-tr);
        }
        .dash-fortune-item:hover { background: var(--dash-surface-3); border-color: var(--dash-border-h); }

        /* ── Pagination ── */
        .dash-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--dash-border); }
        .dash-page-btn {
            font-size: 11px; color: var(--dash-text-3); background: none; border: none; cursor: pointer;
            transition: color var(--dash-tr); padding: 4px 0;
        }
        .dash-page-btn:hover:not(:disabled) { color: var(--dash-text); }
        .dash-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dash-page-indicator { font-size: 10px; color: var(--dash-text-3); font-family: monospace; }

        /* ── (sidebar removed in V69.1) ── */

        /* ── Buttons ── */
        .dash-btn-primary {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 16px; font-size: 12px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--dash-tr); color: white;
        }
        .dash-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .dash-btn-green { background: linear-gradient(135deg, #22c55e, #10b981); }
        .dash-btn-green:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .dash-btn-cyan:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .dash-btn-purple:hover:not(:disabled) { filter: brightness(1.1); }
        .dash-btn-secondary {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 16px; font-size: 12px; font-weight: 600;
            background: var(--dash-surface-2); color: var(--dash-text-2);
            border: 1px solid var(--dash-border); border-radius: 8px;
            cursor: pointer; transition: all var(--dash-tr);
        }
        .dash-btn-secondary:hover:not(:disabled) { color: var(--dash-text); border-color: var(--dash-border-h); }
        .dash-btn-secondary:disabled { opacity: 0.35; cursor: not-allowed; }
        .dash-modal-action-btn {
            width: 100%; padding: 9px; font-size: 12px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all var(--dash-tr); color: white; text-align: center;
        }
        .dash-modal-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* ── Modals ── */
        .dash-modal-overlay {
            position: fixed; inset: 0; z-index: 50;
            display: none; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
            padding: 16px; opacity: 0; transition: opacity 0.3s;
        }
        .dash-modal-overlay.visible { display: flex; opacity: 1; }
        .dash-modal {
            background: var(--dash-surface); border: 1px solid var(--dash-border-h);
            border-radius: var(--dash-radius); max-width: 360px; width: 100%;
            padding: 20px; position: relative;
            transform: scale(0.95); transition: transform 0.3s;
        }
        .dash-modal-overlay.visible .dash-modal { transform: scale(1); }

        /* ── Loading / Empty ── */
        .dash-loading {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 32px 16px; gap: 12px;
        }
        .dash-loading-logo { width: 40px; height: 40px; opacity: 0.4; animation: dash-float 2s ease-in-out infinite; }
        .dash-loading-text { font-size: 11px; color: var(--dash-text-3); }
        .dash-empty-text { font-size: 12px; color: var(--dash-text-3); text-align: center; padding: 24px 16px; }

        /* ── Hero gradient border ── */
        .dash-hero::after {
            content: '';
            position: absolute; inset: 0;
            border-radius: var(--dash-radius);
            padding: 1px;
            background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(74,222,128,0.15), rgba(167,139,250,0.15));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            -webkit-mask-composite: xor;
            pointer-events: none;
            opacity: 0.6;
        }

        /* ── Claim button shimmer when active ── */
        .dash-claim-btn:not(:disabled) {
            background-size: 200% 100%;
            background-image: linear-gradient(90deg, #22c55e 0%, #34d399 25%, #22c55e 50%, #10b981 100%);
            animation: dash-shimmer 3s linear infinite;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
            .dash-metrics-bar { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
            .dash-shell { padding: 0 10px 30px; }
            .dash-hero { padding: 20px 16px; }
            .dash-hero-inner { flex-direction: column; gap: 16px; }
            .dash-hero-right { border-top: 1px solid var(--dash-border); padding-top: 16px; }
            .dash-actions-grid { grid-template-columns: repeat(2, 1fr); }
            .dash-metrics-bar { grid-template-columns: repeat(2, 1fr); }
            .dash-reward-value { font-size: 28px; }

            /* Faucet stacks vertically */
            .dash-faucet-section { flex-direction: column; text-align: center; padding: 16px; }
            .dash-faucet-actions { width: 100%; }
            .dash-faucet-actions button { width: 100%; justify-content: center; }
            .dash-faucet-amounts { justify-content: center; }

            /* Filter chips horizontal scroll */
            .dash-filter-chips {
                flex-wrap: nowrap;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                padding-bottom: 4px;
            }
            .dash-filter-chips::-webkit-scrollbar { display: none; }

            /* Tighter activity items */
            .dash-activity-item { padding: 8px; gap: 8px; }
        }
        @media (max-width: 380px) {
            .dash-actions-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// 1. RENDER LAYOUT
// ============================================================================
function renderDashboardLayout() {
    if (!DOMElements.dashboard) return;
    injectStyles();

    DOMElements.dashboard.innerHTML = `
        <div class="dash-shell">

            <!-- HERO SECTION -->
            <div class="dash-hero" style="margin-bottom: 14px;">
                <img src="./assets/bkc_logo_3d.png" class="dash-hero-ghost" alt="">
                <div class="dash-hero-inner">
                    <div class="dash-hero-left">
                        <div class="dash-hero-label">You Will Receive</div>
                        <div id="dash-user-rewards" class="dash-reward-value">--</div>

                        <div id="dash-user-gain-area" class="dash-gain-area">
                            <i class="fa-solid fa-rocket" style="margin-right:4px"></i>
                            Earn +<span id="dash-user-potential-gain">0</span> BKC more with NFT!
                        </div>

                        <button id="dashboardClaimBtn" class="dash-claim-btn" disabled>
                            <i class="fa-solid fa-coins"></i> Claim Rewards
                        </button>

                        <div class="dash-hero-pstake">
                            <div>
                                <div class="dash-hero-pstake-label">Your pStake</div>
                                <div id="dash-user-pstake" class="dash-hero-pstake-value">--</div>
                            </div>
                            <span class="dash-stake-link delegate-link"><i class="fa-solid fa-plus" style="margin-right:3px"></i> Stake More</span>
                        </div>
                    </div>

                    <div class="dash-hero-right">
                        <div id="dash-booster-area" style="min-height: 120px; display: flex; align-items: center; justify-content: center;">
                            <div style="text-align:center;">
                                <img src="./assets/bkc_logo_3d.png" style="width:32px;height:32px;opacity:0.3;animation:dash-float 2s infinite" alt="">
                                <p style="font-size:11px;color:var(--dash-text-3);margin-top:8px">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FAUCET SECTION — Always Visible -->
            <div id="dashboard-faucet-widget" class="dash-faucet-section" style="margin-bottom: 14px;">
                <div class="dash-faucet-icon">
                    <i class="fa-solid fa-droplet"></i>
                </div>
                <div class="dash-faucet-info">
                    <h3 id="faucet-title">Get Free Testnet Tokens</h3>
                    <p id="faucet-desc">Claim BKC tokens and ETH for gas — free every 24h</p>
                    <div class="dash-faucet-amounts">
                        <span class="dash-faucet-badge" style="color:#22d3ee">
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>${FAUCET_BKC_AMOUNT} BKC
                        </span>
                        <span class="dash-faucet-badge" style="color:#4ade80">
                            <i class="fa-brands fa-ethereum" style="font-size:10px"></i>${FAUCET_ETH_AMOUNT} ETH
                        </span>
                    </div>
                    <p id="faucet-status" class="faucet-status-text hidden"></p>
                </div>
                <div class="dash-faucet-actions">
                    <button id="faucet-action-btn" class="dash-btn-primary dash-btn-cyan">
                        <i class="fa-solid fa-faucet"></i> Claim Free Tokens
                    </button>
                </div>
            </div>

            <!-- REFERRAL SECTION -->
            <div id="dashboard-referral-widget" class="dash-referral-section" style="margin-bottom: 14px;">
                <div class="dash-referral-icon">
                    <i class="fa-solid fa-user-plus"></i>
                </div>
                <div class="dash-referral-info">
                    <h3 id="referral-title">Invite & Earn Forever</h3>
                    <p id="referral-desc">Share your link. Earn 5% of every staking reward your referrals claim — forever.</p>
                    <div id="referral-stats" class="dash-referral-stats" style="display:none">
                        <span class="dash-referral-stat" style="color:#a78bfa">
                            <i class="fa-solid fa-users" style="font-size:10px"></i>
                            <span id="referral-count">0</span> referred
                        </span>
                        <span class="dash-referral-stat" style="color:#4ade80">
                            <i class="fa-solid fa-coins" style="font-size:10px"></i>
                            5% of their rewards
                        </span>
                    </div>
                    <div id="referral-link-container" class="dash-referral-link-box" style="display:none">
                        <span id="referral-link-text"></span>
                        <button id="referral-copy-btn" title="Copy link"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                <div class="dash-referral-actions">
                    <button id="referral-share-btn" class="dash-btn-primary dash-btn-purple" style="display:none">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </div>

            <!-- QUICK ACTIONS GRID -->
            <div class="dash-actions-grid" style="margin-bottom: 14px;">
                <div class="dash-action-card backchat go-to-backchat">
                    <div class="dash-action-icon" style="background:rgba(6,182,212,0.12); color:#22d3ee;">
                        <i class="fa-solid fa-comment-dots"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Agora</h4>
                        <p>Post & discuss on-chain</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card stake delegate-link">
                    <div class="dash-action-icon" style="background:rgba(167,139,250,0.12); color:#a78bfa;">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Stake BKC</h4>
                        <p>Earn while you sleep</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card fortune go-to-fortune">
                    <div class="dash-action-icon" style="background:rgba(249,115,22,0.12); color:#f97316;">
                        <i class="fa-solid fa-paw"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Fortune Pool</h4>
                        <p id="dash-fortune-prize-text">Win up to 100x</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card notary go-to-notary">
                    <div class="dash-action-icon" style="background:rgba(129,140,248,0.12); color:#818cf8;">
                        <i class="fa-solid fa-stamp"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Notarize</h4>
                        <p id="dash-notary-count-text">Certify on blockchain</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card charity go-to-charity">
                    <div class="dash-action-icon" style="background:rgba(236,72,153,0.12); color:#ec4899;">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>Charity Pool</h4>
                        <p>Donate & burn tokens</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>

                <div class="dash-action-card nft go-to-store">
                    <div class="dash-action-icon" style="background:rgba(245,158,11,0.12); color:#f59e0b;">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <div class="dash-action-text">
                        <h4>NFT Market</h4>
                        <p>2x your rewards</p>
                    </div>
                    <i class="fa-solid fa-chevron-right dash-action-arrow"></i>
                </div>
            </div>

            <!-- METRICS BAR -->
            <div class="dash-metrics-bar" style="margin-bottom: 16px;">
                <div class="dash-metric-pill" title="Total BKC tokens in circulation">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-coins" style="color:#f59e0b"></i> Supply</div>
                    <div id="dash-metric-supply" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Total staking power on network">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> pStake</div>
                    <div id="dash-metric-pstake" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="BKC permanently removed from supply">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-fire" style="color:#ef4444"></i> Burned</div>
                    <div id="dash-metric-burned" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Total ETH fees collected by ecosystem">
                    <div class="dash-metric-pill-label"><i class="fa-brands fa-ethereum" style="color:#fb923c"></i> Fees</div>
                    <div id="dash-metric-fees" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="BKC locked in protocol contracts (staking, pools, etc)">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-vault" style="color:#60a5fa"></i> Locked</div>
                    <div id="dash-metric-locked" class="dash-metric-pill-value">--</div>
                </div>
                <div class="dash-metric-pill" title="Your BKC balance" style="border-color: rgba(245,158,11,0.2);">
                    <div class="dash-metric-pill-label"><i class="fa-solid fa-wallet" style="color:#f59e0b"></i> Balance</div>
                    <div id="dash-metric-balance" class="dash-metric-pill-value" style="color:#f59e0b">--</div>
                </div>
            </div>

            <!-- ACTIVITY FEED -->
            <div class="dash-activity-panel">
                <div class="dash-activity-header">
                    <div class="dash-activity-title">
                        <i class="fa-solid fa-bolt" style="color:var(--dash-accent)"></i>
                        <span id="activity-title">Activity</span>
                        <span id="activity-count" style="font-size:9px;color:var(--dash-text-3);background:var(--dash-surface-2);padding:2px 6px;border-radius:10px;font-weight:600;display:none">0</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button id="manual-refresh-btn" class="dash-sort-btn" title="Refresh activity">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button id="activity-sort-toggle" class="dash-sort-btn" title="Toggle sort order">
                            <i class="fa-solid fa-arrow-down-wide-short"></i>
                        </button>
                    </div>
                </div>

                <div class="dash-filter-chips">
                    <button class="dash-chip active" data-filter="ALL"><i class="fa-solid fa-layer-group" style="margin-right:3px;font-size:9px"></i>All</button>
                    <button class="dash-chip" data-filter="STAKE"><i class="fa-solid fa-lock" style="margin-right:3px;font-size:9px"></i>Staking</button>
                    <button class="dash-chip" data-filter="CLAIM"><i class="fa-solid fa-coins" style="margin-right:3px;font-size:9px"></i>Claims</button>
                    <button class="dash-chip" data-filter="NFT"><i class="fa-solid fa-gem" style="margin-right:3px;font-size:9px"></i>NFT</button>
                    <button class="dash-chip" data-filter="GAME"><i class="fa-solid fa-dice" style="margin-right:3px;font-size:9px"></i>Fortune</button>
                    <button class="dash-chip" data-filter="CHARITY"><i class="fa-solid fa-heart" style="margin-right:3px;font-size:9px"></i>Charity</button>
                    <button class="dash-chip" data-filter="NOTARY"><i class="fa-solid fa-stamp" style="margin-right:3px;font-size:9px"></i>Notary</button>
                    <button class="dash-chip" data-filter="BACKCHAT"><i class="fa-solid fa-comments" style="margin-right:3px;font-size:9px"></i>Agora</button>
                    <button class="dash-chip" data-filter="FAUCET"><i class="fa-solid fa-droplet" style="margin-right:3px;font-size:9px"></i>Faucet</button>
                </div>

                <div id="dash-activity-list" class="dash-activity-list">
                    <div class="dash-loading">
                        <img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt="">
                        <span class="dash-loading-text">Loading activity...</span>
                    </div>
                </div>

                <div id="dash-pagination-controls" class="dash-pagination" style="display:none">
                    <button class="dash-page-btn" id="page-prev"><i class="fa-solid fa-chevron-left" style="margin-right:4px"></i>Prev</button>
                    <span class="dash-page-indicator" id="page-indicator">1/1</span>
                    <button class="dash-page-btn" id="page-next">Next<i class="fa-solid fa-chevron-right" style="margin-left:4px"></i></button>
                </div>
            </div>
        </div>

        ${renderBoosterModal()}
        ${renderGasModal()}
    `;

    attachDashboardListeners();
}

// ============================================================================
// MODALS
// ============================================================================
function renderBoosterModal() {
    return `
        <div id="booster-info-modal" class="dash-modal-overlay">
            <div class="dash-modal">
                <button id="close-booster-modal" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--dash-text-3);cursor:pointer;font-size:16px"><i class="fa-solid fa-xmark"></i></button>
                <div style="text-align:center; margin-bottom:16px">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(245,158,11,0.15);border-radius:50%;margin-bottom:8px">
                        <i class="fa-solid fa-rocket" style="font-size:22px;color:var(--dash-accent)"></i>
                    </div>
                    <h3 style="font-size:18px;font-weight:700;color:var(--dash-text);margin:0">Boost Efficiency</h3>
                    <p style="font-size:11px;color:var(--dash-text-2);margin-top:4px">NFT holders earn up to 2x more</p>
                </div>
                <div style="background:var(--dash-surface-2);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px">
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-text-2)">No NFT:</span><span style="color:var(--dash-text-3);font-weight:700">50%</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-text-2)">Bronze:</span><span style="color:#fde047;font-weight:700">80%</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--dash-accent)">Diamond:</span><span style="color:var(--dash-green);font-weight:700">100%</span></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
                    <button class="dash-modal-action-btn go-to-store" style="background:linear-gradient(135deg,#d97706,#b45309)">Buy NFT</button>
                    <button class="dash-modal-action-btn go-to-rental" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">Rent NFT</button>
                </div>
            </div>
        </div>
    `;
}

function renderGasModal() {
    return `
        <div id="no-gas-modal-dash" class="dash-modal-overlay">
            <div class="dash-modal" style="text-align:center;max-width:300px">
                <div style="width:48px;height:48px;background:rgba(239,68,68,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:1px solid rgba(239,68,68,0.2)">
                    <i class="fa-solid fa-gas-pump" style="font-size:18px;color:#ef4444"></i>
                </div>
                <h3 style="font-size:16px;font-weight:700;color:var(--dash-text);margin:0 0 4px">No Gas</h3>
                <p style="font-size:11px;color:var(--dash-text-2);margin-bottom:14px">You need Arbitrum Sepolia ETH</p>
                <button id="emergency-faucet-btn" class="dash-btn-primary dash-btn-green" style="width:100%;justify-content:center;margin-bottom:10px">
                    <i class="fa-solid fa-hand-holding-medical"></i> Get Free Gas + BKC
                </button>
                <button id="close-gas-modal-dash" style="background:none;border:none;color:var(--dash-text-3);cursor:pointer;font-size:11px">Close</button>
            </div>
        </div>
    `;
}

// ============================================================================
// 2. DATA LOGIC
// ============================================================================
async function fetchEconomicData() {
    try {
        const response = await fetch(SYSTEM_DATA_API);
        if (response.ok) {
            const data = await response.json();
            DashboardState.economicData = data;
            return data;
        }
    } catch (e) {}
    return null;
}

async function updateGlobalMetrics() {
    try {
        const ecoData = await fetchEconomicData();

        let totalSupply = 0n;
        let totalPStake = 0n;
        let totalTVL = 0n;
        let totalBurned = 0n;
        let totalEthFees = 0n;
        let notaryCount = 0;
        let fortunePoolBalance = 0n;

        // V9: Read from new getSystemData structure
        if (ecoData) {
            if (ecoData.token?.totalSupply) totalSupply = BigInt(ecoData.token.totalSupply);
            if (ecoData.token?.totalBurned) totalBurned = BigInt(ecoData.token.totalBurned);
            if (ecoData.staking?.totalPStake) totalPStake = BigInt(ecoData.staking.totalPStake);
            if (ecoData.ecosystem?.totalEthCollected) totalEthFees = BigInt(ecoData.ecosystem.totalEthCollected);
            if (ecoData.fortunePool?.prizePool) fortunePoolBalance = BigInt(ecoData.fortunePool.prizePool);
            if (ecoData.notary?.certCount) notaryCount = ecoData.notary.certCount;
            if (ecoData.stats?.notarizedDocuments) notaryCount = Math.max(notaryCount, ecoData.stats.notarizedDocuments);
        }

        // On-chain reads (primary source of truth)
        if (State.bkcTokenContractPublic) {
            if (totalSupply === 0n) totalSupply = await safeContractCall(State.bkcTokenContractPublic, 'totalSupply', [], 0n);
            if (totalBurned === 0n) totalBurned = await safeContractCall(State.bkcTokenContractPublic, 'totalBurned', [], 0n);
            if (totalPStake === 0n && (State.stakingPoolContractPublic || State.stakingPoolContract)) {
                totalPStake = await safeContractCall(State.stakingPoolContractPublic || State.stakingPoolContract, 'totalPStake', [], 0n);
            }
            // TVL: sum BKC held in protocol contracts
            const contractAddresses = [
                addresses.stakingPool, addresses.fortunePool, addresses.rentalManager,
                addresses.buybackMiner, addresses.liquidityPool,
                addresses.pool_diamond, addresses.pool_gold,
                addresses.pool_silver, addresses.pool_bronze
            ].filter(addr => addr && addr !== ethers.ZeroAddress);
            const balances = await Promise.all(contractAddresses.map(addr => safeContractCall(State.bkcTokenContractPublic, 'balanceOf', [addr], 0n)));
            balances.forEach(bal => { totalTVL += bal; });
            if (addresses.fortunePool && fortunePoolBalance === 0n) {
                const fortuneIdx = contractAddresses.indexOf(addresses.fortunePool);
                if (fortuneIdx >= 0) fortunePoolBalance = balances[fortuneIdx];
            }
        }

        // Persist in State for other pages (e.g. TokenomicsPage)
        State.totalSupply = totalSupply;
        State.totalBurned = totalBurned;

        const supplyNum = formatBigNumber(totalSupply);
        const burnedNum = formatBigNumber(totalBurned);
        const ethFeesNum = formatBigNumber(totalEthFees);
        const fortunePrize = formatBigNumber(fortunePoolBalance);

        const formatFullNumber = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const lockedNum = formatBigNumber(totalTVL);

        const setEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

        setEl('dash-metric-supply', `${formatFullNumber(supplyNum)} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`);
        setEl('dash-metric-pstake', formatPStake(totalPStake));
        setEl('dash-metric-burned', burnedNum > 0
            ? `<span style="color:#ef4444">${formatCompact(burnedNum)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`
            : `<span style="color:var(--dash-text-3)">0 BKC</span>`);
        setEl('dash-metric-fees', ethFeesNum > 0
            ? `${formatCompact(ethFeesNum)} <span style="font-size:10px;color:var(--dash-text-3)">ETH</span>`
            : `<span style="color:var(--dash-text-3)">0 ETH</span>`);

        setEl('dash-metric-locked', lockedNum > 0
            ? `<span style="color:#60a5fa">${formatCompact(lockedNum)}</span> <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`
            : `<span style="color:var(--dash-text-3)">0 BKC</span>`);

        updateBalanceCard();

        const fortuneText = document.getElementById('dash-fortune-prize-text');
        if (fortuneText) fortuneText.innerText = fortunePrize > 0 ? `Prize: ${formatCompact(fortunePrize)} BKC` : 'Play to win';

        const notaryText = document.getElementById('dash-notary-count-text');
        if (notaryText) notaryText.innerText = notaryCount > 0 ? `${notaryCount} docs certified` : 'Certify documents';

        DashboardState.metricsCache = { supply: supplyNum, burned: burnedNum, fees: ethFeesNum, timestamp: Date.now() };
    } catch (e) {
        console.error("Metrics Error", e);
    }
}

function updateBalanceCard() {
    const balanceEl = document.getElementById('dash-metric-balance');
    if (!balanceEl) return;
    const balance = State.currentUserBalance || State.bkcBalance || 0n;
    if (!State.isConnected) {
        balanceEl.innerHTML = `<span style="font-size:11px;color:var(--dash-text-3)">Connect Wallet</span>`;
        return;
    }
    if (balance === 0n) {
        balanceEl.innerHTML = `0.00 <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`;
    } else {
        const balanceNum = formatBigNumber(balance);
        balanceEl.innerHTML = `${balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style="font-size:10px;color:var(--dash-text-3)">BKC</span>`;
    }
}

async function fetchUserProfile() {
    if (!State.userAddress) return;
    try {
        const response = await fetch(`https://getuserprofile-4wvdcuoouq-uc.a.run.app/${State.userAddress}`);
        if (response.ok) {
            DashboardState.userProfile = await response.json();
        }
    } catch (e) { }
}

async function updateUserHub(forceRefresh = false) {
    if (!State.isConnected) {
        const boosterArea = document.getElementById('dash-booster-area');
        if (boosterArea) {
            boosterArea.innerHTML = `
                <div style="text-align:center">
                    <p style="font-size:11px;color:var(--dash-text-3);margin-bottom:8px">Connect wallet to view</p>
                    <button onclick="window.openConnectModal()" class="dash-btn-secondary" style="font-size:11px">Connect</button>
                </div>`;
        }
        return;
    }

    try {
        const rewardsEl = document.getElementById('dash-user-rewards');
        if (forceRefresh && rewardsEl) rewardsEl.style.opacity = '0.6';

        const [, claimDetails, boosterData] = await Promise.all([
            loadUserData(),
            calculateClaimDetails(),
            getHighestBoosterBoostFromAPI()
        ]);

        const netClaimAmount = claimDetails?.netClaimAmount || 0n;
        animateClaimableRewards(netClaimAmount);

        if (rewardsEl) rewardsEl.style.opacity = '1';

        const claimBtn = document.getElementById('dashboardClaimBtn');
        if (claimBtn) claimBtn.disabled = netClaimAmount <= 0n;

        const pStakeEl = document.getElementById('dash-user-pstake');
        if (pStakeEl) {
            let userPStake = State.userData?.pStake || State.userData?.userTotalPStake || State.userTotalPStake || 0n;
            // V9: stakingPool replaces delegationManager
            if (userPStake === 0n && (State.stakingPoolContractPublic || State.stakingPoolContract) && State.userAddress) {
                try { userPStake = await safeContractCall(State.stakingPoolContractPublic || State.stakingPoolContract, 'userTotalPStake', [State.userAddress], 0n); } catch (e) {}
            }
            pStakeEl.innerText = formatPStake(userPStake);
        }

        updateBalanceCard();
        updateBoosterDisplay(boosterData, claimDetails);
        fetchUserProfile();
        updateFaucetWidget();
    } catch (e) {
        console.error("User Hub Error:", e);
    }
}

function updateBoosterDisplay(data, claimDetails) {
    const container = document.getElementById('dash-booster-area');
    if (!container) return;

    const currentBoostBips = data?.highestBoost || 0;
    const keepRate = getKeepRateFromBoost(currentBoostBips);
    const grossReward = claimDetails?.totalRewards || 0n;
    const netReward = (grossReward * BigInt(keepRate)) / 100n;
    const diamondReward = grossReward;
    const potentialBonus = diamondReward - netReward;

    // NFT image: from data.imageUrl (fixed in data.js), or tierInfo.image, or fallback
    const tierInfo = getTierByBoost(currentBoostBips);
    const nftImageUrl = data?.imageUrl || tierInfo?.image || './assets/bkc_logo_3d.png';
    // Diamond tier image for upsell
    const diamondTier = boosterTiers.find(t => t.name === 'Diamond');
    const diamondImage = diamondTier?.image || './assets/bkc_logo_3d.png';

    if (currentBoostBips === 0) {
        if (potentialBonus > 0n) {
            const gainArea = document.getElementById('dash-user-gain-area');
            if (gainArea) {
                gainArea.classList.add('visible');
                document.getElementById('dash-user-potential-gain').innerText = formatBigNumber(potentialBonus).toFixed(2);
            }
        }
        container.innerHTML = `
            <div style="text-align:center;width:100%">
                <div style="position:relative;margin:0 auto 12px;width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.08);border:2px dashed rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center">
                    <i class="fa-solid fa-shield-halved" style="font-size:24px;color:rgba(239,68,68,0.35)"></i>
                    <div style="position:absolute;bottom:-3px;right:-3px;width:20px;height:20px;border-radius:50%;background:#1c1c21;border:2px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center">
                        <i class="fa-solid fa-xmark" style="font-size:9px;color:#ef4444"></i>
                    </div>
                </div>

                <p style="font-size:11px;font-weight:700;color:var(--dash-text-3);margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">No Booster NFT</p>

                <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px">
                    <span style="font-size:20px;font-weight:800;color:var(--dash-accent)">${keepRate}%</span>
                    <span style="font-size:10px;color:var(--dash-text-3);text-align:left;line-height:1.2">reward<br>keep rate</span>
                </div>

                <div style="width:100%;background:var(--dash-surface-2);border-radius:20px;height:6px;overflow:hidden;margin-bottom:10px">
                    <div style="background:linear-gradient(90deg,#ef4444,#f59e0b);height:100%;border-radius:20px;width:${keepRate}%"></div>
                </div>

                ${grossReward > 0n && potentialBonus > 0n ? `
                <p style="font-size:10px;color:var(--dash-text-2);margin:0 0 10px">
                    <i class="fa-solid fa-arrow-up" style="color:var(--dash-green);margin-right:3px"></i>Get up to <span style="color:var(--dash-green);font-weight:700">+${formatBigNumber(potentialBonus).toFixed(2)} BKC</span> with NFT
                </p>` : `
                <p style="font-size:10px;color:var(--dash-text-3);margin:0 0 10px">
                    <i class="fa-solid fa-gem" style="color:var(--dash-accent);margin-right:3px"></i>Diamond holders keep <span style="color:var(--dash-green);font-weight:700">100%</span>
                </p>`}

                <div style="display:flex;gap:6px;justify-content:center">
                    <button class="dash-btn-primary go-to-store" style="background:linear-gradient(135deg,#d97706,#b45309);font-size:11px;padding:7px 14px;flex:1">
                        <i class="fa-solid fa-gem" style="margin-right:3px"></i>Buy NFT
                    </button>
                    <button class="dash-btn-primary go-to-rental" style="background:linear-gradient(135deg,#06b6d4,#0891b2);font-size:11px;padding:7px 14px;flex:1">
                        <i class="fa-solid fa-clock" style="margin-right:3px"></i>Rent NFT
                    </button>
                </div>
                <button id="open-booster-info" style="font-size:10px;color:var(--dash-text-3);background:none;border:none;cursor:pointer;margin-top:6px"><i class="fa-solid fa-circle-info" style="margin-right:3px"></i>How it works</button>
            </div>
        `;
        return;
    }

    // HAS NFT — clear owned vs rented state
    const isRented = data.source === 'rented';
    const tierName = tierInfo?.name || data.boostName?.replace(' Booster', '').replace('Booster', '').trim() || 'Booster';
    const tierColor = tierInfo?.color || 'color:var(--dash-accent)';
    const withoutNftReward = (grossReward * 50n) / 100n;
    const bonusGained = netReward - withoutNftReward;

    const statusIcon = isRented ? 'fa-clock' : 'fa-check-circle';
    const statusColor = isRented ? '#22d3ee' : '#4ade80';
    const statusBg = isRented ? 'rgba(6,182,212,0.12)' : 'rgba(74,222,128,0.12)';
    const statusBorder = isRented ? 'rgba(6,182,212,0.3)' : 'rgba(74,222,128,0.3)';
    const statusText = isRented ? 'RENTED' : 'OWNED';
    const statusDesc = isRented ? 'Active rental' : 'In your wallet';

    container.innerHTML = `
        <div class="nft-clickable-image" data-address="${addresses.rewardBooster}" data-tokenid="${data.tokenId}" style="width:100%;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:10px;background:var(--dash-surface-2);border:1px solid ${statusBorder};border-radius:12px;padding:10px 12px;margin-bottom:8px">
                <div style="position:relative;width:48px;height:48px;flex-shrink:0">
                    <img src="${nftImageUrl}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:2px solid ${statusBorder}" alt="${tierName}" onerror="this.src='./assets/bkc_logo_3d.png'">
                    <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${statusColor};display:flex;align-items:center;justify-content:center;border:2px solid var(--dash-surface-2)">
                        <i class="fa-solid ${statusIcon}" style="font-size:8px;color:#000"></i>
                    </div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px">
                        <h4 style="${tierColor};font-weight:700;font-size:13px;margin:0">${tierName}</h4>
                        <span style="font-size:8px;font-weight:800;color:${statusColor};background:${statusBg};padding:2px 6px;border-radius:4px;letter-spacing:0.05em">${statusText}</span>
                        <span style="font-size:9px;color:var(--dash-text-3)">#${data.tokenId}</span>
                    </div>
                    <p style="font-size:10px;color:var(--dash-text-3);margin:2px 0 0"><i class="fa-solid ${statusIcon}" style="color:${statusColor};margin-right:3px;font-size:9px"></i>${statusDesc}</p>
                </div>
                <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:18px;font-weight:800;color:var(--dash-green)">${keepRate}%</div>
                    <div style="font-size:8px;color:var(--dash-text-3);text-transform:uppercase;letter-spacing:0.05em">keep rate</div>
                </div>
            </div>
            ${grossReward > 0n ? `
            <div style="display:flex;gap:6px">
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">Net Reward</div>
                    <div style="font-size:12px;font-weight:700;color:var(--dash-green)">${formatBigNumber(netReward).toFixed(4)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>
                ${bonusGained > 0n ? `
                <div style="flex:1;background:var(--dash-surface-2);border-radius:8px;padding:6px 8px;text-align:center">
                    <div style="font-size:9px;color:var(--dash-text-3);text-transform:uppercase;margin-bottom:2px">NFT Bonus</div>
                    <div style="font-size:12px;font-weight:700;color:#34d399">+${formatBigNumber(bonusGained).toFixed(2)} <span style="font-size:9px;color:var(--dash-text-3)">BKC</span></div>
                </div>` : ''}
            </div>` : ''}
            ${keepRate < 100 ? `
            <p style="font-size:9px;color:var(--dash-accent);margin:6px 0 0;text-align:center"><i class="fa-solid fa-arrow-up" style="margin-right:2px"></i>Upgrade to Diamond for 100%</p>` : ''}
        </div>
    `;
}

// ============================================================================
// 3. ACTIVITY
// ============================================================================
async function fetchAndProcessActivities() {
    const listEl = document.getElementById('dash-activity-list');
    const titleEl = document.getElementById('activity-title');

    try {
        if (State.isConnected) {
            if (DashboardState.activities.length === 0) {
                if (listEl) listEl.innerHTML = `<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading your activity...</span></div>`;
                const response = await fetch(`${API_ENDPOINTS.getHistory}/${State.userAddress}`);
                if (response.ok) DashboardState.activities = await response.json();
            }
            if (DashboardState.activities.length > 0) {
                if (titleEl) titleEl.textContent = 'Your Activity';
                applyFiltersAndRender();
                return;
            }
        }
        if (titleEl) titleEl.textContent = 'Network Activity';
        await fetchNetworkActivity();
    } catch (e) {
        console.error("Activity fetch error:", e);
        if (titleEl) titleEl.textContent = 'Network Activity';
        await fetchNetworkActivity();
    }
}

async function fetchNetworkActivity() {
    const listEl = document.getElementById('dash-activity-list');
    if (!listEl) return;
    if (DashboardState.isLoadingNetworkActivity) return;
    const cacheAge = Date.now() - DashboardState.networkActivitiesTimestamp;
    if (DashboardState.networkActivities.length > 0 && cacheAge < 300000) { renderNetworkActivityList(); return; }
    DashboardState.isLoadingNetworkActivity = true;
    listEl.innerHTML = `<div class="dash-loading"><img src="./assets/bkc_logo_3d.png" class="dash-loading-logo" alt=""><span class="dash-loading-text">Loading network activity...</span></div>`;
    try {
        const response = await fetch(`${NETWORK_ACTIVITY_API}?limit=30`);
        if (response.ok) {
            const data = await response.json();
            DashboardState.networkActivities = Array.isArray(data) ? data : (data.activities || []);
            DashboardState.networkActivitiesTimestamp = Date.now();
        } else DashboardState.networkActivities = [];
    } catch (e) { DashboardState.networkActivities = []; } finally { DashboardState.isLoadingNetworkActivity = false; }
    renderNetworkActivityList();
}

function renderNetworkActivityList() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;
    if (DashboardState.networkActivities.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid fa-bolt" style="font-size:18px;color:rgba(245,158,11,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">No network activity yet</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">Be the first to stake, trade or play!</p>
            </div>`;
        if (controlsEl) controlsEl.style.display = 'none';
        return;
    }
    const countEl = document.getElementById('activity-count');
    if (countEl) { countEl.style.display = 'inline'; countEl.textContent = DashboardState.networkActivities.length; }
    listEl.innerHTML = DashboardState.networkActivities.slice(0, 15).map(item => renderActivityItem(item, true)).join('');
    if (controlsEl) controlsEl.style.display = 'none';
}

function applyFiltersAndRender() {
    let result = [...DashboardState.activities];
    const type = DashboardState.filters.type;
    const normalize = (t) => (t || '').toUpperCase();

    if (type !== 'ALL') {
        result = result.filter(item => {
            const t = normalize(item.type);
            if (type === 'STAKE') return t.includes('DELEGATION') || t.includes('DELEGAT') || t.includes('STAKE') || t.includes('UNSTAKE');
            if (type === 'CLAIM') return t.includes('REWARD') || t.includes('CLAIM');
            if (type === 'NFT') return t.includes('BOOSTER') || t.includes('RENT') || t.includes('NFT') || t.includes('TRANSFER');
            if (type === 'GAME') return t.includes('FORTUNE') || t.includes('GAME') || t.includes('REQUEST') || t.includes('RESULT') || t.includes('FULFILLED');
            if (type === 'CHARITY') return t.includes('CHARITY') || t.includes('CAMPAIGN') || t.includes('DONATION') || t.includes('DONATE');
            if (type === 'NOTARY') return t.includes('NOTARY') || t.includes('NOTARIZED') || t.includes('DOCUMENT');
            if (type === 'BACKCHAT') return t.includes('POST') || t.includes('LIKE') || t.includes('REPLY') || t.includes('REPOST') || t.includes('FOLLOW') || t.includes('PROFILE') || t.includes('BOOST') || t.includes('BADGE') || t.includes('TIP') || t.includes('BACKCHAT');
            if (type === 'FAUCET') return t.includes('FAUCET');
            return true;
        });
    }

    result.sort((a, b) => {
        const getTime = (obj) => {
            if (obj.timestamp && obj.timestamp._seconds) return obj.timestamp._seconds;
            if (obj.createdAt && obj.createdAt._seconds) return obj.createdAt._seconds;
            if (obj.timestamp) return new Date(obj.timestamp).getTime() / 1000;
            return 0;
        };
        return DashboardState.filters.sort === 'NEWEST' ? getTime(b) - getTime(a) : getTime(a) - getTime(b);
    });

    DashboardState.filteredActivities = result;
    DashboardState.pagination.currentPage = 1;
    renderActivityPage();
}

function renderActivityPage() {
    const listEl = document.getElementById('dash-activity-list');
    const controlsEl = document.getElementById('dash-pagination-controls');
    if (!listEl) return;

    if (DashboardState.filteredActivities.length === 0) {
        const isFiltered = DashboardState.filters.type !== 'ALL';
        listEl.innerHTML = `
            <div style="text-align:center;padding:32px 16px">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(167,139,250,0.08);border:1px dashed rgba(167,139,250,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <i class="fa-solid ${isFiltered ? 'fa-filter' : 'fa-rocket'}" style="font-size:18px;color:rgba(167,139,250,0.3)"></i>
                </div>
                <p style="font-size:12px;color:var(--dash-text-3);margin:0 0 4px">${isFiltered ? 'No matching activity' : 'No activity yet'}</p>
                <p style="font-size:10px;color:var(--dash-text-3);margin:0">${isFiltered ? 'Try a different filter' : 'Start staking, trading or playing!'}</p>
            </div>`;
        if (controlsEl) controlsEl.style.display = 'none';
        const countEl = document.getElementById('activity-count');
        if (countEl) countEl.style.display = 'none';
        return;
    }
    const countEl = document.getElementById('activity-count');
    if (countEl) { countEl.style.display = 'inline'; countEl.textContent = DashboardState.filteredActivities.length; }

    const start = (DashboardState.pagination.currentPage - 1) * DashboardState.pagination.itemsPerPage;
    const pageItems = DashboardState.filteredActivities.slice(start, start + DashboardState.pagination.itemsPerPage);
    listEl.innerHTML = pageItems.map(item => renderActivityItem(item, false)).join('');

    if (controlsEl) {
        const maxPage = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
        if (maxPage > 1) {
            controlsEl.style.display = 'flex';
            document.getElementById('page-indicator').innerText = `${DashboardState.pagination.currentPage}/${maxPage}`;
            document.getElementById('page-prev').disabled = DashboardState.pagination.currentPage === 1;
            document.getElementById('page-next').disabled = DashboardState.pagination.currentPage >= maxPage;
        } else controlsEl.style.display = 'none';
    }
}

function renderActivityItem(item, showAddress = false) {
    const dateStr = formatDate(item.timestamp || item.createdAt);
    const fullDateTime = formatFullDateTime(item.timestamp || item.createdAt);
    const address = item.user || item.userAddress || item.from || '';
    const truncAddr = truncateAddress(address);
    const style = getActivityStyle(item.type, item.details);
    let extraInfo = '';
    const t = (item.type || '').toUpperCase().trim();
    const details = item.details || {};

    // Fortune — special layout
    const isFortune = t.includes('GAME') || t.includes('FORTUNE') || t.includes('REQUEST') || t.includes('FULFILLED') || t.includes('RESULT');
    if (isFortune) {
        const rolls = details.rolls || item.rolls || [];
        const guesses = details.guesses || item.guesses || [];
        const isWin = details.isWin || (details.prizeWon && BigInt(details.prizeWon || 0) > 0n);
        const isCumulative = details.isCumulative !== undefined ? details.isCumulative : guesses.length > 1;
        const gameType = isCumulative ? 'Combo' : 'Jackpot';
        const badgeStyle = isCumulative ? 'background:rgba(168,85,247,0.15);color:#c084fc' : 'background:rgba(245,158,11,0.15);color:#fbbf24';
        const wager = details.wagerAmount || details.amount;
        const prize = details.prizeWon;
        const wagerNum = wager ? formatBigNumber(BigInt(wager)).toFixed(0) : '0';
        let resultText = '<span style="color:var(--dash-text-3)">No win</span>';
        if (isWin && prize && BigInt(prize) > 0n) resultText = `<span style="color:var(--dash-green);font-weight:700">+${formatBigNumber(BigInt(prize)).toFixed(0)} BKC</span>`;
        let rollsHtml = '';
        if (rolls.length > 0) {
            rollsHtml = `<div style="display:flex;gap:3px">${rolls.map((roll, i) => {
                const guess = guesses[i];
                const isMatch = guess !== undefined && Number(guess) === Number(roll);
                return `<div style="width:24px;height:24px;border-radius:4px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1px solid ${isMatch ? 'rgba(52,211,153,0.4)' : 'var(--dash-border)'};background:${isMatch ? 'rgba(52,211,153,0.1)' : 'var(--dash-surface-2)'};color:${isMatch ? '#34d399' : 'var(--dash-text-3)'}">${roll}</div>`;
            }).join('')}</div>`;
        }
        const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
        return `
            <a href="${txLink}" target="_blank" class="dash-fortune-item" title="${fullDateTime}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:6px;background:var(--dash-surface-3);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-dice" style="color:var(--dash-text-3);font-size:11px"></i></div>
                        <span style="color:var(--dash-text);font-size:12px;font-weight:600">${showAddress ? truncAddr : 'You'}</span>
                        <span style="font-size:9px;font-weight:700;${badgeStyle};padding:1px 6px;border-radius:4px">${gameType}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--dash-text-3)">
                        <span>${dateStr}</span>
                        <i class="fa-solid fa-external-link dash-activity-item-link"></i>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:11px"><span style="color:var(--dash-text-3)">Bet: ${wagerNum}</span><span style="margin:0 6px;color:var(--dash-text-3)">→</span>${resultText}</div>
                    ${rollsHtml}
                </div>
            </a>
        `;
    }

    // Extra info per type
    if (t.includes('NOTARY')) { const ipfsCid = details.ipfsCid; if (ipfsCid) extraInfo = `<span style="margin-left:4px;font-size:9px;color:#818cf8;font-family:monospace">${ipfsCid.replace('ipfs://','').slice(0,12)}...</span>`; }
    if (t.includes('STAKING') || t.includes('DELEGAT')) { const pStake = details.pStakeGenerated; if (pStake) extraInfo = `<span style="font-size:10px;color:var(--dash-purple)">+${formatBigNumber(BigInt(pStake)).toFixed(0)} pStake</span>`; }
    if (t.includes('DONATION') || t.includes('CHARITY')) {
        const netAmount = details.netAmount || details.amount;
        const campaignId = details.campaignId;
        if (netAmount && BigInt(netAmount) > 0n) { extraInfo = `<span style="color:#ec4899;font-weight:700">${formatBigNumber(BigInt(netAmount)).toFixed(2)} BKC</span>`; if (campaignId) extraInfo += `<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">Campaign #${campaignId}</span>`; }
    }
    if (t.includes('CLAIM') || t.includes('REWARD')) {
        const amount = details.amount || item.amount;
        if (amount) extraInfo = `<span style="color:var(--dash-accent);font-weight:700">+${formatBigNumber(BigInt(amount)).toFixed(2)} BKC</span>`;
        const feePaid = details.feePaid;
        if (feePaid && BigInt(feePaid) > 0n) extraInfo += `<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">(fee: ${formatBigNumber(BigInt(feePaid)).toFixed(2)})</span>`;
    }
    const isPromote = t.includes('PROMOT') || t.includes('ADS') || t.includes('ADVERTIS');
    if (isPromote) {
        const promoAmount = details.promotionFee || details.amount || item.amount;
        if (promoAmount && BigInt(promoAmount) > 0n) extraInfo = `<span style="color:#fbbf24;font-weight:700">${parseFloat(ethers.formatEther(BigInt(promoAmount))).toFixed(4)} ETH</span>`;
        const tokenId = details.tokenId || item.tokenId;
        if (tokenId) extraInfo += `<span style="margin-left:4px;font-size:9px;color:var(--dash-text-3)">NFT #${tokenId}</span>`;
    }

    const txLink = item.txHash ? `${EXPLORER_BASE_URL}${item.txHash}` : '#';
    let amountDisplay = '';
    if (isPromote) {
        const promoAmount = details.promotionFee || details.amount || item.amount;
        if (promoAmount && BigInt(promoAmount) > 0n) amountDisplay = parseFloat(ethers.formatEther(BigInt(promoAmount))).toFixed(4);
    } else {
        let rawAmount = item.amount || details.netAmount || details.amount || details.wagerAmount || details.prizeWon || "0";
        const amountNum = formatBigNumber(BigInt(rawAmount));
        amountDisplay = amountNum > 0.001 ? amountNum.toFixed(2) : '';
    }
    const currencyLabel = isPromote ? 'ETH' : 'BKC';

    return `
        <a href="${txLink}" target="_blank" class="dash-activity-item" title="${fullDateTime}">
            <div class="dash-activity-item-icon" style="background:${style.bg};border:1px solid transparent">
                <i class="fa-solid ${style.icon}" style="color:${style.color}"></i>
            </div>
            <div class="dash-activity-item-info">
                <div class="dash-activity-item-label">${style.label}${extraInfo ? ` ${extraInfo}` : ''}</div>
                <div class="dash-activity-item-meta">${showAddress ? truncAddr + ' · ' : ''}${dateStr}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                ${amountDisplay ? `<div class="dash-activity-item-amount">${amountDisplay} <span class="unit">${currencyLabel}</span></div>` : ''}
                <i class="fa-solid fa-arrow-up-right-from-square dash-activity-item-link"></i>
            </div>
        </a>
    `;
}

// ============================================================================
// 4. EVENT LISTENERS
// ============================================================================
function attachDashboardListeners() {
    if (!DOMElements.dashboard) return;

    DOMElements.dashboard.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.closest('#manual-refresh-btn')) {
            const btn = target.closest('#manual-refresh-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
            await updateUserHub(true);
            await updateGlobalMetrics();
            DashboardState.activities = [];
            DashboardState.networkActivities = [];
            DashboardState.networkActivitiesTimestamp = 0;
            DashboardState.faucet.lastCheck = 0;
            await fetchAndProcessActivities();
            setTimeout(() => { btn.innerHTML = `<i class="fa-solid fa-rotate"></i>`; btn.disabled = false; }, 1000);
        }

        if (target.closest('#faucet-action-btn')) { const btn = target.closest('#faucet-action-btn'); if (!btn.disabled) await requestSmartFaucet(btn); }
        if (target.closest('#emergency-faucet-btn')) await requestSmartFaucet(target.closest('#emergency-faucet-btn'));

        // Referral
        if (target.closest('#referral-copy-btn')) copyReferralLink();
        if (target.closest('#referral-share-btn')) shareReferralLink();

        // Navigation
        if (target.closest('.delegate-link')) { e.preventDefault(); window.navigateTo('mine'); }
        if (target.closest('.go-to-store')) { e.preventDefault(); window.navigateTo('store'); }
        if (target.closest('.go-to-rental')) { e.preventDefault(); window.navigateTo('rental'); }
        if (target.closest('.go-to-fortune')) { e.preventDefault(); window.navigateTo('actions'); }
        if (target.closest('.go-to-notary')) { e.preventDefault(); window.navigateTo('notary'); }
        if (target.closest('.go-to-charity')) { e.preventDefault(); window.navigateTo('charity'); }
        if (target.closest('.go-to-backchat')) { e.preventDefault(); window.navigateTo('backchat'); }

        // Booster modal
        if (target.closest('#open-booster-info')) {
            const modal = document.getElementById('booster-info-modal');
            if (modal) { modal.classList.add('visible'); }
        }
        if (target.closest('#close-booster-modal') || target.id === 'booster-info-modal') {
            const modal = document.getElementById('booster-info-modal');
            if (modal) modal.classList.remove('visible');
        }

        // Gas modal
        if (target.closest('#close-gas-modal-dash') || target.id === 'no-gas-modal-dash') {
            const modal = document.getElementById('no-gas-modal-dash');
            if (modal) modal.classList.remove('visible');
        }

        // NFT click
        const nftClick = target.closest('.nft-clickable-image');
        if (nftClick) {
            const address = nftClick.dataset.address;
            const id = nftClick.dataset.tokenid;
            if (address && id) addNftToWallet(address, id);
        }

        // Claim rewards
        const claimBtn = target.closest('#dashboardClaimBtn');
        if (claimBtn && !claimBtn.disabled) {
            try {
                claimBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                claimBtn.disabled = true;
                const hasGas = await checkGasAndWarn();
                if (!hasGas) { claimBtn.innerHTML = '<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards'; claimBtn.disabled = false; return; }
                const { stakingRewards, minerRewards } = await calculateUserTotalRewards();
                if (stakingRewards > 0n || minerRewards > 0n) {
                    await StakingTx.claimRewards({
                        button: claimBtn,
                        onSuccess: async () => { showToast("Rewards claimed!", "success"); await updateUserHub(true); DashboardState.activities = []; fetchAndProcessActivities(); },
                        onError: (error) => { if (!error.cancelled) showToast("Claim failed", "error"); }
                    });
                }
            } catch (err) { showToast("Claim failed", "error"); } finally {
                claimBtn.innerHTML = '<i class="fa-solid fa-coins" style="margin-right:6px"></i> Claim Rewards';
                claimBtn.disabled = false;
            }
        }

        // Pagination
        if (target.closest('#page-prev') && DashboardState.pagination.currentPage > 1) { DashboardState.pagination.currentPage--; renderActivityPage(); }
        if (target.closest('#page-next')) {
            const max = Math.ceil(DashboardState.filteredActivities.length / DashboardState.pagination.itemsPerPage);
            if (DashboardState.pagination.currentPage < max) { DashboardState.pagination.currentPage++; renderActivityPage(); }
        }

        // Sort toggle
        if (target.closest('#activity-sort-toggle')) { DashboardState.filters.sort = DashboardState.filters.sort === 'NEWEST' ? 'OLDEST' : 'NEWEST'; applyFiltersAndRender(); }

        // Filter chips
        const chip = target.closest('.dash-chip');
        if (chip) {
            document.querySelectorAll('.dash-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            DashboardState.filters.type = chip.dataset.filter;
            applyFiltersAndRender();
        }
    });
}

// ============================================================================
// 5. EXPORT
// ============================================================================
export const DashboardPage = {
    async render(isNewPage) {
        renderDashboardLayout();
        detectReferralFromURL();
        updateGlobalMetrics();
        fetchAndProcessActivities();
        updateReferralWidget();

        if (State.isConnected) {
            await updateUserHub(false);
        } else {
            setTimeout(async () => {
                if (State.isConnected) {
                    await updateUserHub(false);
                    updateReferralWidget();
                }
            }, 500);
            setTimeout(async () => {
                if (State.isConnected) {
                    await updateUserHub(false);
                    updateReferralWidget();
                }
            }, 1500);
        }
    },

    update(isConnected) {
        const now = Date.now();
        if (now - DashboardState.lastUpdate > 10000) {
            DashboardState.lastUpdate = now;
            updateGlobalMetrics();
            if (isConnected) {
                updateUserHub(false);
                updateReferralWidget();
            }
            fetchAndProcessActivities();
        }
    }
};
