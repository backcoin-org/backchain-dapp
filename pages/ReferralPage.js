// pages/ReferralPage.js
// ✅ VERSION V1.0: Invite Friends & Earn Referral Rewards

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, ecosystemManagerABI } from '../config.js';
import { NetworkManager, txEngine } from '../modules/core/index.js';
import { formatAddress } from '../utils.js';

const ethers = window.ethers;

// ============================================================================
// STATE
// ============================================================================
const RS = {
    referralCount: 0,
    referrer: null,
    referralLink: '',
    isLoading: false,
    isSettingReferrer: false,
};

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('referral-styles')) return;
    const style = document.createElement('style');
    style.id = 'referral-styles';
    style.textContent = `
        .ref-hero-badge {
            animation: ref-pulse 2s ease-in-out infinite;
        }
        @keyframes ref-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
            50% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
        }
        .ref-step-line::after {
            content: '';
            position: absolute;
            top: 50%;
            right: -50%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, rgba(245,158,11,0.3), transparent);
        }
        .ref-share-btn {
            transition: all 0.2s ease;
        }
        .ref-share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .ref-stat-card {
            background: linear-gradient(135deg, rgba(39,39,42,0.8), rgba(24,24,27,0.9));
            border: 1px solid rgba(63,63,70,0.5);
        }
        .ref-link-box {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .ref-copy-feedback {
            animation: ref-check 0.3s ease;
        }
        @keyframes ref-check {
            0% { transform: scale(0.8); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadReferralData() {
    if (!State.isConnected || !State.userAddress) return;
    RS.isLoading = true;
    try {
        const provider = NetworkManager.getProvider();
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, provider);
        const [count, referrer] = await Promise.all([
            eco.referralCount(State.userAddress),
            eco.referredBy(State.userAddress)
        ]);
        RS.referralCount = Number(count);
        RS.referrer = referrer !== ethers.ZeroAddress ? referrer : null;
        RS.referralLink = `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
    } catch (e) {
        console.warn('[Referral] Load failed:', e.message);
    }
    RS.isLoading = false;
}

