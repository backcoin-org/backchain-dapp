// pages/ReferralPage.js
// ✅ VERSION V4.0: Tutor System — Mutable, gasless first-time via link

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, ecosystemManagerABI } from '../config.js';
import { NetworkManager } from '../modules/core/index.js';
import { formatAddress } from '../utils.js';

const ethers = window.ethers;

// ============================================================================
// STATE
// ============================================================================
const TS = {
    tutorCount: 0,
    tutor: null,
    tutorLink: '',
    isLoading: false,
    isChangingTutor: false,
};

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('tutor-styles')) return;
    const style = document.createElement('style');
    style.id = 'tutor-styles';
    style.textContent = `
        .tutor-hero-badge {
            animation: tutor-pulse 2s ease-in-out infinite;
        }
        @keyframes tutor-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
            50% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
        }
        .tutor-share-btn {
            transition: all 0.2s ease;
        }
        .tutor-share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .tutor-stat-card {
            background: linear-gradient(135deg, rgba(39,39,42,0.8), rgba(24,24,27,0.9));
            border: 1px solid rgba(63,63,70,0.5);
        }
        .tutor-link-box {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(63,63,70,0.5);
        }
        .tutor-copy-feedback {
            animation: tutor-check 0.3s ease;
        }
        @keyframes tutor-check {
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
async function loadTutorData() {
    if (!State.isConnected || !State.userAddress) return;
    TS.isLoading = true;
    try {
        const provider = NetworkManager.getProvider();
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, provider);
        const [count, tutor] = await Promise.all([
            eco.tutorCount(State.userAddress),
            eco.tutorOf(State.userAddress)
        ]);
        TS.tutorCount = Number(count);
        TS.tutor = tutor !== ethers.ZeroAddress ? tutor : null;
        TS.tutorLink = `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
    } catch (e) {
        console.warn('[Tutor] Load failed:', e.message);
    }
    TS.isLoading = false;
}

