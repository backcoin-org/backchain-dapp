// pages/TokenomicsPage.js
// ✅ VERSION V4.0: Mobile-first redesign with animations and improved UX

import { showToast } from '../ui-feedback.js';

// ==========================================================
//  1. STYLES INJECTION
// ==========================================================

const injectTokenomicsStyles = () => {
    if (document.getElementById('tokenomics-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'tokenomics-styles';
    style.innerHTML = `
        @keyframes float-coin {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 1; }
            100% { transform: scale(1.3); opacity: 0; }
        }
        
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
            50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.5); }
        }
        
        @keyframes count-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-left {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .tk-float { animation: float-coin 4s ease-in-out infinite; }
        .tk-glow { animation: glow-pulse 2s ease-in-out infinite; }
        .tk-fade-up { animation: fade-up 0.6s ease-out forwards; }
        .tk-slide-left { animation: slide-in-left 0.5s ease-out forwards; }
        .tk-slide-right { animation: slide-in-right 0.5s ease-out forwards; }
        
        .tk-pie-chart {
            width: 180px; height: 180px;
            border-radius: 50%;
            background: conic-gradient(
                #10b981 0% 17.5%,
                #f59e0b 17.5% 100%
            );
            position: relative;
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
            transition: transform 0.5s ease;
        }
        
        .tk-pie-chart:hover { transform: scale(1.05); }
        
        .tk-pie-hole {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 130px; height: 130px;
            background: #09090b;
            border-radius: 50%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            border: 3px solid #18181b;
        }
        
        .tk-glass {
            background: rgba(20, 20, 23, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .tk-bar { 
            background: rgba(255,255,255,0.08); 
            border-radius: 99px; 
            height: 6px; 
            overflow: hidden; 
        }
        
        .tk-bar-fill { 
            height: 100%; 
            border-radius: 99px; 
            transition: width 1s ease-out;
        }
        
        .tk-stat-card {
            transition: all 0.3s ease;
        }
        
        .tk-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .tk-gradient-text {
            background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        @media (min-width: 768px) {
            .tk-pie-chart {
                width: 220px; height: 220px;
            }
            .tk-pie-hole {
                width: 160px; height: 160px;
            }
        }
    `;
    document.head.appendChild(style);
};

// ==========================================================
//  2. MODAL HANDLERS
// ==========================================================

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
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 10);
        };

        const close = () => {
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-100');
            modal.querySelector('.modal-content').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        newOpenBtn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }
};

// ==========================================================
//  3. RENDER CONTENT
// ==========================================================

