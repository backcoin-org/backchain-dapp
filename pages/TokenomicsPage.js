// pages/TokenomicsPage.js
// ✅ V9.0 — Updated for V9 contracts (15 contracts, real fee structure)

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';

// ==========================================================
//  1. CONSTANTS
// ==========================================================
const MAX_SUPPLY = 200_000_000;
const TGE_AMOUNT = 40_000_000; // 40M to treasury at launch

// Tier 2 BKC fee distribution (from BackchainEcosystem)
const BKC_FEE_SPLIT = { burn: 5, stakers: 75, treasury: 20 };

// NFT Booster tiers (from RewardBooster.sol)
const BOOSTERS = [
    { tier: 'Diamond', boost: 5000, burnRate: 0,  color: 'cyan',   icon: 'fa-gem' },
    { tier: 'Gold',    boost: 4000, burnRate: 10, color: 'yellow', icon: 'fa-gem' },
    { tier: 'Silver',  boost: 2500, burnRate: 25, color: 'gray',   icon: 'fa-gem' },
    { tier: 'Bronze',  boost: 1000, burnRate: 40, color: 'orange', icon: 'fa-gem' }
];

// V9 Contracts
const CONTRACTS = [
    { name: 'BKCToken',            icon: 'fa-coins',         color: 'amber'  },
    { name: 'BackchainEcosystem',  icon: 'fa-network-wired', color: 'blue'   },
    { name: 'LiquidityPool',      icon: 'fa-water',         color: 'indigo'  },
    { name: 'StakingPool',        icon: 'fa-lock',          color: 'purple'  },
    { name: 'BuybackMiner',       icon: 'fa-hammer',        color: 'emerald' },
    { name: 'RewardBooster',      icon: 'fa-gem',           color: 'violet'  },
    { name: 'NFTPool (×4)',       icon: 'fa-store',         color: 'pink'    },
    { name: 'FortunePool',        icon: 'fa-clover',        color: 'green'   },
    { name: 'Agora',              icon: 'fa-landmark',      color: 'cyan'    },
    { name: 'Notary',             icon: 'fa-stamp',         color: 'slate'   },
    { name: 'CharityPool',        icon: 'fa-heart',         color: 'red'     },
    { name: 'RentalManager',      icon: 'fa-house',         color: 'teal'    },
    { name: 'Governance',         icon: 'fa-scale-balanced', color: 'amber'  },
    { name: 'SimpleBKCFaucet',    icon: 'fa-faucet-drip',   color: 'sky'     }
];

// ==========================================================
//  2. STYLES
// ==========================================================
const injectTokenomicsStyles = () => {
    if (document.getElementById('tokenomics-styles-v9')) return;
    const style = document.createElement('style');
    style.id = 'tokenomics-styles-v9';
    style.innerHTML = `
        @keyframes tk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes tk-glow { 0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.2); } 50% { box-shadow: 0 0 40px rgba(245,158,11,0.4); } }
        @keyframes tk-fade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tk-flow { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        .tk-float { animation: tk-float 4s ease-in-out infinite; }
        .tk-glow { animation: tk-glow 2s ease-in-out infinite; }
        .tk-fade { animation: tk-fade 0.6s ease-out forwards; }
        .tk-section { background: linear-gradient(180deg, rgba(24,24,27,0.8), rgba(9,9,11,0.9)); border: 1px solid rgba(63,63,70,0.3); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1rem; }
        .tk-card { background: rgba(39,39,42,0.4); border: 1px solid rgba(63,63,70,0.5); border-radius: 0.75rem; padding: 1rem; transition: all 0.3s ease; }
        .tk-card:hover { border-color: rgba(245,158,11,0.3); transform: translateY(-2px); }
        .tk-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        .tk-flow-line { position: relative; height: 2px; background: rgba(63,63,70,0.5); overflow: hidden; }
        .tk-flow-line::after { content: ''; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, #f59e0b, transparent); animation: tk-flow 2s linear infinite; }
        .tk-pie-ring { width: 160px; height: 160px; border-radius: 50%; position: relative; }
        .tk-pie-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; background: #09090b; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #27272a; }
        .tk-bar { height: 8px; background: rgba(63,63,70,0.5); border-radius: 999px; overflow: hidden; }
        .tk-bar-fill { height: 100%; border-radius: 999px; transition: width 1s ease-out; }
        .tk-icon-box { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    `;
    document.head.appendChild(style);
};

// ==========================================================
//  3. HELPERS
// ==========================================================
const fmt = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString();
};

// ==========================================================
//  4. SECTIONS
// ==========================================================

