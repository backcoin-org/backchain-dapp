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
        <div class="max-w-3xl mx-auto px-4 pb-24">

        <!-- Hero -->
        <div class="text-center py-8 sm:py-12">
            <div class="tutor-hero-badge inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 mb-5">
                <i class="fa-solid fa-graduation-cap text-amber-400 text-sm"></i>
                <span class="text-amber-400 text-sm font-bold">Tutor System</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Invite Friends,<br class="sm:hidden"> <span class="text-amber-400">Earn Forever</span>
            </h1>
            <p class="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Every user has one <strong class="text-white">tutor</strong>. When your friend uses the protocol,
                you automatically earn a cut of their fees — <strong class="text-amber-400">forever</strong>, enforced by smart contracts.
            </p>
        </div>

        <!-- Share Card -->
        <div class="mb-8">
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
        <div class="grid grid-cols-3 gap-3 mb-8">
            <div class="tutor-stat-card rounded-2xl p-4 text-center">
                <div class="text-2xl font-extrabold text-amber-400 mb-1" id="tutor-count">${TS.tutorCount}</div>
                <div class="text-xs text-zinc-400">Students</div>
            </div>
            <div class="tutor-stat-card rounded-2xl p-4 text-center">
                <div class="text-sm font-bold text-white mb-1 truncate" id="tutor-current">${TS.tutor ? formatAddress(TS.tutor) : 'None yet'}</div>
                <div class="text-xs text-zinc-400">Your Tutor</div>
            </div>
            <div class="tutor-stat-card rounded-2xl p-4 text-center">
                <div class="text-sm font-bold mb-1 ${TS.tutor ? 'text-green-400' : 'text-zinc-500'}">${TS.tutor ? 'Active' : 'No Tutor'}</div>
                <div class="text-xs text-zinc-400">Status</div>
            </div>
        </div>

        <!-- ====== HOW IT WORKS — Visual Steps ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-route text-purple-400"></i> How It Works
            </h2>
            <div class="space-y-3">
                <div class="flex items-start gap-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <span class="text-amber-400 font-black text-sm">1</span>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Share your link</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Send your unique URL to friends via social media, DMs, or anywhere. Your wallet address is embedded in the link.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <span class="text-purple-400 font-black text-sm">2</span>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Friend connects wallet</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">When they click your link and connect MetaMask, our <strong class="text-zinc-300">server-side relayer</strong> automatically registers you as their tutor on-chain. <strong class="text-green-400">Zero gas for both of you.</strong></p>
                    </div>
                </div>
                <div class="flex items-start gap-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <span class="text-cyan-400 font-black text-sm">3</span>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Friend gets welcome bonus</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Your friend receives <strong class="text-amber-400">free BKC tokens</strong> immediately as a welcome bonus + free testnet ETH from the faucet to start using the platform.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4 bg-gradient-to-r from-amber-900/20 to-zinc-800/40 border border-amber-500/30 rounded-xl p-4">
                    <div class="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                        <span class="text-green-400 font-black text-sm">4</span>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">You earn rewards — forever</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Every time your student pays any ETH fee on the platform, you earn <strong class="text-amber-400">10%</strong>. When they claim staking rewards, you earn <strong class="text-amber-400">5% BKC</strong>. This is <strong class="text-white">permanent and on-chain</strong> — no one can revoke it.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== DUAL REWARDS EXPLAINED ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-coins text-amber-400"></i> What You Earn
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <!-- ETH Reward -->
                <div class="bg-zinc-800/40 border border-blue-500/30 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                            <i class="fa-brands fa-ethereum text-blue-400"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm">10% ETH</p>
                            <p class="text-zinc-500 text-[10px]">On all protocol fees</p>
                        </div>
                    </div>
                    <p class="text-zinc-400 text-xs mb-3">Every ETH fee your student pays — Fortune bets, Notary certifications, NFT trades, Agora badges, post boosts — <strong class="text-white">10% goes directly to you</strong>.</p>
                    <div class="bg-black/30 rounded-lg p-3">
                        <p class="text-zinc-500 text-[10px] uppercase mb-2">Example</p>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between"><span class="text-zinc-400">Student certifies a document</span><span class="text-zinc-300">0.0005 ETH</span></div>
                            <div class="flex justify-between"><span class="text-zinc-400">Student plays Fortune Tier 1</span><span class="text-zinc-300">0.0005 ETH</span></div>
                            <div class="flex justify-between"><span class="text-zinc-400">Student buys verified badge</span><span class="text-zinc-300">0.02 ETH</span></div>
                            <div class="border-t border-zinc-700 my-1.5"></div>
                            <div class="flex justify-between"><span class="text-zinc-300 font-bold">Total fees</span><span class="text-zinc-300 font-bold">0.021 ETH</span></div>
                            <div class="flex justify-between"><span class="text-amber-400 font-bold">Your 10% cut</span><span class="text-amber-400 font-bold">0.0021 ETH</span></div>
                        </div>
                    </div>
                </div>
                <!-- BKC Reward -->
                <div class="bg-zinc-800/40 border border-purple-500/30 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                            <i class="fa-solid fa-lock text-purple-400"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm">5% BKC</p>
                            <p class="text-zinc-500 text-[10px]">On staking reward claims</p>
                        </div>
                    </div>
                    <p class="text-zinc-400 text-xs mb-3">When your student stakes BKC and claims mining rewards from the BuybackMiner, <strong class="text-white">5% of their claim goes to you</strong> in BKC tokens.</p>
                    <div class="bg-black/30 rounded-lg p-3">
                        <p class="text-zinc-500 text-[10px] uppercase mb-2">Example</p>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between"><span class="text-zinc-400">Student claims rewards</span><span class="text-zinc-300">100 BKC</span></div>
                            <div class="border-t border-zinc-700 my-1.5"></div>
                            <div class="flex justify-between"><span class="text-purple-400 font-bold">Your 5% cut</span><span class="text-purple-400 font-bold">5 BKC</span></div>
                            <div class="flex justify-between"><span class="text-zinc-400">Student receives</span><span class="text-zinc-300">95 BKC</span></div>
                        </div>
                        <p class="text-zinc-600 text-[10px] mt-2">* NFT burn rate applied before tutor cut</p>
                    </div>
                </div>
            </div>
            <div class="text-center">
                <p class="text-zinc-500 text-xs"><i class="fa-solid fa-infinity text-amber-400 mr-1"></i> Both reward streams are <strong class="text-zinc-300">permanent</strong> — they continue as long as your student uses the protocol</p>
            </div>
        </div>

        <!-- ====== WITH vs WITHOUT TUTOR ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-scale-balanced text-cyan-400"></i> Why Have a Tutor?
            </h2>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fa-solid fa-xmark text-red-400"></i>
                        <p class="text-red-400 font-bold text-sm">No Tutor</p>
                    </div>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-fire text-red-400 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-400"><strong class="text-red-300">10% of staking rewards burned</strong> — destroyed permanently</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-ban text-zinc-600 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-500">No welcome BKC bonus</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-ban text-zinc-600 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-500">No one benefits from your activity</span>
                        </div>
                    </div>
                </div>
                <div class="bg-green-900/10 border border-green-500/20 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fa-solid fa-check text-green-400"></i>
                        <p class="text-green-400 font-bold text-sm">With Tutor</p>
                    </div>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-hand-holding-heart text-green-400 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-400"><strong class="text-green-300">5% to tutor, 0% burned</strong> — better for the ecosystem</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-gift text-amber-400 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-400"><strong class="text-amber-300">Free BKC welcome bonus</strong></span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-users text-cyan-400 mt-0.5 text-[10px]"></i>
                            <span class="text-zinc-400">Your tutor earns rewards from your activity</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== FEE FLOW DIAGRAM ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-emerald-400"></i> Fee Flow
            </h2>
            <div class="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                <div class="space-y-3">
                    <!-- Step 1 -->
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-user text-blue-400 text-xs"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium">Student pays ETH fee</p>
                            <p class="text-zinc-500 text-[10px]">Any on-chain action: Fortune, Notary, Agora, NFT, etc.</p>
                        </div>
                    </div>
                    <div class="ml-4 border-l-2 border-zinc-700 pl-6 py-1">
                        <i class="fa-solid fa-arrow-down text-zinc-600 text-xs"></i>
                    </div>
                    <!-- Step 2 -->
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-graduation-cap text-amber-400 text-xs"></i>
                        </div>
                        <div class="flex-1 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                            <p class="text-amber-400 text-sm font-bold">10% to Tutor (you)</p>
                            <p class="text-zinc-500 text-[10px]">Deducted first, before any other split</p>
                        </div>
                    </div>
                    <div class="ml-4 border-l-2 border-zinc-700 pl-6 py-1">
                        <i class="fa-solid fa-arrow-down text-zinc-600 text-xs"></i>
                    </div>
                    <!-- Step 3 -->
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-arrows-split-up-and-left text-zinc-400 text-xs"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white text-sm font-medium">Remaining 90% distributed</p>
                            <div class="flex flex-wrap gap-2 mt-1">
                                <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Buyback</span>
                                <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">Treasury</span>
                                <span class="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Operator</span>
                                <span class="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Creator</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== CHANGE / SET TUTOR ====== -->
        ${isConnected ? `
        <div class="mb-8">
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
        <div class="mb-8">
            <div class="rounded-2xl p-5 sm:p-6" style="background:rgba(39,39,42,0.5);border:1px solid rgba(63,63,70,0.5);">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-users" style="color:#f59e0b;"></i> Your Students
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

        <!-- ====== ON-CHAIN GUARANTEES ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-shield-halved text-green-400"></i> On-Chain Guarantees
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-lock text-green-400 text-xs"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Immutable contract</p>
                        <p class="text-zinc-400 text-xs">The Ecosystem contract has no admin function to remove tutor rewards. Your earnings are guaranteed by code.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-clock text-blue-400 text-xs"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">No expiration</p>
                        <p class="text-zinc-400 text-xs">Tutor relationships have no time limit. You earn for as long as the protocol exists and your student is active.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-wallet text-amber-400 text-xs"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Gasless onboarding</p>
                        <p class="text-zinc-400 text-xs">First-time tutor setup via link costs nothing. A server relayer pays the gas. Your friend doesn't even need ETH.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-repeat text-purple-400 text-xs"></i>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Mutable by student</p>
                        <p class="text-zinc-400 text-xs">Students can change their tutor by paying 0.0001 ETH. This keeps tutors motivated to help their students.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== FAQ ====== -->
        <div class="mb-8">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <i class="fa-solid fa-circle-question text-zinc-400"></i> FAQ
            </h2>
            <div class="space-y-2">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold text-sm mb-1">Which actions generate tutor rewards?</h4>
                    <p class="text-zinc-400 text-xs">Every action that charges an ETH fee: Fortune Pool bets, Notary certifications, Agora badges/boosts, NFT purchases, Charity donations, and more. The tutor cut (10%) is taken off-the-top before any other split.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold text-sm mb-1">How do I withdraw my earnings?</h4>
                    <p class="text-zinc-400 text-xs">ETH rewards accumulate in the Ecosystem contract under your address. You can withdraw anytime via the Dashboard. BKC rewards from staking claims are sent directly to your wallet.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold text-sm mb-1">Is there a limit on students?</h4>
                    <p class="text-zinc-400 text-xs">No. You can have unlimited students. Each student independently generates rewards for you. The more students you onboard, the more you earn.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold text-sm mb-1">Can students change their tutor?</h4>
                    <p class="text-zinc-400 text-xs">Yes. Students can change their tutor by paying 0.0001 ETH. This means you should actively help your students — if you're a good tutor, they'll stay with you.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <h4 class="text-white font-semibold text-sm mb-1">What's the welcome BKC bonus?</h4>
                    <p class="text-zinc-400 text-xs">When a new user sets their first tutor (via link or manually), they receive free BKC tokens from the tutor bonus pool. This incentivizes new user onboarding.</p>
                </div>
            </div>
        </div>

        <div class="text-center py-6">
            <p class="text-zinc-600 text-xs">Tutor relationships are stored on-chain at <a href="https://sepolia.arbiscan.io/address/${addresses.backchainEcosystem}" target="_blank" class="text-zinc-500 hover:text-amber-400 transition-colors">BackchainEcosystem</a></p>
        </div>

        </div><!-- max-w-3xl wrapper -->
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
