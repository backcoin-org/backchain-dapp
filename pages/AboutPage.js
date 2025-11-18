// pages/AboutPage.js
import { showToast } from '../ui-feedback.js';

const renderAboutContent = () => {
    const aboutContainer = document.getElementById('about');
    if (!aboutContainer) return;

    aboutContainer.innerHTML = `
        <div class="container mx-auto max-w-6xl py-8">
            <div class="text-center mb-20">
                <h1 class="text-5xl md:text-6xl font-black mb-4 tracking-tight text-gradient">The Backchain Manifesto</h1>
                <p class="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
                    An overview of the self-sustaining economic engine designed to reward every participant and challenge the status quo of Web3.
                </p>

                <div class="mt-10">
                    <button id="openWhitepaperModalBtn" 
                       class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 inline-block cursor-pointer">
                        <i class="fa-solid fa-file-lines mr-2"></i> Download Whitepaper
                    </button>
                </div>
            </div>

            <section id="philosophy" class="mb-20">
                <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div class="text-center"><i class="fa-solid fa-hand-fist text-9xl text-amber-400/20"></i></div>
                        <div class="md:col-span-2">
                            <h3 class="text-3xl font-bold text-gradient mb-4">The Fair Launch Philosophy</h3>
                            
                            <p class="text-zinc-400 mb-6">
                                Backchain was born from the idea of a group of experts united by a central principle: true decentralization. Using their own resources, they initiated a project *for* the community. There is no central owner, no corporate entity, <strong>no reserved token supply, and no seed investors.</strong>
                            </p>
                            
                            <ul class="space-y-4">
                                <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">NFT-Funded Ecosystem:</strong> The entire initial funding for liquidity, marketing, and development comes from one transparent source: the public sale of our utility NFTs. These aren't just collectibles; they are power assets that grant special abilities within the dApp and can be sold at any time in our native liquidity pool.</div></li>
                                <li class="flex items-start"><i class="fa-solid fa-check-circle text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Community First:</strong> To ensure maximum decentralization from day one, <strong>35% of the initial token supply (TGE)</strong> will be distributed for free to community members who help promote and build the rebellion.</div></li>
                                
                                <li class="flex items-start">
                                    <i class="fa-solid fa-landmark text-cyan-400 mt-1 mr-3"></i>
                                    <div>
                                        <strong class="text-white">Community-Led Future:</strong> The community will decide the direction and usability of the project. Backchain was built to be governed by its participants, ensuring it evolves to meet collective needs.
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            
            <div class="border-t border-border-color my-20"></div>

            <section id="how-it-works" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-amber-400 tracking-widest">THE ECONOMIC ENGINE</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">The Self-Sustaining Value Cycle</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        Our closed-loop model ensures every action generates value that is redistributed back to its most active participants.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                            <i class="fa-solid fa-fire text-3xl text-amber-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">1. Proof-of-Purchase Mining</h3>
                        <p class="text-zinc-400">Instead of burning electricity, the network mints new tokens based on real economic activity. Key user actions, like creating a Notary record or playing in the Fortune Pool, trigger the minting of new $BKC that are sent directly to the reward pools.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                         <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-6">
                            <i class="fa-solid fa-globe text-3xl text-purple-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">2. Global Consensus Staking</h3>
                        <p class="text-zinc-400">Users lock their $BKC tokens in the Global Consensus Pool. This staking process generates pStake (Power Stake), which determines your share of the rewards generated by the ecosystem. It's simple, secure, and passive.</p>
                    </div>
                    <div class="p-8 bg-sidebar rounded-lg border border-border-color transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="flex items-center justify-center h-16 w-16 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
                            <i class="fa-solid fa-bolt text-3xl text-green-400"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3">3. Booster NFTs: The Multiplier</h3>
                        <p class="text-zinc-400">The base reward claim efficiency starts at 50%. By acquiring a Booster NFT, you amplify this efficiency up to 100% and reduce system fees. These are strategic assets that directly multiply your passive income.</p>
                    </div>
                </div>
            </section>

            <div class="border-t border-border-color my-20"></div>

            <section id="roles" class="mb-20">
                <div class="text-center mb-16">
                    <span class="text-sm font-bold text-cyan-400 tracking-widest">PARTICIPATION</span>
                    <h2 class="text-4xl md:text-5xl font-bold my-4">Your Role in the Rebellion</h2>
                    <p class="text-lg text-zinc-400 max-w-3xl mx-auto">
                        Whether you are a passive investor or an active user, there is a vital role for you.
                    </p>
                </div>
                <div class="space-y-10">
                    <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <div class="md:col-span-2">
                                <h3 class="text-3xl font-bold text-gradient mb-4">The Staker (Delegator)</h3>
                                <p class="text-zinc-400 mb-6">Stakers are the backbone of the network. By locking $BKC in the Global Pool, you stabilize the economy and earn passive income.</p>
                                <ul class="space-y-4">
                                    <li class="flex items-start"><i class="fa-solid fa-circle-check text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Earn Passive Income:</strong> Receive a share of rewards from all platform fees and Proof-of-Purchase Mining.</div></li>
                                    <li class="flex items-start"><i class="fa-solid fa-circle-check text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Amplify with Time:</strong> The pStake calculation rewards long-term commitment. The longer you lock your tokens, the greater your share of the reward pool.</div></li>
                                </ul>
                            </div>
                            <div class="text-center"><i class="fa-solid fa-users text-9xl text-purple-400/20"></i></div>
                        </div>
                    </div>
                    <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <div class="text-center md:order-2"><i class="fa-solid fa-hand-holding-dollar text-9xl text-cyan-400/20"></i></div>
                            <div class="md:col-span-2 md:order-1">
                                <h3 class="text-3xl font-bold text-gradient mb-4">The Liquidity Provider</h3>
                                <p class="text-zinc-400 mb-6">Liquidity Providers (LPs) ensure the smooth operation of the NFT market.</p>
                                <ul class="space-y-4">
                                    <li class="flex items-start"><i class="fa-solid fa-circle-check text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Instant Liquidity:</strong> By adding NFTs and $BKC to the AMM pools, you allow other users to buy and sell instantly.</div></li>
                                    <li class="flex items-start"><i class="fa-solid fa-circle-check text-green-400 mt-1 mr-3"></i><div><strong class="text-white">Earn Trading Fees:</strong> A portion of every NFT sale tax remains in the liquidity pool, increasing the value of your LP position over time.</div></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <div class="border-t border-border-color my-20"></div>

            <section id="share" class="text-center">
                 <span class="text-sm font-bold text-green-400 tracking-widest">JOIN THE CAUSE</span>
                <h2 class="text-4xl md:text-5xl font-bold my-4">Spread the Rebellion</h2>
                <p class="text-lg text-zinc-400 max-w-3xl mx-auto mb-8">
                    Our strength is our community. Share the project with your network and help us build a truly decentralized future.
                </p>
                <button id="shareProjectBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform hover:scale-105">
                    <i class="fa-solid fa-share-nodes mr-2"></i> Share the Project
                </button>
            </section>
        </div>

        <div id="whitepaperModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 hidden" style="backdrop-filter: blur(5px);">
            <div class="bg-sidebar border border-border-color rounded-xl p-8 md:p-12 w-full max-w-lg relative text-left shadow-lg">
                
                <button id="closeModalBtn" class="absolute top-4 right-5 text-zinc-500 hover:text-white text-3xl leading-none">&times;</button>
                
                <h3 class="text-2xl font-bold text-white mb-6">Download Whitepaper</h3>
                <p class="text-zinc-400 mb-8">Please select which document you would like to view.</p>
                
                <div class="space-y-4">
                    <a href="./assets/Backchain ($BKC) en V2.pdf" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform hover:scale-105 w-full text-center inline-block">
                        <i class="fa-solid fa-file-lines mr-2"></i> $BKC Tokenomics Whitepaper
                    </a>
                    
                    <a href="./assets/whitepaper_bkc_ecosystem_english.pdf" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="bg-cyan-500 hover:bg-cyan-600 text-zinc-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform hover:scale-105 w-full text-center inline-block">
                        <i class="fa-solid fa-sitemap mr-2"></i> Backchain Ecosystem Whitepaper
                    </a>
                </div>
            </div>
        </div>
    `;
};

const setupAboutPageListeners = () => {
    const pageContainer = document.getElementById('about');
    if (!pageContainer) return;

    // --- Lógica do Botão Share ---
    const shareButton = pageContainer.querySelector('#shareProjectBtn');
    if (shareButton) {
        const newShareButton = shareButton.cloneNode(true);
        shareButton.parentNode.replaceChild(newShareButton, shareButton);
        
        newShareButton.addEventListener('click', () => {
            const url = window.location.origin; 
            navigator.clipboard.writeText(url).then(() => {
                showToast('Project link copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showToast('Failed to copy link.', 'error');
            });
        });
    }

    // --- Lógica do Modal Whitepaper ---
    const modal = pageContainer.querySelector('#whitepaperModal');
    const openBtn = pageContainer.querySelector('#openWhitepaperModalBtn');
    
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

export const AboutPage = {
    render() {
        renderAboutContent();
        setupAboutPageListeners();
    },
    init() {
        setupAboutPageListeners();
    },
    update(isConnected) {
        setupAboutPageListeners();
    }
};