function renderHero() {
    return `
        <div class="text-center mb-6 tk-fade">
            <div class="relative inline-block mb-4">
                <img src="./assets/bkc_logo_3d.png" class="w-20 h-20 tk-float tk-glow rounded-full" alt="BKC">
            </div>
            <h1 class="text-2xl font-black text-white mb-2">
                <span class="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">BACKCHAIN</span>
                <span class="text-zinc-400 font-normal">Tokenomics</span>
            </h1>
            <p class="text-zinc-500 text-sm max-w-md mx-auto">
                15 immutable contracts. <span class="text-amber-400">Real yield</span> from protocol fees.
                <span class="text-emerald-400">Deflationary</span> by design.
                No admin keys. No pause. <span class="text-purple-400">Unstoppable.</span>
            </p>
        </div>`;
}

function renderSupply() {
    const currentSupply = State.totalSupply ? Number(formatBigNumber(State.totalSupply).replace(/,/g, '')) : TGE_AMOUNT;
    const pct = (currentSupply / MAX_SUPPLY * 100).toFixed(1);
    const remaining = MAX_SUPPLY - currentSupply;
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.1s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-amber-500/20"><i class="fa-solid fa-coins text-amber-400"></i></div>
                <div><h2 class="text-white font-bold">Token Supply</h2><p class="text-zinc-500 text-xs">BKC — ERC-20 on Arbitrum</p></div>
            </div>
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Max Supply</p>
                    <p class="text-xl font-black text-white">${fmt(MAX_SUPPLY)}</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">Circulating</p>
                    <p class="text-xl font-black text-emerald-400">${fmt(currentSupply)}</p>
                </div>
                <div class="tk-card text-center">
                    <p class="text-zinc-500 text-[10px] uppercase mb-1">To Mine</p>
                    <p class="text-xl font-black text-amber-400">${fmt(remaining)}</p>
                </div>
            </div>
            <div class="tk-bar mb-2"><div class="tk-bar-fill bg-gradient-to-r from-amber-500 to-emerald-500" style="width:${pct}%"></div></div>
            <p class="text-center text-zinc-600 text-[10px]"><i class="fa-solid fa-hammer mr-1"></i>${pct}% minted — remaining ${fmt(remaining)} BKC mined via BuybackMiner</p>
        </div>`;
}

function renderTGE() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.15s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-purple-500/20"><i class="fa-solid fa-rocket text-purple-400"></i></div>
                <div><h2 class="text-white font-bold">TGE — Token Launch</h2><p class="text-zinc-500 text-xs">40M BKC minted at genesis</p></div>
            </div>
            <div class="flex items-center justify-center gap-6 mb-4">
                <div class="tk-pie-ring" style="background: conic-gradient(#10b981 0% 100%);">
                    <div class="tk-pie-center">
                        <p class="text-2xl font-black text-white">40M</p>
                        <p class="text-[10px] text-zinc-500">BKC</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">100% Treasury</p>
                            <p class="text-zinc-500 text-[10px]">Seeded to LiquidityPool + Airdrop</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tk-card bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg"><i class="fa-solid fa-parachute-box text-amber-400"></i></span>
                    <p class="text-amber-400 font-bold text-sm">Community Airdrop</p>
                </div>
                <p class="text-zinc-400 text-xs">Earn points by using the protocol: staking, notarizing documents, playing Fortune Pool, posting on Agora, donating to Charity campaigns, and more.</p>
            </div>
        </div>`;
}

