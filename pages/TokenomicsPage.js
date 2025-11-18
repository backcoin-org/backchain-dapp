// pages/TokenomicsPage.js

/**
 * Adiciona os listeners de evento para o modal do whitepaper.
 */
const setupTokenomicsListeners = () => {
    const container = document.getElementById('tokenomics');
    if (!container) return;

    const modal = container.querySelector('#whitepaperModal');
    const openBtn = container.querySelector('#openWhitepaperModalBtn');
    
    if (modal && openBtn) {
        const newOpenBtn = openBtn.cloneNode(true);
        openBtn.parentNode.replaceChild(newOpenBtn, openBtn);
        
        const newModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(newModal, modal);

        const closeBtn = newModal.querySelector('#closeModalBtn');

        const openModal = () => newModal.classList.remove('hidden');
        const closeModal = () => newModal.classList.add('hidden');

        newOpenBtn.addEventListener('click', openModal);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        newModal.addEventListener('click', (e) => {
            if (e.target === newModal) {
                closeModal();
            }
        });
    }
};


const renderTokenomicsContent = () => {
    const container = document.getElementById('tokenomics'); 
    if (!container) return;

    container.style.margin = ""; 

    container.innerHTML = `
        <div class="container mx-auto max-w-6xl py-8">
            <div class="text-center mb-16">
                <span class="text-sm font-bold text-amber-400 tracking-widest">TOKEN ECONOMICS</span>
                <h1 class="text-5xl md:text-6xl font-black mb-4 tracking-tight text-gradient">A Fair Launch Economy</h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
                    Designed for the community, funded by utility. Our tokenomics reflect our philosophy:
                    <strong>no team allocation, no private investors, 100% focused on the ecosystem.</strong>
                </p>

                <div class="mt-10">
                    <button id="openWhitepaperModalBtn" 
                       class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 inline-block cursor-pointer">
                        <i class="fa-solid fa-file-lines mr-2"></i> Download Whitepaper
                    </button>
                </div>
            </div>

            <section id="tge" class="mb-20">
                <div class="text-center mb-16">
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Initial Distribution (TGE)</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        An initial supply of <strong>40,000,000 $BKC</strong> will be generated to kickstart the economy.
                    </p>
                </div>
                
                <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div class="relative w-64 h-64 mx-auto">
                                <svg class="w-full h-full" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#52525b" stroke-width="4"></circle>
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#34d399" stroke-width="4" stroke-dasharray="17.5 82.5" stroke-dashoffset="0"></circle>
                                    <circle cx="18" cy="18" r="15.91549430918953" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="82.5 17.5" stroke-dashoffset="-17.5"></circle>
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span class="text-4xl font-bold">40M</span>
                                    <span class="text-sm text-zinc-400">TGE Supply</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-8">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-lg font-bold text-green-400">17.5% — Community Airdrop</span>
                                    <span class="font-mono text-zinc-400">7,000,000</span>
                                </div>
                                <p class="text-sm text-zinc-400">Distributed for free to early adopters and community members to ensure wide distribution and decentralization.</p>
                            </div>
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-lg font-bold text-amber-400">82.5% — Liquidity & Treasury</span>
                                    <span class="font-mono text-zinc-400">33,000,000</span>
                                </div>
                                <p class="text-sm text-zinc-400">Allocated to provide initial liquidity on DEXs and funding for the DAO Treasury (marketing & dev), fully funded by the NFT sale.</p>
                            </div>
                            <div class="pt-4 border-t border-border-color">
                                <p class="text-lg font-semibold text-white"><i class="fa-solid fa-hand-fist mr-2 text-amber-400"></i> Fair Launch</p>
                                <ul class="list-disc list-inside text-zinc-400 mt-2 space-y-1">
                                    <li><strong class="text-white">Zero</strong> team tokens.</li>
                                    <li><strong class="text-white">Zero</strong> private investor tokens.</li>
                                    <li>100% community-owned from day one.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="pop" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-cyan-400 tracking-widest">UTILITY INFLATION</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Proof-of-Purchase Mining (PoP)</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        The remaining <strong>160,000,000 $BKC</strong> (the "Mint Pool") are minted only when real economic activity occurs (e.g., Notary, Gaming, NFT Trading).
                    </p>
                </div>
                <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                    <h3 class="text-2xl font-bold text-center mb-8">Distribution of Each Mined Block</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-10"><i class="fa-solid fa-users text-6xl"></i></div>
                            <i class="fa-solid fa-layer-group text-4xl text-purple-400 mb-3"></i>
                            <p class="text-4xl font-bold text-white">85%</p>
                            <p class="text-zinc-400 mt-2">To the <strong>Global Delegator Pool</strong> (Stakers).</p>
                            <p class="text-xs text-zinc-500 mt-1">Direct reward for securing the network.</p>
                        </div>
                        <div class="text-center bg-main p-6 rounded-lg border border-border-color relative overflow-hidden">
                             <div class="absolute top-0 right-0 p-2 opacity-10"><i class="fa-solid fa-landmark text-6xl"></i></div>
                            <i class="fa-solid fa-building-columns text-4xl text-amber-400 mb-3"></i>
                            <p class="text-4xl font-bold text-white">15%</p>
                            <p class="text-zinc-400 mt-2">To the <strong>DAO Treasury</strong>.</p>
                            <p class="text-xs text-zinc-500 mt-1">For sustainability and growth.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="locking" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-purple-400 tracking-widest">VALUE MECHANICS</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Locking & Scarcity</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        The system incentivizes long-term holding through pStake and fee redistribution.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-sidebar border border-border-color rounded-xl p-8">
                        <h3 class="text-2xl font-bold mb-6"><i class="fa-solid fa-lock mr-3 text-purple-400"></i> Lock-Up Incentives</h3>
                        <ul class="space-y-4">
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Delegator pStake:</strong> Users lock tokens from 1 day to 10 years. Longer locks = Higher pStake = More Rewards.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Reduced Supply:</strong> Every service interaction (Game, Notary) locks tokens temporarily or permanently in the ecosystem pools.</div></li>
                        </ul>
                    </div>
                    <div class="bg-sidebar border border-border-color rounded-xl p-8">
                        <h3 class="text-2xl font-bold mb-6"><i class="fa-solid fa-fire-alt mr-3 text-amber-400"></i> Fee Redirection</h3>
                        <ul class="space-y-4">
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Staking Fees:</strong> Small fees on unstaking/claiming are redistributed to the Treasury to fund development.</div></li>
                            <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">NFT Tax:</strong> 10% tax on Booster sales. Part goes to liquidity, part recycles into the reward pool.</div></li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 hidden" style="backdrop-filter: blur(5px);">
            <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12 w-full max-w-lg relative text-left shadow-lg">
                <button id="closeModalBtn" class="absolute top-4 right-5 text-zinc-500 hover:text-white text-3xl leading-none">&times;</button>
                <h3 class="text-2xl font-bold text-white mb-6">Download Whitepaper</h3>
                <div class="space-y-4">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" target="_blank" rel="noopener noreferrer" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform hover:scale-105 w-full text-center inline-block">
                        <i class="fa-solid fa-file-lines mr-2"></i> $BKC Tokenomics Whitepaper
                    </a>
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" target="_blank" rel="noopener noreferrer" class="bg-cyan-500 hover:bg-cyan-600 text-zinc-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform hover:scale-105 w-full text-center inline-block">
                        <i class="fa-solid fa-sitemap mr-2"></i> Backchain Ecosystem Whitepaper
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
    init() {
        setupTokenomicsListeners();
    },
    update(isConnected) {
        setupTokenomicsListeners();
    }
};