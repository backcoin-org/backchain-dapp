// pages/OperatorPage.js
// ✅ VERSION V2.0: Build on Backchain, Earn Perpetual Commissions

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, ecosystemManagerABI } from '../config.js';
import { NetworkManager, txEngine, getOperator, setOperator, clearOperator, hasOperator, getOperatorInfo, shortAddress } from '../modules/core/index.js';
import { formatBigNumber } from '../utils.js';

const ethers = window.ethers;

// ============================================================================
// STATE
// ============================================================================
const OS = {
    pendingEth: 0n,
    modules: [],
    currentOperator: null,
    isLoading: false,
    isWithdrawing: false,
};

// ============================================================================
// MODULE NAMES (lazy — ethers not available at import time)
// ============================================================================
let _moduleNames = null;
function getModuleNames() {
    if (_moduleNames) return _moduleNames;
    const e = window.ethers;
    _moduleNames = {
        [e.id("STAKING")]:  { name: 'Staking',       icon: 'fa-layer-group',        color: 'text-purple-400',  bg: 'bg-purple-500/10' },
        [e.id("NFT_POOL")]: { name: 'NFT Market',     icon: 'fa-store',              color: 'text-pink-400',    bg: 'bg-pink-500/10' },
        [e.id("FORTUNE")]:  { name: 'Fortune Pool',    icon: 'fa-dice',               color: 'text-green-400',   bg: 'bg-green-500/10' },
        [e.id("AGORA")]:    { name: 'Agora',           icon: 'fa-landmark',           color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
        [e.id("NOTARY")]:   { name: 'Notary',          icon: 'fa-stamp',              color: 'text-slate-400',   bg: 'bg-slate-500/10' },
        [e.id("CHARITY")]:  { name: 'Charity',         icon: 'fa-hand-holding-heart', color: 'text-red-400',     bg: 'bg-red-500/10' },
        [e.id("RENTAL")]:   { name: 'Rental Market',   icon: 'fa-rocket',             color: 'text-teal-400',    bg: 'bg-teal-500/10' },
    };
    return _moduleNames;
}

// ============================================================================
// STYLES
// ============================================================================
function injectStyles() {
    if (document.getElementById('operator-styles')) return;
    const style = document.createElement('style');
    style.id = 'operator-styles';
    style.textContent = `
        .op-hero-badge {
            animation: op-glow 2s ease-in-out infinite;
        }
        @keyframes op-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        }
        .op-earnings-card {
            background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,78,59,0.15));
            border: 1px solid rgba(16,185,129,0.2);
        }
        .op-module-row {
            transition: background-color 0.15s ease;
        }
        .op-module-row:hover {
            background-color: rgba(255,255,255,0.03);
        }
        .op-code-block {
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(63,63,70,0.5);
            font-family: 'Fira Code', 'Cascadia Code', monospace;
        }
        .op-code-block code {
            color: #a78bfa;
        }
        .op-code-block .op-string { color: #4ade80; }
        .op-code-block .op-comment { color: #71717a; }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadOperatorData() {
    OS.isLoading = true;
    try {
        const provider = NetworkManager.getProvider();
        const eco = new ethers.Contract(addresses.backchainEcosystem, ecosystemManagerABI, provider);

        // Pending ETH for connected user
        if (State.isConnected && State.userAddress) {
            OS.pendingEth = await eco.pendingEth(State.userAddress);
        }

        // Module configs — read known IDs directly (no enumeration needed)
        const moduleNames = getModuleNames();
        const ids = Object.keys(moduleNames);
        const configs = await Promise.all(ids.map(id => eco.getModuleConfig(id)));
        OS.modules = ids.map((id, i) => ({
            ...moduleNames[id],
            moduleId: id,
            operatorBps: Number(configs[i].operatorBps),
            treasuryBps: Number(configs[i].treasuryBps),
            buybackBps: Number(configs[i].buybackBps),
            customBps: Number(configs[i].customBps),
            active: configs[i].active
        })).filter(m => m.active);

        // Current operator info
        OS.currentOperator = getOperatorInfo();
    } catch (e) {
        console.warn('[Operator] Load failed:', e.message);
    }
    OS.isLoading = false;
}

// ============================================================================
// RENDER
// ============================================================================
function render(isActive) {
    injectStyles();
    const container = document.getElementById('operator');
    if (!container) return;

    const isConnected = State.isConnected && State.userAddress;
    const pendingFormatted = OS.pendingEth > 0n ? ethers.formatEther(OS.pendingEth) : '0.0';
    const opInfo = getOperatorInfo();

    container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 pb-24">

        <!-- Hero -->
        <div class="text-center py-8 sm:py-12">
            <div class="op-hero-badge inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-5 py-2 mb-5">
                <i class="fa-solid fa-code text-emerald-400 text-sm"></i>
                <span class="text-emerald-400 text-sm font-bold">Permissionless Developer Program</span>
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                Build on Backchain,<br class="sm:hidden"> <span class="text-emerald-400">Earn Forever</span>
            </h1>
            <p class="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-6">
                Create your own frontend, bot, or integration. Every fee generated through your app sends <strong class="text-white">10-20% directly to your wallet</strong> — with no registration, no approval, and no middleman.
            </p>
            <div class="flex flex-wrap justify-center gap-3 text-xs">
                <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-300"><i class="fa-solid fa-infinity text-emerald-400 mr-1.5"></i>Perpetual revenue</span>
                <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-300"><i class="fa-solid fa-lock-open text-emerald-400 mr-1.5"></i>No registration</span>
                <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-300"><i class="fa-solid fa-file-contract text-emerald-400 mr-1.5"></i>On-chain guarantee</span>
            </div>
        </div>

        <!-- Earnings Dashboard -->
        ${isConnected ? `
        <div class="op-earnings-card rounded-2xl p-6 mb-10">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-center sm:text-left">
                    <p class="text-emerald-400/80 text-sm font-medium mb-1">Your Pending Earnings</p>
                    <p class="text-3xl sm:text-4xl font-extrabold text-white" id="op-pending">${pendingFormatted} <span class="text-lg text-zinc-400">BNB</span></p>
                </div>
                <button id="op-withdraw-btn"
                    class="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl px-6 py-3 text-sm transition-colors flex items-center gap-2"
                    ${OS.pendingEth === 0n ? 'disabled' : ''}>
                    <i class="fa-solid fa-wallet"></i> Withdraw BNB
                </button>
            </div>
        </div>
        ` : `
        <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-6 mb-10 text-center">
            <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-3"></i>
            <p class="text-zinc-400">Connect your wallet to see your operator earnings</p>
        </div>
        `}

        <!-- What is an Operator? -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-2">What is a Backchain Operator?</h2>
            <p class="text-zinc-400 text-sm leading-relaxed mb-4">
                An Operator is any developer who builds an application on top of the Backchain protocol. By embedding your wallet address as the <code class="text-emerald-400 bg-zinc-800/60 px-1.5 py-0.5 rounded text-xs">operator</code> parameter in transactions, the smart contract automatically routes a percentage of every fee to you.
            </p>
            <p class="text-zinc-400 text-sm leading-relaxed">
                Think of it like an affiliate program — except it's <strong class="text-white">enforced by smart contract</strong>, not by a company. There's no signup form, no API key, and no way for anyone to revoke your earnings. If your app generates fees, you get paid. Period.
            </p>
        </div>

        <!-- How It Works — Detailed -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-6">How It Works</h2>
            <div class="space-y-4">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 flex gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-code text-xl text-emerald-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">1. Build Your Application</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Create a custom frontend, trading bot, Telegram bot, Discord integration, mobile app — anything that interacts with Backchain smart contracts. Set your wallet address as the <code class="text-emerald-400 bg-zinc-800/60 px-1 py-0.5 rounded">operator</code> in one line of code.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 flex gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-users text-xl text-blue-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">2. Users Interact Through Your App</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Users stake BKC, buy NFTs, play Fortune Pool, certify documents, trade on Agora — any protocol action. Each action has a fee (gas-based or value-based), and your operator address travels with the transaction.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 flex gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-sitemap text-xl text-amber-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">3. Smart Contract Splits the Fee</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">The <code class="text-emerald-400 bg-zinc-800/60 px-1 py-0.5 rounded">BackchainEcosystem</code> contract receives every fee and splits it automatically: Operator share (10-20%), Buyback & Burn, Treasury, and module-specific pools. The split is per-module, immutable, and verifiable on-chain.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 flex gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-vault text-xl text-green-400"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">4. BNB Accumulates in Your Balance</h3>
                        <p class="text-zinc-400 text-xs leading-relaxed">Your operator BNB earnings are stored on-chain in <code class="text-emerald-400 bg-zinc-800/60 px-1 py-0.5 rounded">pendingEth[yourAddress]</code>. Withdraw anytime by calling <code class="text-emerald-400 bg-zinc-800/60 px-1 py-0.5 rounded">withdrawEth()</code> — no minimum, no cooldown, no admin approval.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fee Flow Diagram -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-4">Fee Flow</h2>
            <p class="text-zinc-400 text-sm mb-4">Every protocol action generates a fee. Here's where that fee goes:</p>
            <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5 space-y-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-user text-blue-400 text-sm"></i>
                    </div>
                    <div class="flex-1 text-sm text-white font-medium">User pays fee (BNB)</div>
                </div>
                <div class="ml-5 border-l-2 border-zinc-700 pl-5 py-1 text-xs text-zinc-500">
                    <i class="fa-solid fa-arrow-down mr-1"></i> Fee sent to BackchainEcosystem contract
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                        <p class="text-emerald-400 text-lg font-extrabold">10-20%</p>
                        <p class="text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider">Operator</p>
                        <p class="text-zinc-500 text-[10px]">Your wallet</p>
                    </div>
                    <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                        <p class="text-amber-400 text-lg font-extrabold">30-50%</p>
                        <p class="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">Buyback</p>
                        <p class="text-zinc-500 text-[10px]">Buy + burn BKC</p>
                    </div>
                    <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
                        <p class="text-purple-400 text-lg font-extrabold">10-30%</p>
                        <p class="text-purple-400/80 text-[10px] font-bold uppercase tracking-wider">Treasury</p>
                        <p class="text-zinc-500 text-[10px]">Protocol growth</p>
                    </div>
                    <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
                        <p class="text-cyan-400 text-lg font-extrabold">10-30%</p>
                        <p class="text-cyan-400/80 text-[10px] font-bold uppercase tracking-wider">Custom</p>
                        <p class="text-zinc-500 text-[10px]">Module-specific</p>
                    </div>
                </div>
                <p class="text-zinc-500 text-[11px] text-center pt-1">Exact percentages vary by module — see Commission Rates below</p>
            </div>
        </div>

        <!-- Concrete Earning Examples -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-4">Earning Examples</h2>
            <p class="text-zinc-400 text-sm mb-4">Here's what you'd earn from real transactions through your app:</p>
            <div class="space-y-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-layer-group text-purple-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">User stakes 10,000 BKC</p>
                            <p class="text-zinc-500 text-xs">Staking fee: ~0.005 BNB</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-emerald-400 font-bold">+0.001 BNB</p>
                        <p class="text-zinc-500 text-[10px]">20% operator</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-9 h-9 bg-pink-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-store text-pink-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">User buys a Gold NFT</p>
                            <p class="text-zinc-500 text-xs">NFT price: ~0.03 BNB</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-emerald-400 font-bold">+0.003 BNB</p>
                        <p class="text-zinc-500 text-[10px]">10% operator</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-dice text-green-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">User plays Fortune Pool Tier 2</p>
                            <p class="text-zinc-500 text-xs">Entry: 0.05 BNB</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-emerald-400 font-bold">+0.005 BNB</p>
                        <p class="text-zinc-500 text-[10px]">10% operator</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-9 h-9 bg-slate-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-stamp text-slate-400 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white text-sm font-medium">User certifies a document</p>
                            <p class="text-zinc-500 text-xs">Notary fee: ~0.002 BNB</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-emerald-400 font-bold">+0.0004 BNB</p>
                        <p class="text-zinc-500 text-[10px]">20% operator</p>
                    </div>
                </div>
            </div>
            <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mt-4 text-center">
                <p class="text-zinc-400 text-xs">If your app processes <strong class="text-white">100 transactions/day</strong> averaging 0.01 BNB in fees:</p>
                <p class="text-emerald-400 text-2xl font-extrabold mt-1">~0.15 BNB/day</p>
                <p class="text-zinc-500 text-xs mt-1">~4.5 BNB/month at 15% average operator rate</p>
            </div>
        </div>

        <!-- What You Can Build -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-4">What You Can Build</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-globe text-blue-400"></i>
                        <h3 class="text-white font-bold text-sm">Custom Frontend</h3>
                    </div>
                    <p class="text-zinc-500 text-xs leading-relaxed">Build your own version of backcoin.org with a different UI, different language, or specialized features for your community. All protocol actions earn you operator fees.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-brands fa-telegram text-sky-400"></i>
                        <h3 class="text-white font-bold text-sm">Telegram / Discord Bot</h3>
                    </div>
                    <p class="text-zinc-500 text-xs leading-relaxed">Let users stake, play Fortune Pool, or buy NFTs directly from chat. Every action includes your operator address and routes commissions to your wallet.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-robot text-amber-400"></i>
                        <h3 class="text-white font-bold text-sm">Trading / Automation Bot</h3>
                    </div>
                    <p class="text-zinc-500 text-xs leading-relaxed">Automated staking strategies, NFT arbitrage, or yield optimization. Users opt-in, your bot executes, and you earn fees on every automated transaction.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-mobile-screen text-green-400"></i>
                        <h3 class="text-white font-bold text-sm">Mobile App / PWA</h3>
                    </div>
                    <p class="text-zinc-500 text-xs leading-relaxed">Build a mobile-first experience using WalletConnect or embedded wallets. Same protocol, same fees, same commissions — just a better mobile UX.</p>
                </div>
            </div>
        </div>

        <!-- Commission Rates (Live from Contract) -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-2">Commission Rates</h2>
            <p class="text-zinc-400 text-sm mb-5">Live data from the <code class="text-emerald-400 bg-zinc-800/60 px-1.5 py-0.5 rounded text-xs">BackchainEcosystem</code> contract. Each module has its own fee distribution.</p>
            <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl overflow-hidden">
                <div class="grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-700/30 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Module</span>
                    <span class="text-center">Operator %</span>
                    <span class="text-right">Full Split</span>
                </div>
                <div id="op-modules-list">
                    ${OS.modules.length > 0 ? OS.modules.map(m => `
                        <div class="op-module-row grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-700/20 items-center">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center shrink-0">
                                    <i class="fa-solid ${m.icon} ${m.color} text-sm"></i>
                                </div>
                                <span class="text-white text-sm font-medium">${m.name}</span>
                            </div>
                            <div class="text-center">
                                <span class="text-emerald-400 font-bold text-lg">${(m.operatorBps / 100).toFixed(0)}%</span>
                            </div>
                            <div class="text-right text-xs text-zinc-500 space-y-0.5">
                                <div>Custom ${(m.customBps / 100).toFixed(0)}%</div>
                                <div>Treasury ${(m.treasuryBps / 100).toFixed(0)}%</div>
                                <div>Buyback ${(m.buybackBps / 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="px-4 py-8 text-center text-zinc-500">
                            <i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading module data...
                        </div>
                    `}
                </div>
            </div>
            <p class="text-zinc-600 text-[11px] mt-2 text-center">No operator = operator share is burned (sent to 0x0 dead address)</p>
        </div>

        <!-- On-Chain Guarantees -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-4">On-Chain Guarantees</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-3">
                    <i class="fa-solid fa-lock-open text-emerald-400 text-lg mt-0.5"></i>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Permissionless</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">No registration, no API key, no approval process. Any Ethereum address can be an operator. Just set it and start earning.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-3">
                    <i class="fa-solid fa-file-shield text-emerald-400 text-lg mt-0.5"></i>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Immutable Commissions</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">Fee percentages are set in the smart contract. No admin can change your commission rate or divert your earnings. Code is law.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-3">
                    <i class="fa-solid fa-clock text-emerald-400 text-lg mt-0.5"></i>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">No Expiration</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">No time limit on earnings. As long as the Backchain protocol exists on Arbitrum, your operator commissions will keep accumulating.</p>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 flex gap-3">
                    <i class="fa-solid fa-money-bill-transfer text-emerald-400 text-lg mt-0.5"></i>
                    <div>
                        <h3 class="text-white font-bold text-sm mb-1">Instant Withdrawal</h3>
                        <p class="text-zinc-500 text-xs leading-relaxed">Withdraw BNB earnings anytime. No minimum amount, no cooldown period, no vesting. One transaction and it's in your wallet.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Integration Guide -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-2">Integration Guide</h2>
            <p class="text-zinc-400 text-sm mb-5">Three ways to set your operator address. Choose the one that fits your setup.</p>
            <div class="space-y-4">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-1 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                        Global Variable (recommended for custom frontends)
                    </h3>
                    <p class="text-zinc-400 text-xs mb-3">Set before loading any Backchain modules. Works for full custom frontends.</p>
                    <div class="op-code-block rounded-xl px-4 py-3 text-sm overflow-x-auto">
                        <code><span class="op-comment">// Add this BEFORE importing Backchain modules</span>
window.BACKCHAIN_OPERATOR = <span class="op-string">"0xYOUR_WALLET"</span>;

<span class="op-comment">// Then import and use the protocol normally</span>
<span class="op-comment">// All transactions will include your operator address</span></code>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-1 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                        localStorage (for dynamic / runtime configuration)
                    </h3>
                    <p class="text-zinc-400 text-xs mb-3">Good for bots and apps that configure operator at runtime.</p>
                    <div class="op-code-block rounded-xl px-4 py-3 text-sm overflow-x-auto">
                        <code>localStorage.setItem(<span class="op-string">'bkc_operator'</span>, <span class="op-string">'0xYOUR_WALLET'</span>);

<span class="op-comment">// To verify it's active:</span>
console.log(localStorage.getItem(<span class="op-string">'bkc_operator'</span>));</code>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-1 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                        Per-Transaction (for bots and advanced integrations)
                    </h3>
                    <p class="text-zinc-400 text-xs mb-3">Pass operator directly in each contract call for maximum control.</p>
                    <div class="op-code-block rounded-xl px-4 py-3 text-sm overflow-x-auto">
                        <code><span class="op-comment">// Every Backchain contract function accepts an operator parameter</span>
<span class="op-comment">// Example: staking with operator</span>
stakingPool.delegate(amount, lockDays, <span class="op-string">OPERATOR_ADDR</span>);

<span class="op-comment">// Example: buying NFT with operator</span>
nftPool.buy(tier, quantity, <span class="op-string">OPERATOR_ADDR</span>, { value: price });</code>
                    </div>
                </div>
            </div>
        </div>

        <!-- SDK Coming Soon -->
        <div class="mb-10">
            <div class="bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4">
                    <i class="fa-solid fa-flask text-emerald-400 text-xs"></i>
                    <span class="text-emerald-400 text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Backchain Developer SDK</h2>
                <p class="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed mb-4">
                    We're building an official SDK to make integration even easier. Pre-built components, TypeScript types, React hooks, and ready-to-use transaction helpers — so you can build on Backchain in minutes, not days.
                </p>
                <div class="flex flex-wrap justify-center gap-2 text-xs">
                    <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-400"><i class="fa-brands fa-npm text-red-400 mr-1"></i>npm package</span>
                    <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-400"><i class="fa-brands fa-js text-yellow-400 mr-1"></i>TypeScript</span>
                    <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-400"><i class="fa-brands fa-react text-cyan-400 mr-1"></i>React hooks</span>
                    <span class="bg-zinc-800/60 border border-zinc-700/40 rounded-full px-3 py-1.5 text-zinc-400"><i class="fa-solid fa-book text-emerald-400 mr-1"></i>Full docs</span>
                </div>
            </div>
        </div>

        <!-- FAQ -->
        <div class="mb-10">
            <h2 class="text-xl font-bold text-white mb-4">FAQ</h2>
            <div class="space-y-3">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">Do I need to register or apply?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">No. The operator system is completely permissionless. Any valid Ethereum address works as an operator. There's no whitelist, no approval, and no KYC.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">Which actions generate operator fees?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">All protocol actions that pass through BackchainEcosystem: staking, unstaking, NFT buy/sell, Fortune Pool entries, Notary certification, Charity donations, Agora actions, and NFT rentals. Every module that collects fees supports operators.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">What happens if no operator is set?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">The operator share is sent to the zero address (0x000...0000) — effectively burned. This means transactions without an operator benefit the protocol by reducing supply, but no one earns the commission.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">Can the admin change commission rates?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">Module configs are set during deployment. The Backchain governance model is designed for progressive decentralization — commission rates follow the same immutability guarantees as the rest of the protocol.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">Can multiple operators exist at the same time?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">Yes. Each transaction specifies its own operator. If 10 different developers build 10 different frontends, each one earns commissions from the transactions that go through their app. There's no competition — the ecosystem grows with more operators.</p>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4">
                    <h3 class="text-white font-bold text-sm mb-1">How do I track my earnings?</h3>
                    <p class="text-zinc-500 text-xs leading-relaxed">Connect your wallet on this page to see your pending BNB balance. You can also read <code class="text-emerald-400 bg-zinc-800/60 px-1 py-0.5 rounded">pendingEth(yourAddress)</code> directly from the BackchainEcosystem contract on Explorer.</p>
                </div>
            </div>
        </div>

        <!-- Test as Operator -->
        <div class="mb-10">
            <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 sm:p-6">
                <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <i class="fa-solid fa-flask text-emerald-400"></i> Test as Operator
                </h3>
                <p class="text-zinc-400 text-sm mb-4">Set your wallet as the operator for this browser session. All transactions you make will credit fees to this address.</p>
                <div class="flex flex-col sm:flex-row gap-3 mb-3">
                    <input id="op-address-input" type="text" placeholder="0x..." value="${opInfo.isSet ? opInfo.address : ''}"
                        class="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono" />
                    <div class="flex gap-2">
                        <button id="op-set-btn"
                            class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 py-3 text-sm transition-colors flex items-center gap-2">
                            <i class="fa-solid fa-check"></i> Set
                        </button>
                        <button id="op-clear-btn"
                            class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl px-5 py-3 text-sm transition-colors flex items-center gap-2">
                            <i class="fa-solid fa-xmark"></i> Clear
                        </button>
                    </div>
                </div>
                <div class="text-sm" id="op-current-display">
                    ${opInfo.isSet
                        ? `<span class="text-emerald-400"><i class="fa-solid fa-circle-check mr-1"></i> Active: ${shortAddress(opInfo.address)}</span> <span class="text-zinc-600">(source: ${opInfo.source})</span>`
                        : '<span class="text-zinc-500"><i class="fa-solid fa-circle-xmark mr-1"></i> No operator set</span>'}
                </div>
            </div>
        </div>

        <!-- Bottom CTA -->
        <div class="text-center py-4">
            <p class="text-zinc-500 text-xs">The Backchain Operator system is permissionless, on-chain, and unstoppable.</p>
            <p class="text-zinc-600 text-xs mt-1">Contracts verified on Explorer. Open source.</p>
        </div>

    </div><!-- /max-w-3xl -->
    `;

    setupEventListeners();

    // Load data if not already loaded
    if (OS.modules.length === 0) {
        loadOperatorData().then(() => {
            updateModulesUI();
            updateEarningsUI();
        });
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateModulesUI() {
    const list = document.getElementById('op-modules-list');
    if (!list || OS.modules.length === 0) return;
    list.innerHTML = OS.modules.map(m => `
        <div class="op-module-row grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-700/20 items-center">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid ${m.icon} ${m.color} text-sm"></i>
                </div>
                <span class="text-white text-sm font-medium">${m.name}</span>
            </div>
            <div class="text-center">
                <span class="text-emerald-400 font-bold text-lg">${(m.operatorBps / 100).toFixed(0)}%</span>
            </div>
            <div class="text-right text-xs text-zinc-500 space-y-0.5">
                <div>Custom ${(m.customBps / 100).toFixed(0)}%</div>
                <div>Treasury ${(m.treasuryBps / 100).toFixed(0)}%</div>
                <div>Buyback ${(m.buybackBps / 100).toFixed(0)}%</div>
            </div>
        </div>
    `).join('');
}

function updateEarningsUI() {
    const el = document.getElementById('op-pending');
    if (el) {
        const formatted = OS.pendingEth > 0n ? ethers.formatEther(OS.pendingEth) : '0.0';
        el.innerHTML = `${formatted} <span class="text-lg text-zinc-400">BNB</span>`;
    }
    const btn = document.getElementById('op-withdraw-btn');
    if (btn) btn.disabled = OS.pendingEth === 0n;
}

function updateOperatorDisplay() {
    const display = document.getElementById('op-current-display');
    if (!display) return;
    const info = getOperatorInfo();
    display.innerHTML = info.isSet
        ? `<span class="text-emerald-400"><i class="fa-solid fa-circle-check mr-1"></i> Active: ${shortAddress(info.address)}</span> <span class="text-zinc-600">(source: ${info.source})</span>`
        : '<span class="text-zinc-500"><i class="fa-solid fa-circle-xmark mr-1"></i> No operator set</span>';
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    const container = document.getElementById('operator');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target;

        if (target.closest('#op-withdraw-btn')) {
            withdrawEarnings();
            return;
        }
        if (target.closest('#op-set-btn')) {
            setOperatorFromInput();
            return;
        }
        if (target.closest('#op-clear-btn')) {
            clearOperatorFromUI();
            return;
        }
    });
}

// ============================================================================
// TRANSACTIONS
// ============================================================================
async function withdrawEarnings() {
    if (OS.isWithdrawing || OS.pendingEth === 0n) return;
    const btn = document.getElementById('op-withdraw-btn');
    OS.isWithdrawing = true;

    await txEngine.execute({
        contract: State.ecosystemManagerContract,
        method: 'withdrawEth',
        args: () => [],
        description: 'Withdraw Operator Earnings',
        skipSimulation: true,
        fixedGasLimit: 80000n,
        button: btn,
        onSuccess: () => {
            OS.isWithdrawing = false;
            OS.pendingEth = 0n;
            updateEarningsUI();
            showToast('BNB withdrawn successfully!', 'success');
        },
        onError: (err) => {
            OS.isWithdrawing = false;
            console.error('[Operator] Withdraw failed:', err);
        }
    });
}

function setOperatorFromInput() {
    const input = document.getElementById('op-address-input');
    if (!input) return;
    const address = input.value.trim();
    if (!address) {
        showToast('Enter an address', 'error');
        return;
    }
    const success = setOperator(address);
    if (success) {
        showToast(`Operator set to ${shortAddress(address)}`, 'success');
        updateOperatorDisplay();
    } else {
        showToast('Invalid address', 'error');
    }
}

function clearOperatorFromUI() {
    clearOperator();
    const input = document.getElementById('op-address-input');
    if (input) input.value = '';
    showToast('Operator cleared', 'info');
    updateOperatorDisplay();
}

// ============================================================================
// LIFECYCLE
// ============================================================================
function update(isConnected) {
    if (isConnected) {
        loadOperatorData().then(() => {
            updateModulesUI();
            updateEarningsUI();
        });
    }
}

function cleanup() {}

// ============================================================================
// EXPORT
// ============================================================================
export const OperatorPage = { render, update, cleanup };