function renderFeeFlow() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.2s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-cyan-500/20"><i class="fa-solid fa-arrows-split-up-and-left text-cyan-400"></i></div>
                <div><h2 class="text-white font-bold">Fee Flow</h2><p class="text-zinc-500 text-xs">How protocol revenue is distributed</p></div>
            </div>

            <div class="tk-card mb-3">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-layer-group text-blue-400 mr-2"></i>Tier 1 — ETH Fees</p>
                <p class="text-zinc-500 text-xs mb-3">Every on-chain action (post, certify, play, swap, stake) pays an ETH fee split among:</p>
                <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-emerald-400 font-bold text-base">Buyback</p><p class="text-zinc-500">ETH accumulates</p></div>
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-blue-400 font-bold text-base">Treasury</p><p class="text-zinc-500">Protocol fund</p></div>
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-amber-400 font-bold text-base">Operator</p><p class="text-zinc-500">Frontend builder</p></div>
                </div>
            </div>

            <div class="tk-flow-line my-3"></div>

            <div class="tk-card mb-3">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-layer-group text-purple-400 mr-2"></i>Tier 2 — BKC Fees</p>
                <p class="text-zinc-500 text-xs mb-3">Staking claims and Fortune wagers pay BKC fees:</p>
                <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-red-400 font-bold text-base">${BKC_FEE_SPLIT.burn}%</p><p class="text-zinc-500">Burn</p></div>
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-purple-400 font-bold text-base">${BKC_FEE_SPLIT.stakers}%</p><p class="text-zinc-500">Stakers</p></div>
                    <div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-blue-400 font-bold text-base">${BKC_FEE_SPLIT.treasury}%</p><p class="text-zinc-500">Treasury</p></div>
                </div>
            </div>

            <div class="tk-flow-line my-3"></div>

            <div class="tk-card bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-recycle text-emerald-400 mr-2"></i>BuybackMiner — The Engine</p>
                <p class="text-zinc-500 text-xs mb-2">When ETH fees accumulate, anyone can trigger a buyback:</p>
                <div class="space-y-1 text-[10px] text-zinc-400">
                    <p><span class="text-emerald-400">1.</span> Withdraw ETH from Ecosystem</p>
                    <p><span class="text-emerald-400">2.</span> 1% → caller incentive (permissionless MEV)</p>
                    <p><span class="text-emerald-400">3.</span> 99% → swap ETH→BKC via LiquidityPool</p>
                    <p><span class="text-emerald-400">4.</span> Mint new BKC (scarcity curve decreases over time)</p>
                    <p><span class="text-emerald-400">5.</span> 5% burned + 95% → StakingPool rewards</p>
                </div>
            </div>
        </div>`;
}

function renderPricing() {
    const fees = [
        { name: 'Notary — Certify', fee: '0.0005 ETH', note: '~$1.50/doc', icon: 'fa-stamp', color: 'violet' },
        { name: 'Fortune — Tier 0 (2x)', fee: '0.0003 ETH', note: '~$0.90', icon: 'fa-dice-one', color: 'green' },
        { name: 'Fortune — Tier 1 (10x)', fee: '0.0005 ETH', note: '~$1.50', icon: 'fa-dice-three', color: 'emerald' },
        { name: 'Fortune — Tier 2 (100x)', fee: '0.001 ETH', note: '~$3.00', icon: 'fa-dice-six', color: 'teal' },
        { name: 'Agora — Verified Badge', fee: '0.02 ETH/yr', note: '~$60', icon: 'fa-circle-check', color: 'blue' },
        { name: 'Agora — Premium Badge', fee: '0.1 ETH/yr', note: '~$300', icon: 'fa-circle-check', color: 'amber' },
        { name: 'Agora — Elite Badge', fee: '0.25 ETH/yr', note: '~$750', icon: 'fa-gem', color: 'purple' },
        { name: 'Agora — Post Boost', fee: '0.002 ETH/day', note: 'Standard', icon: 'fa-rocket', color: 'cyan' }
    ];
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.3s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-amber-500/20"><i class="fa-solid fa-receipt text-amber-400"></i></div>
                <div><h2 class="text-white font-bold">Fixed Pricing</h2><p class="text-zinc-500 text-xs">Minimum fees ensure ecosystem sustainability</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                ${fees.map(f => `
                    <div class="tk-card flex items-center gap-2 p-2">
                        <div class="w-8 h-8 rounded-lg bg-${f.color}-500/20 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid ${f.icon} text-${f.color}-400 text-xs"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-white text-xs font-medium truncate">${f.name}</p>
                            <p class="text-${f.color}-400 text-[10px] font-bold">${f.fee} <span class="text-zinc-600">${f.note}</span></p>
                        </div>
                    </div>`).join('')}
            </div>
            <div class="mt-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p class="text-zinc-500 text-[10px]"><i class="fa-solid fa-users mr-1"></i>Operators earn commission on every action through their frontend</p>
            </div>
        </div>`;
}