const renderTokenomicsContent = () => {
    const container = document.getElementById('tokenomics'); 
    if (!container) return;

    container.innerHTML = `
        <div class="min-h-screen pb-24">
            
            <!-- Hero Section - Mobile First -->
            <section class="px-4 pt-8 pb-12 md:pt-16 md:pb-20">
                <div class="max-w-4xl mx-auto text-center">
                    <!-- Badge -->
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 tk-fade-up">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span class="text-[10px] md:text-xs font-bold text-amber-400 tracking-widest uppercase">The Blueprint</span>
                    </div>
                    
                    <!-- Title -->
                    <h1 class="text-3xl md:text-6xl font-black mb-4 md:mb-6 tracking-tight text-white leading-tight tk-fade-up" style="animation-delay: 0.1s;">
                        A Fair Launch<br>
                        <span class="tk-gradient-text">Economy</span>
                    </h1>
                    
                    <!-- Subtitle -->
                    <p class="text-sm md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8 tk-fade-up" style="animation-delay: 0.2s;">
                        <span class="text-white font-bold">No team allocation. No private investors.</span><br class="md:hidden">
                        <span class="hidden md:inline"> </span>100% Ecosystem.
                    </p>

                    <!-- CTA Button -->
                    <button id="openWhitepaperModalBtn" class="group bg-white hover:bg-zinc-100 text-black font-bold py-3 px-6 md:py-4 md:px-10 rounded-xl md:rounded-2xl text-sm md:text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 tk-fade-up" style="animation-delay: 0.3s;">
                        <i class="fa-solid fa-file-pdf mr-2"></i>
                        Whitepaper
                        <i class="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </section>

            <!-- TGE Section -->
            <section class="px-4 mb-12 md:mb-20">
                <div class="max-w-4xl mx-auto">
                    <div class="tk-glass rounded-2xl md:rounded-3xl p-6 md:p-10 border border-zinc-800 relative overflow-hidden">
                        <!-- Top gradient line -->
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-amber-500"></div>
                        
                        <!-- Section Title -->
                        <div class="text-center mb-8">
                            <h2 class="text-xl md:text-3xl font-bold text-white mb-2">Initial Distribution</h2>
                            <p class="text-zinc-500 text-sm">40M $BKC at Genesis</p>
                        </div>
                        
                        <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                            <!-- Pie Chart -->
                            <div class="flex-shrink-0 tk-slide-left">
                                <div class="tk-pie-chart tk-glow">
                                    <div class="tk-pie-hole">
                                        <span class="text-2xl md:text-4xl font-black text-white">40M</span>
                                        <span class="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">Genesis</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Distribution Details -->
                            <div class="flex-1 space-y-4 w-full tk-slide-right">
                                <!-- Airdrop -->
                                <div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-green-500/30 transition-colors">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                                            <span class="text-sm md:text-base font-bold text-green-400">17.5% Airdrop</span>
                                        </div>
                                        <span class="font-mono text-xs md:text-sm text-white bg-black/40 px-2 py-1 rounded">7M</span>
                                    </div>
                                    <p class="text-xs text-zinc-500 pl-5">Free distribution to early adopters</p>
                                </div>
                                
                                <!-- Treasury -->
                                <div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/30 transition-colors">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
                                            <span class="text-sm md:text-base font-bold text-amber-400">82.5% Treasury</span>
                                        </div>
                                        <span class="font-mono text-xs md:text-sm text-white bg-black/40 px-2 py-1 rounded">33M</span>
                                    </div>
                                    <p class="text-xs text-zinc-500 pl-5">Liquidity & DAO development fund</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- PoP Mining Section -->
            <section class="px-4 mb-12 md:mb-20">
                <div class="max-w-4xl mx-auto">
                    <!-- Section Header -->
                    <div class="text-center mb-8">
                        <span class="inline-block text-[10px] md:text-xs font-bold text-purple-400 tracking-widest uppercase border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/10 mb-4">
                            The Mint Pool
                        </span>
                        <h2 class="text-2xl md:text-4xl font-bold text-white mb-3">Proof-of-Purchase</h2>
                        <p class="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
                            <span class="text-white font-bold">160M $BKC</span> locked. Minted only when real activity occurs.
                        </p>
                    </div>
                    
                    <!-- Mining Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- 80% Delegators -->
                        <div class="tk-stat-card tk-glass p-6 md:p-8 rounded-2xl text-center border-t-4 border-t-purple-500 relative overflow-hidden">
                            <div class="absolute top-2 right-2 opacity-10">
                                <i class="fa-solid fa-users text-5xl md:text-7xl"></i>
                            </div>
                            <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <i class="fa-solid fa-layer-group text-purple-400 text-xl md:text-2xl"></i>
                            </div>
                            <h3 class="text-4xl md:text-6xl font-black text-white mb-1">80%</h3>
                            <p class="text-purple-300 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-3">Delegator Reward</p>
                            <p class="text-zinc-400 text-xs leading-relaxed">
                                Majority goes to Stakers securing the network
                            </p>
                        </div>
                        
                        <!-- 20% Treasury -->
                        <div class="tk-stat-card tk-glass p-6 md:p-8 rounded-2xl text-center border-t-4 border-t-amber-500 relative overflow-hidden">
                            <div class="absolute top-2 right-2 opacity-10">
                                <i class="fa-solid fa-landmark text-5xl md:text-7xl"></i>
                            </div>
                            <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                <i class="fa-solid fa-building-columns text-amber-400 text-xl md:text-2xl"></i>
                            </div>
                            <h3 class="text-4xl md:text-6xl font-black text-white mb-1">20%</h3>
                            <p class="text-amber-300 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-3">DAO Treasury</p>
                            <p class="text-zinc-400 text-xs leading-relaxed">
                                Development, marketing & partnerships
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Mechanics Section -->
            <section class="px-4 mb-12">
                <div class="max-w-4xl mx-auto">
                    <div class="tk-glass rounded-2xl md:rounded-3xl p-6 md:p-10 border border-zinc-800">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            
                            <!-- Dynamic Scarcity -->
                            <div>
                                <h3 class="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <i class="fa-solid fa-chart-line text-cyan-400"></i>
                                    Dynamic Scarcity
                                </h3>
                                
                                <div class="space-y-4">
                                    <div>
                                        <div class="flex justify-between text-xs md:text-sm mb-2">
                                            <span class="text-zinc-400">Phase 1: Early Adopters</span>
                                            <span class="text-cyan-400 font-bold">100%</span>
                                        </div>
                                        <div class="tk-bar"><div class="tk-bar-fill bg-cyan-500" style="width: 100%"></div></div>
                                    </div>
                                    <div>
                                        <div class="flex justify-between text-xs md:text-sm mb-2">
                                            <span class="text-zinc-400">Phase 2: &lt; 80M Left</span>
                                            <span class="text-cyan-400 font-bold">50%</span>
                                        </div>
                                        <div class="tk-bar"><div class="tk-bar-fill bg-cyan-600" style="width: 50%"></div></div>
                                    </div>
                                    <div>
                                        <div class="flex justify-between text-xs md:text-sm mb-2">
                                            <span class="text-zinc-400">Phase 3: &lt; 40M Left</span>
                                            <span class="text-cyan-400 font-bold">25%</span>
                                        </div>
                                        <div class="tk-bar"><div class="tk-bar-fill bg-cyan-700" style="width: 25%"></div></div>
                                    </div>
                                    <p class="text-[10px] md:text-xs text-zinc-600 italic pt-2">
                                        *Auto-halving based on remaining supply
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Value Retention -->
                            <div>
                                <h3 class="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <i class="fa-solid fa-lock text-red-400"></i>
                                    Value Retention
                                </h3>
                                
                                <div class="space-y-4">
                                    <div class="flex items-start gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                                            <i class="fa-solid fa-anchor"></i>
                                        </div>
                                        <div>
                                            <strong class="text-white text-sm block mb-1">Staking Lock-up</strong>
                                            <span class="text-xs text-zinc-400">Lock tokens up to 10 years for multiplied pStake power</span>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                                            <i class="fa-solid fa-fire"></i>
                                        </div>
                                        <div>
                                            <strong class="text-white text-sm block mb-1">Service Burn</strong>
                                            <span class="text-xs text-zinc-400">Every interaction removes supply from circulation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Quick Stats Bar -->
            <section class="px-4 mb-12">
                <div class="max-w-4xl mx-auto">
                    <div class="grid grid-cols-3 gap-3">
                        <div class="tk-glass rounded-xl p-4 text-center border border-zinc-800">
                            <span class="text-xl md:text-3xl font-black text-white">200M</span>
                            <p class="text-[9px] md:text-xs text-zinc-500 mt-1">Max Supply</p>
                        </div>
                        <div class="tk-glass rounded-xl p-4 text-center border border-zinc-800">
                            <span class="text-xl md:text-3xl font-black text-green-400">0%</span>
                            <p class="text-[9px] md:text-xs text-zinc-500 mt-1">Team Alloc</p>
                        </div>
                        <div class="tk-glass rounded-xl p-4 text-center border border-zinc-800">
                            <span class="text-xl md:text-3xl font-black text-amber-400">100%</span>
                            <p class="text-[9px] md:text-xs text-zinc-500 mt-1">Community</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>

        <!-- Whitepaper Modal -->
        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden transition-opacity opacity-0">
            <div class="modal-content tk-glass bg-zinc-900/90 border border-zinc-700 rounded-2xl p-6 md:p-8 w-full max-w-md relative transform scale-95 transition-transform duration-300">
                <button id="closeModalBtn" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <i class="fa-solid fa-xmark text-xl md:text-2xl"></i>
                </button>
                
                <div class="text-center mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-file-pdf text-amber-400 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Documentation</h3>
                    <p class="text-zinc-400 text-sm mt-1">Technical papers & architecture</p>
                </div>
                
                <div class="space-y-3">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" 
                       class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <div class="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">Tokenomics Paper</div>
                            <div class="text-zinc-500 text-xs">Distribution Models</div>
                        </div>
                        <i class="fa-solid fa-download text-zinc-600 group-hover:text-white transition-colors"></i>
                    </a>
                    
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" 
                       class="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 transition-all group">
                        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <i class="fa-solid fa-network-wired"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <div class="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">Ecosystem Architecture</div>
                            <div class="text-zinc-500 text-xs">Technical Overview</div>
                        </div>
                        <i class="fa-solid fa-download text-zinc-600 group-hover:text-white transition-colors"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
};

// ==========================================================
//  4. EXPORT
// ==========================================================

export const TokenomicsPage = {
    render() {
        injectTokenomicsStyles();
        renderTokenomicsContent();
        setupTokenomicsListeners();
    },
    init() { 
        setupTokenomicsListeners(); 
    },
    update(isConnected) { 
        setupTokenomicsListeners(); 
    }
};