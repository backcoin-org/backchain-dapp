// pages/OperatorPage.js
// ✅ VERSION V1.0: Build on Backchain, Earn Perpetual Commissions

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
        <!-- Hero -->
        <div class="text-center py-8 sm:py-12">
            <div class="op-hero-badge inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-5 py-2 mb-5">
                <i class="fa-solid fa-code text-emerald-400 text-sm"></i>
                <span class="text-emerald-400 text-sm font-bold">10-20% Commission</span>
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                Build on Backchain,<br class="sm:hidden"> <span class="text-emerald-400">Earn Forever</span>
            </h1>
            <p class="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Create your own frontend, bot, or integration. Earn <strong class="text-white">10-20% of every fee</strong> generated through your app — perpetually.
            </p>
        </div>

        <!-- Earnings Dashboard -->
        ${isConnected ? `
        <div class="op-earnings-card rounded-2xl p-6 max-w-2xl mx-auto mb-8">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-center sm:text-left">
                    <p class="text-emerald-400/80 text-sm font-medium mb-1">Your Pending Earnings</p>
                    <p class="text-3xl sm:text-4xl font-extrabold text-white" id="op-pending">${pendingFormatted} <span class="text-lg text-zinc-400">ETH</span></p>
                </div>
                <button id="op-withdraw-btn"
                    class="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl px-6 py-3 text-sm transition-colors flex items-center gap-2"
                    ${OS.pendingEth === 0n ? 'disabled' : ''}>
                    <i class="fa-solid fa-wallet"></i> Withdraw ETH
                </button>
            </div>
        </div>
        ` : `
        <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-6 max-w-2xl mx-auto mb-8 text-center">
            <i class="fa-solid fa-wallet text-4xl text-zinc-600 mb-3"></i>
            <p class="text-zinc-400">Connect your wallet to see your operator earnings</p>
        </div>
        `}

        <!-- How It Works -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-6 text-center">How Operators Earn</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="text-center">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-code text-xl text-emerald-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">1. Build</h3>
                    <p class="text-zinc-500 text-xs">Create a frontend or bot</p>
                </div>
                <div class="text-center">
                    <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-users text-xl text-blue-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">2. Users</h3>
                    <p class="text-zinc-500 text-xs">Users interact via your app</p>
                </div>
                <div class="text-center">
                    <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-receipt text-xl text-amber-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">3. Fees</h3>
                    <p class="text-zinc-500 text-xs">Protocol fees are generated</p>
                </div>
                <div class="text-center">
                    <div class="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-coins text-xl text-green-400"></i>
                    </div>
                    <h3 class="text-white font-bold text-sm mb-1">4. Earn %</h3>
                    <p class="text-zinc-500 text-xs">You get your commission cut</p>
                </div>
            </div>
        </div>

        <!-- Commission Rates -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-4 text-center">Commission Rates</h2>
            <p class="text-zinc-400 text-sm text-center mb-6">Each module distributes fees differently. Your operator share is guaranteed by smart contract.</p>
            <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl overflow-hidden">
                <div class="grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-700/30 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Module</span>
                    <span class="text-center">Operator %</span>
                    <span class="text-right">Fee Split</span>
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
        </div>

        <!-- Quick Start -->
        <div class="max-w-3xl mx-auto mb-10">
            <h2 class="text-xl font-bold text-white mb-4 text-center">Quick Start for Developers</h2>
            <div class="space-y-4">
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-2 text-sm flex items-center gap-2"><i class="fa-solid fa-1 text-emerald-400"></i> Set your operator address</h3>
                    <p class="text-zinc-400 text-xs mb-3">Add this to your frontend before any Backchain imports:</p>
                    <div class="op-code-block rounded-xl px-4 py-3 text-sm overflow-x-auto">
                        <code><span class="op-comment">// Set your wallet as the operator</span>
window.BACKCHAIN_OPERATOR = <span class="op-string">"0xYOUR_WALLET_ADDRESS"</span>;</code>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-2 text-sm flex items-center gap-2"><i class="fa-solid fa-2 text-emerald-400"></i> Or via localStorage</h3>
                    <p class="text-zinc-400 text-xs mb-3">For runtime configuration:</p>
                    <div class="op-code-block rounded-xl px-4 py-3 text-sm overflow-x-auto">
                        <code>localStorage.setItem(<span class="op-string">'bkc_operator'</span>, <span class="op-string">'0xYOUR_WALLET_ADDRESS'</span>);</code>
                    </div>
                </div>
                <div class="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-5">
                    <h3 class="text-white font-semibold mb-2 text-sm flex items-center gap-2"><i class="fa-solid fa-3 text-emerald-400"></i> That's it!</h3>
                    <p class="text-zinc-400 text-sm">Every transaction made through your frontend will include your operator address. Fees accumulate on-chain and you can withdraw anytime.</p>
                </div>
            </div>
        </div>

        <!-- Set Operator (for testing) -->
        <div class="max-w-2xl mx-auto mb-10">
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

        <!-- CTA -->
        <div class="text-center py-6">
            <p class="text-zinc-500 text-xs">Operator system is permissionless. No registration required. No admin approval.</p>
        </div>
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
        el.innerHTML = `${formatted} <span class="text-lg text-zinc-400">ETH</span>`;
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
            showToast('ETH withdrawn successfully!', 'success');
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