// ============================================================================
// RENDER
// ============================================================================
function render(isActive) {
    injectStyles();
    const container = document.getElementById('referral');
    if (!container) return;

    const isConnected = State.isConnected && State.userAddress;

    container.innerHTML = `
        <!-- Hero -->
        <div class="text-center py-8 sm:py-12">
            <div class="tutor-hero-badge inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 mb-5">
                <i class="fa-solid fa-graduation-cap text-amber-400 text-sm"></i>
                <span class="text-amber-400 text-sm font-bold">Tutor System — Earn Forever</span>
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                Be Someone's Tutor,<br class="sm:hidden"> <span class="text-amber-400">Earn 10% Forever</span>
            </h1>
            <p class="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Share your link. When someone connects, you become their <strong class="text-white">tutor automatically</strong> —
                zero gas, zero popups. You earn <strong class="text-white">10% ETH on all fees</strong> + <strong class="text-white">5% BKC on staking rewards</strong>.
            </p>
        </div>

        <!-- Share Card -->
        <div class="max-w-2xl mx-auto mb-8">
            <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 sm:p-6">
                <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-link text-amber-400"></i> Your Tutor Link
                </h2>
                ${isConnected ? `
                    <div class="tutor-link-box flex items-center gap-2 rounded-xl px-4 py-3 mb-4">
                        <span id="tutor-link-text" class="flex-1 text-sm text-zinc-300 truncate font-mono">${TS.tutorLink || `${window.location.origin}/#dashboard?ref=${State.userAddress}`}</span>
                        <button id="tutor-copy-btn" class="shrink-0 text-amber-400 hover:text-amber-300 transition-colors p-1" title="Copy">
                            <i class="fa-solid fa-copy text-lg"></i>
                        </button>
                    </div>
                    <div class="flex flex-wrap justify-center gap-3">
                        <button id="tutor-share-twitter" class="tutor-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#1DA1F2]/20 border border-zinc-600/50 hover:border-[#1DA1F2]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#1DA1F2]">
                            <i class="fa-brands fa-x-twitter"></i> Twitter
                        </button>
                        <button id="tutor-share-telegram" class="tutor-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#0088cc]/20 border border-zinc-600/50 hover:border-[#0088cc]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#0088cc]">
                            <i class="fa-brands fa-telegram"></i> Telegram
                        </button>
                        <button id="tutor-share-whatsapp" class="tutor-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-[#25D366]/20 border border-zinc-600/50 hover:border-[#25D366]/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-[#25D366]">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </button>
                        <button id="tutor-share-native" class="tutor-share-btn flex items-center gap-2 bg-zinc-700/50 hover:bg-amber-500/20 border border-zinc-600/50 hover:border-amber-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 hover:text-amber-400">
                            <i class="fa-solid fa-share-nodes"></i> Share
                        </button>
                    </div>
                ` : `
                    <div class="text-center py-6">
                        <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-3"></i>
                        <p class="text-zinc-400">Connect your wallet to get your tutor link</p>
                    </div>
                `}
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            <div class="tutor-stat-card rounded-2xl p-5 text-center">
                <div class="text-3xl font-extrabold text-amber-400 mb-1" id="tutor-count">${TS.tutorCount}</div>
                <div class="text-sm text-zinc-400">Students</div>
            </div>
            <div class="tutor-stat-card rounded-2xl p-5 text-center">
                <div class="text-lg font-bold text-white mb-1 truncate" id="tutor-current">${TS.tutor ? formatAddress(TS.tutor) : 'None yet'}</div>
                <div class="text-sm text-zinc-400">Your Tutor</div>
            </div>
            <div class="tutor-stat-card rounded-2xl p-5 text-center">
                <div class="text-lg font-bold mb-1 ${TS.tutor ? 'text-green-400' : 'text-zinc-500'}">${TS.tutor ? 'Active' : 'No Tutor'}</div>
                <div class="text-sm text-zinc-400">Tutor Status</div>
            </div>
        </div>

        <!-- Change Tutor Section -->
        ${isConnected ? `
        <div class="max-w-2xl mx-auto mb-10">
            <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 sm:p-6">
                <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-pen text-amber-400"></i> ${TS.tutor ? 'Change Tutor' : 'Set Your Tutor'}
                </h3>
                <p class="text-zinc-400 text-sm mb-4">
                    ${TS.tutor
                        ? `Your current tutor is <strong class="text-white">${formatAddress(TS.tutor)}</strong>. You can change your tutor by paying a small fee (0.0001 ETH).`
                        : `Enter a tutor address or ask someone for their tutor link. First-time fee: 0.00002 ETH.`}
                </p>
                <div class="flex gap-2">
                    <input id="tutor-address-input" type="text" placeholder="0x... tutor address"
                        class="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-300 font-mono placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none">
                    <button id="tutor-set-btn" class="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                        <i class="fa-solid fa-graduation-cap mr-1"></i> Set
                    </button>
                </div>
                <div id="tutor-set-status" class="mt-3 text-sm" style="display:none"></div>
            </div>
        </div>
        ` : ''}

        <!-- Student Network -->
        ${isConnected && TS.tutorCount > 0 ? `
        <div class="max-w-3xl mx-auto mb-10">
            <div class="rounded-2xl p-5 sm:p-6" style="background:rgba(39,39,42,0.5);border:1px solid rgba(63,63,70,0.5);">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-chart-line" style="color:#f59e0b;"></i> Your Students
                </h3>
                <div id="tutor-student-list" class="space-y-2">
                    <div class="text-center text-zinc-500 text-sm py-4">
                        <div class="loader mx-auto mb-2"></div>
                        Loading students...
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- How It Works -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-6 text-center">How It Works</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div class="text-center relative">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-content mx-auto mb-4">
                        <i class="fa-solid fa-share-nodes text-2xl text-amber-400 mx-auto"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">1. Share Your Link</h3>
                    <p class="text-zinc-400 text-sm">Send your unique tutor link via social media, DMs, or anywhere</p>
                </div>
                <div class="text-center relative">
                    <div class="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-wand-magic-sparkles text-2xl text-purple-400"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">2. Auto-Onboarding</h3>
                    <p class="text-zinc-400 text-sm">Friend clicks your link, connects wallet — you become their tutor automatically + they get free BKC. Zero gas!</p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-coins text-2xl text-green-400"></i>
                    </div>
                    <h3 class="text-white font-bold mb-2">3. Earn Dual Rewards</h3>
                    <p class="text-zinc-400 text-sm">Earn 10% ETH on every fee they pay + 5% BKC on staking claims — for life</p>
                </div>
            </div>
        </div>

        <!-- FAQ -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
            <div class="space-y-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">How much can I earn as a tutor?</h4>
                    <p class="text-zinc-400 text-sm">You earn 10% ETH on every fee your students pay (posts, certifications, badges, etc.) plus 5% BKC on staking reward claims. No limit — the more active students, the more you earn.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">Can I change my tutor?</h4>
                    <p class="text-zinc-400 text-sm">Yes! The tutor system is mutable. First-time tutor costs 0.00002 ETH (or free via link). Changing your tutor costs 0.0001 ETH. Enter the new tutor address above.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">Is this on-chain?</h4>
                    <p class="text-zinc-400 text-sm">Yes. Tutor relationships are stored on the Arbitrum blockchain. The 10% ETH cut is enforced by the Ecosystem contract and the 5% BKC by the StakingPool — no one can revoke it.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">What if I have no tutor?</h4>
                    <p class="text-zinc-400 text-sm">Without a tutor, 10% of your staking rewards are burned instead of going to a tutor. Having a tutor means 5% goes to them and nothing is burned — better for the ecosystem!</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold mb-1">Does my friend need ETH for gas?</h4>
                    <p class="text-zinc-400 text-sm">No! First-time tutor setup via link is 100% gasless. A server-side relayer pays all gas fees. Your friend just clicks, connects, and receives free BKC — zero cost.</p>
                </div>
            </div>
        </div>

        <div class="text-center py-6">
            <p class="text-zinc-500 text-xs">Powered by Backchain Protocol on Arbitrum</p>
        </div>
    `;

    setupEventListeners();

    if (isConnected) {
        loadTutorData().then(() => {
            updateStats();
            loadStudentAddresses();
        });
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateStats() {
    const countEl = document.getElementById('tutor-count');
    const tutorEl = document.getElementById('tutor-current');
    if (countEl) countEl.textContent = TS.tutorCount;
    if (tutorEl) tutorEl.textContent = TS.tutor ? formatAddress(TS.tutor) : 'None yet';
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('referral');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('#tutor-copy-btn')) { copyLink(); return; }
        if (target.closest('#tutor-share-twitter')) { shareTwitter(); return; }
        if (target.closest('#tutor-share-telegram')) { shareTelegram(); return; }
        if (target.closest('#tutor-share-whatsapp')) { shareWhatsApp(); return; }
        if (target.closest('#tutor-share-native')) { shareNative(); return; }
        if (target.closest('#tutor-set-btn')) { handleSetTutor(); return; }
    });
}

// ============================================================================
// SET TUTOR (on-chain, user pays)
// ============================================================================
async function handleSetTutor() {
    const input = document.getElementById('tutor-address-input');
    const statusEl = document.getElementById('tutor-set-status');
    const btn = document.getElementById('tutor-set-btn');
    if (!input || !statusEl || !btn) return;

    const tutorAddr = input.value.trim();
    if (!tutorAddr || !ethers.isAddress(tutorAddr)) {
        statusEl.style.display = '';
        statusEl.innerHTML = '<span class="text-red-400">Invalid address</span>';
        return;
    }
    if (tutorAddr.toLowerCase() === State.userAddress.toLowerCase()) {
        statusEl.style.display = '';
        statusEl.innerHTML = '<span class="text-red-400">Cannot tutor yourself</span>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Setting...';
    statusEl.style.display = '';
    statusEl.innerHTML = '<span class="text-zinc-400">Sending transaction...</span>';

    try {
        const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, signer);

        // Determine fee: first-time or change
        const isFirstTime = !TS.tutor;
        const fee = isFirstTime
            ? await eco.tutorFee()
            : await eco.changeTutorFee();

        const tx = await eco.setTutor(tutorAddr, { value: fee });
        statusEl.innerHTML = '<span class="text-amber-400">Confirming on-chain...</span>';
        await tx.wait();

        TS.tutor = tutorAddr;
        updateStats();
        statusEl.innerHTML = `<span class="text-green-400"><i class="fa-solid fa-check mr-1"></i>Tutor ${isFirstTime ? 'set' : 'changed'} successfully!</span>`;
        input.value = '';
        showToast(`Tutor ${isFirstTime ? 'set' : 'changed'} on-chain!`, 'success');
    } catch (e) {
        console.error('[Tutor] Set failed:', e);
        const msg = e.reason || e.message || 'Transaction failed';
        statusEl.innerHTML = `<span class="text-red-400">${msg.includes('user rejected') ? 'Transaction cancelled' : msg}</span>`;
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-graduation-cap mr-1"></i> Set';
}

// ============================================================================
// SHARE FUNCTIONS
// ============================================================================
function getLink() {
    if (!State.userAddress) return '';
    return `${window.location.origin}/#dashboard?ref=${State.userAddress}`;
}

