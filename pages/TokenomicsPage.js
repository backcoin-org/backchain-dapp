// pages/TokenomicsPage.js
// ✅ VERSÃO FINAL V3.0: "The Real Economy" - Alinhado com Contratos (80/20 Mining) + Escassez Dinâmica

import { showToast } from '../ui-feedback.js';

// --- CSS FX ---
const style = document.createElement('style');
style.innerHTML = `
    .pie-chart {
        width: 220px; height: 220px;
        border-radius: 50%;
        background: conic-gradient(
            #10b981 0% 17.5%,   /* Airdrop */
            #f59e0b 17.5% 100%  /* Liquidity/Treasury */
        );
        position: relative;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
        transition: transform 0.5s ease;
    }
    .pie-chart:hover { transform: scale(1.05); }
    .pie-hole {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 170px; height: 170px;
        background: #09090b; /* zinc-950 */
        border-radius: 50%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border: 4px solid #18181b;
    }
    .glass-card {
        background: rgba(20, 20, 23, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
    .bar-container { background: rgba(255,255,255,0.05); border-radius: 99px; height: 8px; width: 100%; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 99px; }
`;
document.head.appendChild(style);

const setupTokenomicsListeners = () => {
    const container = document.getElementById('tokenomics');
    if (!container) return;

    const modal = container.querySelector('#whitepaperModal');
    const openBtn = container.querySelector('#openWhitepaperModalBtn');
    const closeBtn = container.querySelector('#closeModalBtn');
    
    if (modal && openBtn && closeBtn) {
        const newOpenBtn = openBtn.cloneNode(true);
        openBtn.parentNode.replaceChild(newOpenBtn, openBtn);
        
        const open = () => {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div').classList.remove('scale-95');
                modal.querySelector('div').classList.add('scale-100');
            }, 10);
        };

        const close = () => {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.remove('scale-100');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        newOpenBtn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }
};