function renderBoosters() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.35s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-violet-500/20"><i class="fa-solid fa-gem text-violet-400"></i></div>
                <div><h2 class="text-white font-bold">NFT Boosters</h2><p class="text-zinc-500 text-xs">Reduce burn rate on staking claim rewards</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                ${BOOSTERS.map(b => `
                    <div class="tk-card p-3">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-lg bg-${b.color}-500/20 flex items-center justify-center">
                                <i class="fa-solid ${b.icon} text-${b.color}-400 text-xs"></i>
                            </div>
                            <div>
                                <p class="text-white text-xs font-bold">${b.tier}</p>
                                <p class="text-${b.color}-400 text-[10px]">+${b.boost / 100}% boost</p>
                            </div>
                        </div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-emerald-400">Burn: ${b.burnRate}%</span>
                            <span class="text-zinc-500">Keep: ${100 - b.burnRate}%</span>
                        </div>
                    </div>`).join('')}
            </div>
            <p class="text-center text-zinc-600 text-[10px] mt-3">
                <i class="fa-solid fa-info-circle mr-1"></i>Without NFT: 50% of claimed rewards are burned. Diamond holders keep 100%.
            </p>
        </div>`;
}

function renderEarnings() {
    const ways = [
        { title: 'Stake BKC', desc: 'Delegate to earn share of BuybackMiner output + Tier 2 fees. Longer locks = higher pStake = bigger share.', icon: 'fa-lock', color: 'purple', badge: 'Real Yield' },
        { title: 'Agora Social', desc: 'Earn from followers, replies, SuperLikes, and tips. Build an audience and monetize your content.', icon: 'fa-landmark', color: 'cyan', badge: 'ETH Tips' },
        { title: 'Rent NFTs', desc: 'List your Booster NFT for rent. Other stakers pay per-hour for temporary boost access.', icon: 'fa-house', color: 'teal', badge: 'Passive' },
        { title: 'Fortune Pool', desc: 'Commit-reveal game with 3 tiers: 2x, 10x, or 100x. Provably fair on-chain randomness.', icon: 'fa-clover', color: 'green', badge: 'Up to 100x' },
        { title: 'Operate a Frontend', desc: 'Build a UI for any module and earn operator commissions on all user activity. Permissionless.', icon: 'fa-code', color: 'amber', badge: 'Builder' },
        { title: 'Trigger Buybacks', desc: 'Call executeBuyback() when ETH accumulates. Earn 1% caller incentive. Permissionless MEV.', icon: 'fa-bolt', color: 'yellow', badge: '1% Reward' }
    ];
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.4s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-amber-500/20"><i class="fa-solid fa-sack-dollar text-amber-400"></i></div>
                <div><h2 class="text-white font-bold">How to Earn</h2><p class="text-zinc-500 text-xs">6 ways to generate income</p></div>
            </div>
            <div class="space-y-2">
                ${ways.map(w => `
                    <div class="tk-card">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-${w.color}-500/20 flex items-center justify-center flex-shrink-0">
                                <i class="fa-solid ${w.icon} text-${w.color}-400"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">${w.title}</p><span class="tk-badge bg-${w.color}-500/20 text-${w.color}-400">${w.badge}</span></div>
                                <p class="text-zinc-500 text-xs">${w.desc}</p>
                            </div>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
}

function renderContracts() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.5s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box bg-zinc-500/20"><i class="fa-solid fa-file-contract text-zinc-400"></i></div>
                <div><h2 class="text-white font-bold">15 Smart Contracts</h2><p class="text-zinc-500 text-xs">All immutable — no admin, no pause, no blacklist</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                ${CONTRACTS.map(c => `
                    <div class="tk-card p-2 flex items-center gap-2">
                        <i class="fa-solid ${c.icon} text-${c.color}-400"></i>
                        <span class="text-zinc-400">${c.name}</span>
                    </div>`).join('')}
            </div>
            <div class="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p class="text-emerald-400 text-xs font-medium text-center"><i class="fa-solid fa-shield-halved mr-1"></i>Progressive decentralization: Admin → Multisig → Timelock → DAO</p>
            </div>
            <div class="mt-3 text-center">
                <a href="https://sepolia.arbiscan.io" target="_blank" class="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                    <i class="fa-solid fa-external-link"></i> View all contracts on Arbiscan
                </a>
            </div>
        </div>`;
}

// ==========================================================
//  5. MAIN RENDER
// ==========================================================
export function render() {
    const container = document.getElementById('tokenomics');
    if (!container) return;

    injectTokenomicsStyles();

    container.innerHTML = `
        <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
            ${renderHero()}
            ${renderSupply()}
            ${renderTGE()}
            ${renderFeeFlow()}
            ${renderPricing()}
            ${renderBoosters()}
            ${renderEarnings()}
            ${renderContracts()}
            <div class="text-center py-6 text-zinc-600 text-xs">
                <p>Unstoppable, permissionless DeFi infrastructure</p>
                <p class="mt-1">BACKCHAIN &copy; 2024-2026</p>
            </div>
        </div>`;

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function cleanup() {}

export const TokenomicsPage = {
    render,
    init: () => {},
    update: () => {}
};
