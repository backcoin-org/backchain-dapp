// pages/AboutPage.js
// ✅ VERSÃO FINAL V3.0: "The Architect's Legacy" - Hub & Spoke Focus + Anonymous Origin

import { showToast } from '../ui-feedback.js';

// --- CSS FX (VISUALIZATION) ---
const style = document.createElement('style');
style.innerHTML = `
    .glass-card {
        background: rgba(15, 15, 20, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    }
    .glass-card:hover {
        border-color: rgba(251, 191, 36, 0.3);
        transform: translateY(-3px);
    }
    .text-gradient-gold {
        background: linear-gradient(to right, #fbbf24, #d97706);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* HUB & SPOKE VISUALIZATION */
    .hub-circle {
        width: 100px; height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(0,0,0,0) 70%);
        border: 2px solid #fbbf24;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 30px rgba(251,191,36,0.3);
        z-index: 10;
        position: relative;
    }
    .spoke-line {
        height: 2px;
        background: linear-gradient(90deg, rgba(251,191,36,0.5) 0%, rgba(255,255,255,0.1) 100%);
        width: 100%;
        margin: 10px 0;
    }
    .spoke-item {
        border-left: 2px solid rgba(255,255,255,0.1);
        padding-left: 15px;
    }
`;
document.head.appendChild(style);

const renderAboutContent = () => {
    const aboutContainer = document.getElementById('about');
    if (!aboutContainer) return;

    aboutContainer.innerHTML = `
        <div class="container mx-auto max-w-5xl py-12 px-4 animate-fadeIn">
            
            <div class="text-center mb-20">
                <div class="inline-block p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                    <i class="fa-solid fa-user-secret text-2xl text-amber-500"></i>
                </div>
                <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white uppercase">
                    The Silent <br><span class="text-gradient-gold">Architects</span>
                </h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                    Backchain was not built by a corporation. It was forged by a collective of <strong class="text-white">anonymous enthusiasts</strong> united by a single vision: to leave a legacy of true decentralization. We built the engine, locked the keys, and handed it to you.
                </p>
            </div>

            <section class="mb-24">
                <div class="glass-card rounded-3xl p-8 md:p-12 border border-zinc-800 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span class="text-amber-500 font-bold tracking-widest text-xs uppercase mb-2 block">THE CORE TECHNOLOGY</span>
                            <h2 class="text-3xl font-bold text-white mb-6">Hub & Spoke Architecture</h2>
                            <p class="text-zinc-400 mb-6 leading-relaxed">
                                Unlike traditional monolithic blockchains, Backchain uses a modular design. The <strong>Hub (EcosystemManager)</strong> is the immutable brain that defines the rules. The <strong>Spokes</strong> are the satellite services (Fortune Pool, Notary, Market) that plug into the Hub.
                            </p>
                            <p class="text-zinc-400 mb-6">
                                This means anyone can build a new "Spoke" service, plug it into the economy, and generate value for the entire network.
                            </p>
                            
                            <ul class="space-y-3 mt-6">
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-circle-nodes text-blue-500 mr-3"></i> Modular & Scalable Design
                                </li>
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-shield-halved text-blue-500 mr-3"></i> Centralized Security, Decentralized Growth
                                </li>
                                <li class="flex items-center text-sm text-zinc-300">
                                    <i class="fa-solid fa-code-branch text-blue-500 mr-3"></i> Open for Developers
                                </li>
                            </ul>
                        </div>

                        <div class="relative flex flex-col items-center justify-center py-10">
                            <div class="hub-circle flex-col text-center mb-8 animate-pulse">
                                <i class="fa-solid fa-brain text-3xl text-amber-400"></i>
                                <span class="text-[10px] font-bold text-white mt-1">THE HUB</span>
                            </div>
                            
                            <div class="w-full grid grid-cols-3 gap-4 text-center">
                                <div class="flex flex-col items-center">
                                    <div class="h-8 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-dice text-purple-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">FORTUNE</div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center transform translate-y-8">
                                    <div class="h-16 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-file-contract text-cyan-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">NOTARY</div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="h-8 w-0.5 bg-gradient-to-b from-amber-500 to-transparent"></div>
                                    <div class="glass-card p-3 rounded-xl w-full mt-2">
                                        <i class="fa-solid fa-store text-green-400 mb-2"></i>
                                        <div class="text-[10px] font-bold">MARKET</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mb-24">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-white">How You Win by Helping</h2>
                    <p class="text-zinc-400 mt-2">The ecosystem pays you to keep it alive.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🏛️</div>
                        <h3 class="text-xl font-bold text-white mb-2">Stake & Govern</h3>
                        <p class="text-sm text-zinc-400">
                            Don't just hold tokens. Lock them to secure the Hub. In return, you receive a % of EVERY transaction fee generated by the Spokes.
                        </p>
                    </div>
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-bold text-white mb-2">Play & Mine</h3>
                        <p class="text-sm text-zinc-400">
                            Using services (like Fortune Pool) isn't spending; it's mining. Proof-of-Purchase ensures that active users mint new $BKC rewards.
                        </p>
                    </div>
                    <div class="glass-card p-8 rounded-2xl">
                        <div class="text-4xl mb-4">🤝</div>
                        <h3 class="text-xl font-bold text-white mb-2">Share & Grow</h3>
                        <p class="text-sm text-zinc-400">
                            By spreading the word, you increase network volume. More volume = Higher APY for Stakers = More Value for Token Holders.
                        </p>
                    </div>
                </div>
            </section>

            <section class="text-center py-12 bg-gradient-to-b from-transparent to-amber-500/5 rounded-3xl border border-white/5">
                <img src="assets/bkc_logo_3d.png" class="w-16 h-16 mx-auto mb-6 opacity-80" alt="Logo">
                <h2 class="text-3xl font-bold text-white mb-4">Read the Full Architecture</h2>
                <p class="text-zinc-400 mb-8 max-w-lg mx-auto">Deep dive into the mathematical models and code structure that make this legacy possible.</p>
                
                <button id="openWhitepaperModalBtn" class="bg-white hover:bg-zinc-200 text-black font-black py-4 px-10 rounded-xl text-lg shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                    <i class="fa-solid fa-file-code mr-2"></i> OPEN WHITEPAPER
                </button>
            </section>

        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden transition-opacity opacity-0">
            <div class="glass-card bg-[#0a0a0a] border border-zinc-700 rounded-2xl p-8 w-full max-w-md relative transform scale-95 transition-transform duration-300">
                <button id="closeModalBtn" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-2xl"></i></button>
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-white">Technical Documentation</h3>
                    <p class="text-zinc-400 text-sm mt-2">Select a document to verify our code and vision.</p>
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
                            <div class="text-zinc-500 text-xs">Hub & Spoke Technicals</div>
                        </div>
                        <i class="fa-solid fa-download ml-auto text-zinc-600 group-hover:text-white"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
};

const setupAboutPageListeners = () => {
    const pageContainer = document.getElementById('about');
    if (!pageContainer) return;

    const modal = pageContainer.querySelector('#whitepaperModal');
    const openBtn = pageContainer.querySelector('#openWhitepaperModalBtn');
    const closeBtn = pageContainer.querySelector('#closeModalBtn');

    if (modal && openBtn && closeBtn) {
        // Remover listeners antigos clonando
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
        modal.addEventListener('click', (e) => { if(e.target === modal) close(); });
    }
};

export const AboutPage = {
    render() {
        renderAboutContent();
        setupAboutPageListeners();
    },
    init() { setupAboutPageListeners(); },
    update() { setupAboutPageListeners(); }
};