function getShareText() {
    return `Join Backchain — I'll be your tutor! Stake BKC tokens and earn rewards. Use my link:`;
}

function copyLink() {
    const link = getLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
        showToast('Tutor link copied!', 'success');
        const btn = document.getElementById('tutor-copy-btn');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check text-lg tutor-copy-feedback"></i>';
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
            title: 'Join Backchain — Tutor System',
            text: getShareText(),
            url: link
        }).catch(() => {});
    } else {
        copyLink();
    }
}

// ============================================================================
// STUDENT LIST — Load from events
// ============================================================================
async function loadStudentAddresses() {
    if (!State.isConnected || TS.tutorCount === 0) return;
    try {
        const provider = NetworkManager.getProvider();
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, provider);
        const filter = eco.filters.TutorSet(null, State.userAddress);
        const events = await eco.queryFilter(filter, 0, 'latest');

        const listEl = document.getElementById('tutor-student-list');
        if (!listEl) return;

        if (events.length === 0) {
            listEl.innerHTML = '<p class="text-zinc-500 text-sm text-center py-2">No students yet</p>';
            return;
        }

        listEl.innerHTML = events.map((e, i) => `
            <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:rgba(24,24,27,0.5);">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-sm" style="color:#f59e0b;">#${i + 1}</span>
                    <span class="text-zinc-300 font-mono text-sm">${formatAddress(e.args[0])}</span>
                </div>
                <a href="https://sepolia.arbiscan.io/address/${e.args[0]}" target="_blank" rel="noopener" class="text-zinc-500 hover:text-zinc-300 text-xs">
                    <i class="fa-solid fa-external-link"></i>
                </a>
            </div>
        `).join('');
    } catch (e) {
        console.warn('[Tutor] Failed to load student list:', e.message);
    }
}

// ============================================================================
// LIFECYCLE
// ============================================================================
function update(isConnected) {
    if (isConnected) {
        loadTutorData().then(() => {
            updateStats();
            loadStudentAddresses();
        });
    }
}

function cleanup() {}

// ============================================================================
// EXPORT
// ============================================================================
export const ReferralPage = { render, update, cleanup };
