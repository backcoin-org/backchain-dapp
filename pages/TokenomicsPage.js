// pages/TokenomicsPage.js
// ✅ V9.1 — Fixed Tailwind classes + TGE split + Referral/Operator CTAs

import { State } from '../state.js';
import { formatBigNumber } from '../utils.js';

// ==========================================================
//  1. CONSTANTS
// ==========================================================
const MAX_SUPPLY = 200_000_000;
const TGE_AMOUNT = 40_000_000;
const AIRDROP_AMOUNT = 14_000_000; // 35% of TGE
const LIQUIDITY_AMOUNT = 26_000_000; // 65% of TGE

// Tier 2 BKC fee distribution
const BKC_FEE_SPLIT = { burn: 5, stakers: 75, treasury: 20 };

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
                <div class="tk-icon-box" style="background:rgba(245,158,11,0.2)"><i class="fa-solid fa-coins text-amber-400"></i></div>
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
                <div class="tk-icon-box" style="background:rgba(168,85,247,0.2)"><i class="fa-solid fa-rocket text-purple-400"></i></div>
                <div><h2 class="text-white font-bold">TGE — Token Launch</h2><p class="text-zinc-500 text-xs">40M BKC minted at genesis</p></div>
            </div>
            <div class="flex items-center justify-center gap-6 mb-4">
                <div class="tk-pie-ring" style="background: conic-gradient(#f59e0b 0% 35%, #10b981 35% 100%);">
                    <div class="tk-pie-center">
                        <p class="text-2xl font-black text-white">40M</p>
                        <p class="text-[10px] text-zinc-500">BKC</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">35% Airdrop</p>
                            <p class="text-zinc-500 text-[10px]">${fmt(AIRDROP_AMOUNT)} BKC to community</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div>
                            <p class="text-white font-bold text-sm">65% Liquidity</p>
                            <p class="text-zinc-500 text-[10px]">${fmt(LIQUIDITY_AMOUNT)} BKC to LiquidityPool</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tk-card" style="background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(234,88,12,0.08));border-color:rgba(245,158,11,0.3)">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg"><i class="fa-solid fa-parachute-box text-amber-400"></i></span>
                    <p class="text-amber-400 font-bold text-sm">Airdrop — Phase 1 Active</p>
                </div>
                <p class="text-zinc-400 text-xs">Earn points by using the protocol: staking, notarizing, playing Fortune, posting on Agora, donating to Charity. Share your referral link to earn 5% of your referrals' staking rewards — forever.</p>
                <div class="flex gap-2 mt-3">
                    <a href="#airdrop" class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                        <i class="fa-solid fa-arrow-right"></i> Join Airdrop
                    </a>
                    <a href="#referral" class="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-4">
                        <i class="fa-solid fa-user-plus"></i> Invite Friends
                    </a>
                </div>
            </div>
        </div>`;
}

function renderFeeFlow() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.2s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box" style="background:rgba(6,182,212,0.2)"><i class="fa-solid fa-arrows-split-up-and-left text-cyan-400"></i></div>
                <div><h2 class="text-white font-bold">Fee Flow</h2><p class="text-zinc-500 text-xs">How protocol revenue is distributed</p></div>
            </div>

            <div class="tk-card mb-3">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-layer-group text-blue-400 mr-2"></i>Tier 1 — ETH Fees</p>
                <p class="text-zinc-500 text-xs mb-3">Every on-chain action pays an ETH fee split among:</p>
                <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-emerald-400 font-bold text-base">Buyback</p><p class="text-zinc-500">ETH accumulates</p></div>
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-blue-400 font-bold text-base">Treasury</p><p class="text-zinc-500">Protocol fund</p></div>
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-amber-400 font-bold text-base">Operator</p><p class="text-zinc-500">Frontend builder</p></div>
                </div>
            </div>

            <div class="tk-flow-line my-3"></div>

            <div class="tk-card mb-3">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-layer-group text-purple-400 mr-2"></i>Tier 2 — BKC Fees</p>
                <p class="text-zinc-500 text-xs mb-3">Staking claims and Fortune wagers pay BKC fees:</p>
                <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-red-400 font-bold text-base">${BKC_FEE_SPLIT.burn}%</p><p class="text-zinc-500">Burn</p></div>
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-purple-400 font-bold text-base">${BKC_FEE_SPLIT.stakers}%</p><p class="text-zinc-500">Stakers</p></div>
                    <div class="rounded-lg p-2" style="background:rgba(39,39,42,0.5)"><p class="text-blue-400 font-bold text-base">${BKC_FEE_SPLIT.treasury}%</p><p class="text-zinc-500">Treasury</p></div>
                </div>
            </div>

            <div class="tk-flow-line my-3"></div>

            <div class="tk-card" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.08));border-color:rgba(16,185,129,0.3)">
                <p class="text-white font-bold text-sm mb-2"><i class="fa-solid fa-recycle text-emerald-400 mr-2"></i>BuybackMiner — The Engine</p>
                <p class="text-zinc-500 text-xs mb-2">When ETH fees accumulate, anyone can trigger a buyback:</p>
                <div class="space-y-1 text-[10px] text-zinc-400">
                    <p><span class="text-emerald-400">1.</span> Withdraw ETH from Ecosystem</p>
                    <p><span class="text-emerald-400">2.</span> 1% to caller incentive (permissionless MEV)</p>
                    <p><span class="text-emerald-400">3.</span> 99% swaps ETH to BKC via LiquidityPool</p>
                    <p><span class="text-emerald-400">4.</span> Mint new BKC (scarcity curve decreases over time)</p>
                    <p><span class="text-emerald-400">5.</span> 5% burned + 95% to StakingPool rewards</p>
                </div>
            </div>
        </div>`;
}