const renderTokenomicsContent = () => {
    const container = document.getElementById('tokenomics'); 
    if (!container) return;

    container.innerHTML = `
        <div class="container mx-auto max-w-6xl py-12 px-4 animate-fadeIn">
            
            <div class="text-center mb-24">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                    <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span class="text-xs font-bold text-amber-400 tracking-widest uppercase">The Blueprint</span>
                </div>
                <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white uppercase leading-tight">
                    A Fair Launch <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">Economy</span>
                </h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                    Designed for the community, funded by utility. Our tokenomics reflect our philosophy: 
                    <span class="text-white font-bold">No team allocation. No private investors. 100% Ecosystem.</span>
                </p>

                <div class="mt-12">
                    <button id="openWhitepaperModalBtn" class="group bg-white hover:bg-zinc-200 text-black font-black py-4 px-10 rounded-2xl text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                        Technical Whitepaper <i class="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </div>

            <section id="tge" class="mb-24">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-amber-500"></div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div class="flex flex-col items-center justify-center order-2 lg:order-1">
                            <div class="pie-chart mb-8">
                                <div class="pie-hole">
                                    <span class="text-4xl font-black text-white tracking-tighter">40M</span>
                                    <span class="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">Genesis Supply</span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-10 order-1 lg:order-2">
                            <div>
                                <h2 class="text-3xl font-bold text-white mb-2">Initial Distribution (TGE)</h2>
                                <p class="text-zinc-400">40,000,000 $BKC minted at genesis to kickstart the economy.</p>
                            </div>

                            <div class="space-y-6">
                                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-green-500/30 transition-colors">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center text-lg font-bold text-green-400">
                                            <div class="w-3 h-3 rounded-full bg-green-500 mr-3 shadow-[0_0_10px_#22c55e]"></div>
                                            17.5% — Community Airdrop
                                        </div>
                                        <span class="font-mono text-white text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/5">7,000,000</span>
                                    </div>
                                    <p class="text-sm text-zinc-500 pl-6">Distributed freely to early adopters. 100% decentralized from day one.</p>
                                </div>

                                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/30 transition-colors">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center text-lg font-bold text-amber-400">
                                            <div class="w-3 h-3 rounded-full bg-amber-500 mr-3 shadow-[0_0_10px_#f59e0b]"></div>
                                            82.5% — Liquidity & Treasury
                                        </div>
                                        <span class="font-mono text-white text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/5">33,000,000</span>
                                    </div>
                                    <p class="text-sm text-zinc-500 pl-6">Funded by NFT Sales. Initial DEX liquidity and DAO development fund.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pop" class="mb-24">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-purple-400 tracking-widest uppercase border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/10">The Mint Pool</span>
                    <h2 class="text-4xl md:text-5xl font-bold text-white mt-6">Proof-of-Purchase (PoP)</h2>
                    <p class="text-zinc-400 mt-4 max-w-2xl mx-auto">
                        The remaining <strong class="text-white">160M $BKC</strong> are locked. They are minted ONLY when real economic activity occurs (Fees Paid = Tokens Mined).
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="glass-card p-10 rounded-3xl text-center hover:bg-zinc-900 transition-colors border-t-4 border-t-purple-500 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i class="fa-solid fa-users text-8xl"></i></div>
                        
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 mb-6 text-3xl">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <h3 class="text-7xl font-black text-white mb-2 tracking-tighter">80%</h3>
                        <p class="text-purple-300 font-bold uppercase tracking-widest text-sm mb-4">DELEGATOR REWARD</p>
                        <p class="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                            The vast majority of every mined block goes directly to Stakers who secure the network consensus via the Delegation Manager.
                        </p>
                    </div>
                    
                    <div class="glass-card p-10 rounded-3xl text-center hover:bg-zinc-900 transition-colors border-t-4 border-t-amber-500 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i class="fa-solid fa-landmark text-8xl"></i></div>
                        
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mb-6 text-3xl">
                            <i class="fa-solid fa-building-columns"></i>
                        </div>
                        <h3 class="text-7xl font-black text-white mb-2 tracking-tighter">20%</h3>
                        <p class="text-amber-300 font-bold uppercase tracking-widest text-sm mb-4">DAO TREASURY</p>
                        <p class="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                            Allocated to the ecosystem treasury for continuous development, marketing, and partnerships.
                        </p>
                    </div>
                </div>
            </section>

            <section id="mechanics" class="mb-12">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <i class="fa-solid fa-chart-line text-cyan-400"></i> Dynamic Scarcity
                            </h3>
                            
                            <div class="space-y-6">
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 1: Early Adopters</span>
                                        <span class="text-cyan-400 font-bold">100% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-500" style="width: 100%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 2: < 80M Left</span>
                                        <span class="text-cyan-400 font-bold">50% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-600" style="width: 50%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-zinc-400">Phase 3: < 40M Left</span>
                                        <span class="text-cyan-400 font-bold">25% Rewards</span>
                                    </div>
                                    <div class="bar-container"><div class="bar-fill bg-cyan-700" style="width: 25%"></div></div>
                                </div>
                                <p class="text-xs text-zinc-500 italic mt-4">
                                    *Smart Contract enforces automatic halving based on remaining supply.
                                </p>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <i class="fa-solid fa-lock text-red-400"></i> Value Retention
                            </h3>
                            <ul class="space-y-6">
                                <li class="flex items-start">
                                    <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mr-4 flex-shrink-0">
                                        <i class="fa-solid fa-anchor"></i>
                                    </div>
                                    <div>
                                        <strong class="text-white block mb-1">Staking Lock-up</strong>
                                        <span class="text-sm text-zinc-400">Users lock tokens for up to 10 years to multiply their pStake power. Locked tokens reduce sell pressure.</span>
                                    </div>
                                </li>
                                <li class="flex items-start">
                                    <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mr-4 flex-shrink-0">
                                        <i class="fa-solid fa-fire"></i>
                                    </div>
                                    <div>
                                        <strong class="text-white block mb-1">Service Burn</strong>
                                        <span class="text-sm text-zinc-400">Every interaction (Game, Notary) removes liquid supply temporarily or permanently from circulation.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden transition-opacity opacity-0">
            <div class="glass-card bg-[#0a0a0a] border border-zinc-700 rounded-2xl p-8 w-full max-w-md relative transform scale-95 transition-transform duration-300">
                <button id="closeModalBtn" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-2xl"></i></button>
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-white">Technical Documentation</h3>
                    <p class="text-zinc-400 text-sm mt-2">Verified architecture and math.</p>
                </div>
                <div class="space-y-3">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="text-amber-500 text-xl"><i class="fa-solid fa-coins"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper</div>
                            <div class="text-zinc-500 text-xs">Distribution Models</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="text-cyan-500 text-xl"><i class="fa-solid fa-network-wired"></i></div>
                        <div class="text-left">
                            <div class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Ecosystem Architecture</div>
                            <div class="text-zinc-500 text-xs">Technical Overview</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
};

export const TokenomicsPage = {
    render() {
        renderTokenomicsContent();
        setupTokenomicsListeners();
    },
    init() { setupTokenomicsListeners(); },
    update(isConnected) { setupTokenomicsListeners(); }
};