// ============================================================================
// RENDER
// ============================================================================
function render(isActive) {
    injectStyles();
    const container = document.getElementById('referral');
    if (!container) return;

    const isConnected = State.isConnected && State.userAddress;
    const shortAddr = isConnected ? formatAddress(State.userAddress) : '...';

    container.innerHTML = `
        <!-- Hero -->
        <div class="text-center py-8 sm:py-12">
            <div class="ref-hero-badge inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 mb-5">
                <i class="fa-solid fa-fire text-amber-400 text-sm"></i>
                <span class="text-amber-400 text-sm font-bold">Airdrop Phase 1 Active</span>
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                Invite Friends,<br class="sm:hidden"> <span class="text-amber-400">Earn 5% Forever</span>
            </h1>
            <p class="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Share your referral link. When your friends stake BKC, you earn <strong class="text-white">5% of every reward</strong> they claim — for life.
            </p>
        </div>

        <!-- Share Card -->
        <div class="max-w-2xl mx-auto mb-8">
            <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 sm:p-6">
                <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-link text-amber-400"></i> Your Referral Link
                </h2>
                ${isConnected ? `
                    <div class="ref-link-box flex items-center gap-2 rounded-xl px-4 py-3 mb-4">
                        <span id="ref-link-text" class="flex-1 text-sm text-zinc-300 truncate font-mono">${RS.referralLink || `${window.location.origin}/#dashboard?ref=${State.userAddress}`}</span>
                        <button id="ref-copy-btn" class="shrink-0 text-amber-400 hover:text-amber-300 transition-colors p-1" title="Copy">
                            <i class="fa-solid fa-copy text-lg"></i>
                        </button>
                    </div>
                    <!-- Social Share Buttons -->
                    <div class="flex flex-wrap justify-center gap-3">
                        <button id="ref-share-twitter" class="ref-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#1DA1F2]/20 border border-zinc-600/50 hover:border-[#1DA1F2]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#1DA1F2]">
                            <i class="fa-brands fa-x-twitter"></i> Twitter
                        </button>
                        <button id="ref-share-telegram" class="ref-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#0088cc]/20 border border-zinc-600/50 hover:border-[#0088cc]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#0088cc]">
                            <i class="fa-brands fa-telegram"></i> Telegram
                        </button>
                        <button id="ref-share-whatsapp" class="ref-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#25D366]/20 border border-zinc-600/50 hover:border-[#25D366]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#25D366]">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </button>
                        <button id="ref-share-native" class="ref-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-amber-500/20 border border-zinc-600/50 hover:border-amber-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-amber-400">
                            <i class="fa-solid fa-share-nodes"></i> Share
                        </button>
                    </div>
                ` : `
                    <div class="text-center py-6">
                        <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-3"></i>
                        <p class="text-zinc-400">Connect your wallet to get your referral link</p>
                    </div>
                `}
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            <div class="ref-stat-card rounded-2xl p-5 text-center">
                <div class="text-3xl font-extrabold text-amber-400 mb-1" id="ref-count">${RS.referralCount}</div>
                <div class="text-sm text-zinc-400">Friends Referred</div>
            </div>
            <div class="ref-stat-card rounded-2xl p-5 text-center">
                <div class="text-lg font-bold text-white mb-1 truncate" id="ref-referrer">${RS.referrer ? formatAddress(RS.referrer) : 'None yet'}</div>
                <div class="text-sm text-zinc-400">Your Referrer</div>
            </div>
            <div class="ref-stat-card rounded-2xl p-5 text-center">
                <div class="text-lg font-bold mb-1 ${RS.referrer ? 'text-green-400' : 'text-zinc-500'}">${RS.referrer ? 'Active' : 'No Referrer'}</div>
                <div class="text-sm text-zinc-400">Referral Status</div>
            </div>
        </div>

        <!-- How It Works -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-6 text-center">How It Works</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div class="text-center relative">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-share-nodes text-2xl text-amber-400"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">1. Share Your Link</h3>
                    <p class="text-zinc-400 text-sm">Send your unique referral link to friends via social media or direct message</p>
                </div>
                <div class="text-center relative">
                    <div class="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-layer-group text-2xl text-purple-400"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">2. Friend Stakes BKC</h3>
                    <p class="text-zinc-400 text-sm">When they connect via your link and delegate BKC to the staking pool</p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-coins text-2xl text-green-400"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">3. Earn 5% Forever</h3>
                    <p class="text-zinc-400 text-sm">Every time they claim staking rewards, 5% is sent directly to your wallet</p>
                </div>
            </div>
        </div>

        <!-- Set Referrer -->
        ${isConnected && !RS.referrer ? `
        <div class="max-w-2xl mx-auto mb-10">
            <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 sm:p-6">
                <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <i class="fa-solid fa-handshake text-purple-400"></i> Got a Referral?
                </h3>
                <p class="text-zinc-400 text-sm mb-4">Enter the wallet address of the person who referred you. This is permanent and cannot be changed.</p>
                <div class="flex flex-col sm:flex-row gap-3">
                    <input id="ref-referrer-input" type="text" placeholder="0x..."
                        class="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500/50" />
                    <button id="ref-set-referrer-btn"
                        class="shrink-0 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-6 py-3 text-sm transition-colors flex items-center justify-center gap-2">
                        <i class="fa-solid fa-link"></i> Set Referrer
                    </button>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- FAQ -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
            <div class="space-y-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">How much can I earn?</h4>
                    <p class="text-zinc-400 text-sm">You earn 5% of every staking reward your referrals claim. There's no limit — the more active referrals you have, the more you earn. Rewards are paid in BKC tokens.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">Is this on-chain?</h4>
                    <p class="text-zinc-400 text-sm">Yes. Referral relationships are stored permanently on the Arbitrum blockchain. The 5% cut is enforced by the StakingPool smart contract — no one can change or revoke it.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">Can I change my referrer?</h4>
                    <p class="text-zinc-400 text-sm">No. Once set, your referrer is permanent. Choose wisely. If no referrer is set, the 5% goes to the project treasury.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">What if no one uses my link?</h4>
                    <p class="text-zinc-400 text-sm">Your link stays active forever. Even if someone uses it months from now, you'll start earning from their staking rewards.</p>
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div class="text-center py-6">
            <p class="text-zinc-500 text-xs">Powered by Backchain Protocol on Arbitrum</p>
        </div>
    `;

    setupEventListeners();

    if (isConnected) {
        loadReferralData().then(updateStats);
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateStats() {
    const countEl = document.getElementById('ref-count');
    const referrerEl = document.getElementById('ref-referrer');
    if (countEl) countEl.textContent = RS.referralCount;
    if (referrerEl) referrerEl.textContent = RS.referrer ? formatAddress(RS.referrer) : 'None yet';
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('referral');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target;

        // Copy link
        if (target.closest('#ref-copy-btn')) {
            copyLink();
            return;
        }
        // Twitter/X share
        if (target.closest('#ref-share-twitter')) {
            shareTwitter();
            return;
        }
        // Telegram share
        if (target.closest('#ref-share-telegram')) {
            shareTelegram();
            return;
        }
        // WhatsApp share
        if (target.closest('#ref-share-whatsapp')) {
            shareWhatsApp();
            return;
        }
        // Native share
        if (target.closest('#ref-share-native')) {
            shareNative();
            return;
        }
        // Set referrer
        if (target.closest('#ref-set-referrer-btn')) {
            setReferrer();
            return;
        }
    });
}

// ============================================================================
// SHARE FUNCTIONS
// ============================================================================
function getLink() {
    if (!State.userAddress) return '';
    return `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
}