function renderPricing() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.3s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box" style="background:rgba(245,158,11,0.2)"><i class="fa-solid fa-receipt text-amber-400"></i></div>
                <div><h2 class="text-white font-bold">Fixed Pricing</h2><p class="text-zinc-500 text-xs">Minimum fees ensure ecosystem sustainability</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(139,92,246,0.2)">
                        <i class="fa-solid fa-stamp text-violet-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Notary — Certify</p>
                        <p class="text-violet-400 text-[10px] font-bold">0.0005 ETH</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(34,197,94,0.2)">
                        <i class="fa-solid fa-dice-one text-green-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Fortune — Tier 0 (2x)</p>
                        <p class="text-green-400 text-[10px] font-bold">0.0003 ETH</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(16,185,129,0.2)">
                        <i class="fa-solid fa-dice-three text-emerald-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Fortune — Tier 1 (10x)</p>
                        <p class="text-emerald-400 text-[10px] font-bold">0.0005 ETH</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(20,184,166,0.2)">
                        <i class="fa-solid fa-dice-six text-teal-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Fortune — Tier 2 (100x)</p>
                        <p class="text-teal-400 text-[10px] font-bold">0.001 ETH</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(59,130,246,0.2)">
                        <i class="fa-solid fa-circle-check text-blue-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Agora — Verified Badge</p>
                        <p class="text-blue-400 text-[10px] font-bold">0.02 ETH/yr</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(245,158,11,0.2)">
                        <i class="fa-solid fa-circle-check text-amber-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Agora — Premium Badge</p>
                        <p class="text-amber-400 text-[10px] font-bold">0.1 ETH/yr</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(168,85,247,0.2)">
                        <i class="fa-solid fa-gem text-purple-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Agora — Elite Badge</p>
                        <p class="text-purple-400 text-[10px] font-bold">0.25 ETH/yr</p>
                    </div>
                </div>
                <div class="tk-card flex items-center gap-2 p-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(6,182,212,0.2)">
                        <i class="fa-solid fa-rocket text-cyan-400 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white text-xs font-medium truncate">Agora — Post Boost</p>
                        <p class="text-cyan-400 text-[10px] font-bold">0.002 ETH/day</p>
                    </div>
                </div>
            </div>
            <div class="mt-3 p-3 rounded-lg text-center" style="background:rgba(39,39,42,0.5);border:1px solid rgba(63,63,70,0.5)">
                <p class="text-zinc-500 text-[10px]"><i class="fa-solid fa-users mr-1"></i>Operators earn 10-20% commission on every action — <a href="#operator" class="text-emerald-400 hover:underline">become an operator</a></p>
            </div>
        </div>`;
}

function renderBoosters() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.35s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box" style="background:rgba(139,92,246,0.2)"><i class="fa-solid fa-gem text-violet-400"></i></div>
                <div><h2 class="text-white font-bold">NFT Boosters</h2><p class="text-zinc-500 text-xs">Reduce burn rate on staking claim rewards</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="tk-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(6,182,212,0.2)">
                            <i class="fa-solid fa-gem text-cyan-400 text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-bold">Diamond</p>
                            <p class="text-cyan-400 text-[10px]">+50% boost</p>
                        </div>
                    </div>
                    <div class="flex justify-between text-[10px]">
                        <span class="text-emerald-400">Burn: 0%</span>
                        <span class="text-zinc-500">Keep: 100%</span>
                    </div>
                </div>
                <div class="tk-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(234,179,8,0.2)">
                            <i class="fa-solid fa-gem text-yellow-400 text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-bold">Gold</p>
                            <p class="text-yellow-400 text-[10px]">+40% boost</p>
                        </div>
                    </div>
                    <div class="flex justify-between text-[10px]">
                        <span class="text-emerald-400">Burn: 10%</span>
                        <span class="text-zinc-500">Keep: 90%</span>
                    </div>
                </div>
                <div class="tk-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(161,161,170,0.2)">
                            <i class="fa-solid fa-gem text-zinc-400 text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-bold">Silver</p>
                            <p class="text-zinc-400 text-[10px]">+25% boost</p>
                        </div>
                    </div>
                    <div class="flex justify-between text-[10px]">
                        <span class="text-emerald-400">Burn: 25%</span>
                        <span class="text-zinc-500">Keep: 75%</span>
                    </div>
                </div>
                <div class="tk-card p-3">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(245,158,11,0.2)">
                            <i class="fa-solid fa-gem text-amber-500 text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white text-xs font-bold">Bronze</p>
                            <p class="text-amber-500 text-[10px]">+10% boost</p>
                        </div>
                    </div>
                    <div class="flex justify-between text-[10px]">
                        <span class="text-emerald-400">Burn: 40%</span>
                        <span class="text-zinc-500">Keep: 60%</span>
                    </div>
                </div>
            </div>
            <p class="text-center text-zinc-600 text-[10px] mt-3">
                <i class="fa-solid fa-info-circle mr-1"></i>Without NFT: 50% of claimed rewards are burned. Diamond holders keep 100%.
            </p>
        </div>`;
}