function getShareText() {
    return `Join Backchain and earn passive income! Stake BKC tokens and get rewards. Use my referral link:`;
}

function copyLink() {
    const link = getLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
        showToast('Referral link copied!', 'success');
        const btn = document.getElementById('ref-copy-btn');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check text-lg ref-copy-feedback"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy text-lg"></i>'; }, 2000);
        }
    }).catch(() => showToast('Failed to copy', 'error'));
}

function shareTwitter() {
    const link = getLink();
    if (!link) return;
    const text = encodeURIComponent(`${getShareText()} ${link}\n\n#Backchain #BKC #DeFi #Arbitrum`);
    window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
}

function shareTelegram() {
    const link = getLink();
    if (!link) return;
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(link);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

function shareWhatsApp() {
    const link = getLink();
    if (!link) return;
    const text = encodeURIComponent(`${getShareText()} ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareNative() {
    const link = getLink();
    if (!link) return;
    if (navigator.share) {
        navigator.share({
            title: 'Join Backchain',
            text: getShareText(),
            url: link
        }).catch(() => {});
    } else {
        copyLink();
    }
}

// ============================================================================
// SET REFERRER
// ============================================================================
async function setReferrer() {
    if (RS.isSettingReferrer) return;
    const input = document.getElementById('ref-referrer-input');
    const btn = document.getElementById('ref-set-referrer-btn');
    if (!input || !btn) return;

    const address = input.value.trim();
    if (!address || !ethers.isAddress(address)) {
        showToast('Enter a valid wallet address', 'error');
        return;
    }
    if (address.toLowerCase() === State.userAddress.toLowerCase()) {
        showToast('You cannot refer yourself', 'error');
        return;
    }

    RS.isSettingReferrer = true;
    await txEngine.execute({
        contract: State.ecosystemManagerContract,
        method: 'setReferrer',
        args: () => [address],
        description: 'Set Referrer',
        skipSimulation: true,
        fixedGasLimit: 100000n,
        button: btn,
        onSuccess: () => {
            RS.isSettingReferrer = false;
            showToast('Referrer set! They will earn 5% of your staking rewards.', 'success');
            render(true); // Re-render to hide the set-referrer section
        },
        onError: (err) => {
            RS.isSettingReferrer = false;
            console.error('[Referral] Set referrer failed:', err);
        }
    });
}

// ============================================================================
// LIFECYCLE
// ============================================================================
function update(isConnected) {
    if (isConnected) {
        loadReferralData().then(updateStats);
    }
}

function cleanup() {}

// ============================================================================
// EXPORT
// ============================================================================
export const ReferralPage = { render, update, cleanup };