function renderEarnings() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.4s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box" style="background:rgba(245,158,11,0.2)"><i class="fa-solid fa-sack-dollar text-amber-400"></i></div>
                <div><h2 class="text-white font-bold">How to Earn</h2><p class="text-zinc-500 text-xs">6 ways to generate income</p></div>
            </div>
            <div class="space-y-2">
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(168,85,247,0.2)">
                            <i class="fa-solid fa-lock text-purple-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Stake BKC</p><span class="tk-badge" style="background:rgba(168,85,247,0.2);color:#c084fc">Real Yield</span></div>
                            <p class="text-zinc-500 text-xs">Delegate to earn share of BuybackMiner output + Tier 2 fees. Longer locks = higher pStake = bigger share.</p>
                        </div>
                    </div>
                </div>
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(6,182,212,0.2)">
                            <i class="fa-solid fa-landmark text-cyan-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Agora Social</p><span class="tk-badge" style="background:rgba(6,182,212,0.2);color:#22d3ee">ETH Tips</span></div>
                            <p class="text-zinc-500 text-xs">Earn from followers, replies, SuperLikes, and tips. Build an audience and monetize your content.</p>
                        </div>
                    </div>
                </div>
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(20,184,166,0.2)">
                            <i class="fa-solid fa-house text-teal-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Rent NFTs</p><span class="tk-badge" style="background:rgba(20,184,166,0.2);color:#2dd4bf">Passive</span></div>
                            <p class="text-zinc-500 text-xs">List your Booster NFT for rent. Other stakers pay per-hour for temporary boost access.</p>
                        </div>
                    </div>
                </div>
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(34,197,94,0.2)">
                            <i class="fa-solid fa-clover text-green-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Fortune Pool</p><span class="tk-badge" style="background:rgba(34,197,94,0.2);color:#4ade80">Up to 100x</span></div>
                            <p class="text-zinc-500 text-xs">Commit-reveal game with 3 tiers: 2x, 10x, or 100x. Provably fair on-chain randomness.</p>
                        </div>
                    </div>
                </div>
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(245,158,11,0.2)">
                            <i class="fa-solid fa-code text-amber-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Operate a Frontend</p><span class="tk-badge" style="background:rgba(245,158,11,0.2);color:#fbbf24">10-20%</span></div>
                            <p class="text-zinc-500 text-xs">Build a UI for any module and earn operator commissions on all user activity. <a href="#operator" class="text-emerald-400 hover:underline">Learn more</a></p>
                        </div>
                    </div>
                </div>
                <div class="tk-card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(234,179,8,0.2)">
                            <i class="fa-solid fa-bolt text-yellow-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2"><p class="text-white font-bold text-sm">Trigger Buybacks</p><span class="tk-badge" style="background:rgba(234,179,8,0.2);color:#facc15">1% Reward</span></div>
                            <p class="text-zinc-500 text-xs">Call executeBuyback() when ETH accumulates. Earn 1% caller incentive. Permissionless MEV.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderContracts() {
    return `
        <div class="tk-section tk-fade" style="animation-delay:0.5s">
            <div class="flex items-center gap-2 mb-4">
                <div class="tk-icon-box" style="background:rgba(161,161,170,0.2)"><i class="fa-solid fa-file-contract text-zinc-400"></i></div>
                <div><h2 class="text-white font-bold">15 Smart Contracts</h2><p class="text-zinc-500 text-xs">All immutable — no admin, no pause, no blacklist</p></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-coins text-amber-400"></i><span class="text-zinc-400">BKCToken</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-network-wired text-blue-400"></i><span class="text-zinc-400">BackchainEcosystem</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-water text-indigo-400"></i><span class="text-zinc-400">LiquidityPool</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-lock text-purple-400"></i><span class="text-zinc-400">StakingPool</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-hammer text-emerald-400"></i><span class="text-zinc-400">BuybackMiner</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-gem text-violet-400"></i><span class="text-zinc-400">RewardBooster</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-store text-pink-400"></i><span class="text-zinc-400">NFTPool (x4)</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-clover text-green-400"></i><span class="text-zinc-400">FortunePool</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-landmark text-cyan-400"></i><span class="text-zinc-400">Agora</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-stamp text-slate-400"></i><span class="text-zinc-400">Notary</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-heart text-red-400"></i><span class="text-zinc-400">CharityPool</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-rocket text-teal-400"></i><span class="text-zinc-400">RentalManager</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-scale-balanced text-amber-400"></i><span class="text-zinc-400">Governance</span></div>
                <div class="tk-card p-2 flex items-center gap-2"><i class="fa-solid fa-faucet-drip text-sky-400"></i><span class="text-zinc-400">SimpleBKCFaucet</span></div>
            </div>
            <div class="mt-3 p-3 rounded-lg" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3)">
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
