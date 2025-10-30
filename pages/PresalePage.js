// pages/PresalePage.js

const ethers = window.ethers;
import { DOMElements } from '../dom-elements.js';
import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, publicSaleABI } from '../config.js';

// --- V8.8 (User Request): Revolutionary Features & Enthusiast Developer Narrative ---
// --- V8.9 (User Request): Changed #advantage section ID to #decentralized-notary and removed footer ---

const PRESALE_CONFIG = {
    countdownDate: "2025-11-20T23:59:59",
    nftTiers: [
        { id: 0, name: "Diamond", boost: "+50%", price: "7.20 BNB", discountedPrice: "3.60 BNB", img: "ipfs://bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i", color: "text-cyan-400" },
        { id: 1, name: "Platinum", boost: "+40%", price: "2.88 BNB", discountedPrice: "1.44 BNB", img: "ipfs://bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", color: "text-gray-300" },
        { id: 2, name: "Gold", boost: "+30%", price: "1.08 BNB", discountedPrice: "0.54 BNB", img: "ipfs://bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", color: "text-amber-400" },
        { id: 3, name: "Silver", boost: "+20%", price: "0.54 BNB", discountedPrice: "0.27 BNB", img: "ipfs://bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", color: "text-gray-400" },
        { id: 4, name: "Bronze", boost: "+10%", price: "0.288 BNB", discountedPrice: "0.144 BNB", img: "ipfs://bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", color: "text-yellow-600" },
        { id: 5, name: "Iron", boost: "+5%", price: "0.14 BNB", discountedPrice: "0.07 BNB", img: "ipfs://bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm", color: "text-slate-500" },
        { id: 6, name: "Crystal", boost: "+1%", price: "0.02 BNB", discountedPrice: "0.01 BNB", img: "ipfs://bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay", color: "text-indigo-300" }
    ],
    translations: {
        en: {
            insufficientFunds: "Insufficient funds...", userRejected: "Transaction rejected...",
            soldOut: "Sale Error. Please try again later.", 
            txPending: "Awaiting confirmation...", txSuccess: "Purchase successful!", txError: "Transaction Error:", buyAlert: "Please connect your wallet first.", saleContractNotConfigured: "Sale contract address not configured.", invalidQuantity: "Please select a valid quantity (1 or more).", txRejected: "Transaction rejected.",
            
            heroTitle1: "This is Not Just Another Project.",
            heroTitle2: `This is the Backchain Revolution.`, 
            heroSubtitle: `Built by a passionate group of crypto developers over <strong>thousands of hours</strong>, Backchain is a <strong>revolutionary decentralized ecosystem</strong> for the $BKC utility token. We are self-funded (No VCs, No team tokens) and <strong>100% of this sale funds liquidity and marketing</strong>. This is your chance to acquire a <strong>rare item with guaranteed value</strong> and join a project with features never seen in crypto. Don't be left out.`,
            heroBtn1: "Join the Revolution (50% OFF)",
            heroBtn2: "What is 'Guaranteed Liquidity'?",
            
            heroStockBar: "Batch 1 Progress:", 
            liquidityTag: "THE END OF 'STUCK' NFTS",
            liquidityTitle: "Guaranteed Immediate Liquidity.",
            liquiditySubtitle: `We built a dedicated AMM Liquidity Pool for the Booster NFT. You can <strong>sell yours at any time</strong> for $BKC at a <strong>dynamic price</strong>, based on supply and demand. Real utility, real liquidity.`,
            
            liquidityCol1Title: "The Old Way (Slow & Risky)",
            liquidityCol1Desc: "List on a public marketplace, <strong>wait for a buyer</strong>, and pay high platform fees (5-10%) + royalties just to sell.",
            liquidityCol2Title: "The Backchain Way (Instant & Fair)",
            liquidityCol2Desc: "Sell <strong>instantly</strong>, 24/7, directly to our AMM pool with a low, predictable ecosystem fee. No waiting, no haggling.",
            
            advantageTag: "A TRULY REVOLUTIONARY ECOSYSTEM",
            advantageTitle: "Pioneering Decentralized Features.",
            advantageSubtitle: `The $BKC ecosystem is already live with features you won't find anywhere else. Your Booster NFT is the key to maximizing all of them.`,
            advantage1Title: "Decentralized Notary",
            advantage1Desc: "A first-in-crypto feature. Anyone can register documents on the blockchain, decentralized and immutable, creating irrefutable proof of existence.",
            advantage2Title: "Decentralized Campaigns",
            advantage2Desc: "Create or join sports and lottery campaigns. A 100% decentralized and <strong>fraud-proof 'Tigrinho'</strong> where $BKC is the prize, and the draw is fully automated by smart contract.",
            advantage3Title: "Charitable Campaigns",
            advantage3Desc: "Launch or fund transparent, decentralized fundraising campaigns for social causes, ensuring trust and traceability of every donation.",
            advantage4Title: "Your Rare NFT (Guaranteed Value)",
            advantage4Desc: `After this presale, minting is <strong>permanently disabled</strong>. This one-time item (scarcity) has <strong>guaranteed $BKC value appreciation</strong> built into its dedicated liquidity pool.`,

            saleTag: "BATCH 1: 50% DISCOUNT",
            saleTitle: "Choose Your Power",
            saleTimerTitle: "Batch 1 (50% OFF) Ends In:",
            countdownDays: "Days", countdownHours: "Hrs", countdownMinutes: "Mins",
            cardPriceBatch2: "Batch 2 Price:",
            cardPriceBatch1: "Batch 1 (50% OFF):",
            cardQuantityLabel: "Quantity:", 
            
            cardAdvTitle: "Core Advantages:",
            cardAdv1: "<strong>Multiplies Stake/PoP Rewards</strong>",
            cardAdv2: "<strong>Reduces Ecosystem Service Fees</strong>",
            cardAdv3: "Guaranteed Immediate Pool Liquidity",
            cardAdv4: "<strong>Rare & Fundamental</strong> ecosystem key",
            cardAdv5: "<strong>Guaranteed $BKC Value</strong>: A fee from every trade feeds the pool, constantly raising the NFT's floor price.",
            
            cardBtnConnect: "Connect Wallet to Buy",
            cardBtnBuy: "Acquire Now",
            anchorBtn: "Secure Your NFT",
            fundingTag: "100% TRANSPARENT FUNDING",
            fundingTitle: "100% Focused on Launch.",
            fundingSubtitle: "All funds from this presale (Batch 1) are used <strong>exclusively</strong> for initial liquidity and marketing.",
            funding1Title: "Guaranteed Liquidity",
            funding1Desc: "A large portion goes <strong>directly</strong> into the $BKC and Booster NFT Liquidity Pools, guaranteeing stability and value for <strong>your item</strong> from Day 1.",
            funding2Title: "Strategic Marketing",
            funding2Desc: `Funds to attract thousands of new users. More users = more transactions = <strong>higher demand for the Boosters.</strong>`,
            funding3Title: "Fair Launch Commitment",
            funding3Desc: "No VCs. No private allocations. This sale funds a truly community-driven and fair launch.",
            
            roadmapTag: "OUR FLIGHT PLAN", 
            roadmapTitle: "Building the Future, Together.",
            roadmapSubtitle: "The future is promising for $BKC, don't be left out. This presale is just the beginning...",
            
            roadmap1Title: "<i class='fa-solid fa-check-circle mr-3'></i>Phase 1: Foundation (Completed)",
            roadmap1Desc: "Core smart contracts developed, audited, and rigorously tested.",
            roadmap2Title: "<i class='fa-solid fa-rocket mr-3'></i>Phase 2: Launch & Liquidity (You Are Here)",
            roadmap2Desc: "NFT Presale funds liquidity & marketing. $BKC token and dApp launch on Mainnet.",
            roadmap3Title: "<i class='fa-solid fa-satellite-dish mr-3'></i>Phase 3: Ecosystem Expansion",
            roadmap3Desc: "Launch Community Actions, integrate partners, pursue major exchange listings.",
            roadmap4Title: "<i class='fa-solid fa-landmark-flag mr-3'></i>Phase 4: True Decentralization",
            roadmap4Desc: "Full DAO implementation, handing over protocol governance to the $BKC holders.",
            
            // footerText removido
        }
    }
};

let currentLang = 'en';
let countdownInterval = null;
let hasRendered = false;
let hasInitialized = false;

// --- Funções de Página (Lógica V8.2 - Preço no botão restaurado) ---

function setLanguage(lang = 'en') {
    // Força 'en' já que é a única língua
    currentLang = 'en';
    const translation = PRESALE_CONFIG.translations.en;
    
    document.querySelectorAll('#presale [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translation[key]) {
             el.innerHTML = translation[key];
        } else if (!el.dataset.dynamicContent) {
            // Mantém original se não for dinâmico e não tiver tradução
        }
    });
    document.querySelectorAll('#presale .nft-card').forEach(card => {
        updateTotalPrice(card);
    });
    updateBuyButtonsState(State.isConnected);
}

function updateBuyButtonsState(isConnected) {
    const translation = PRESALE_CONFIG.translations.en;
    document.querySelectorAll('#presale .buy-button').forEach(button => {
        const card = button.closest('.nft-card');
        if (!card) return;
        button.disabled = !isConnected;
        if (!isConnected) {
            button.innerHTML = `<i class='fa-solid fa-wallet mr-2'></i> ${translation.cardBtnConnect || "Connect Wallet"}`;
        } else {
            updateTotalPrice(card);
        }
    });
}

function updateTotalPrice(card) {
    const quantityInput = card.querySelector('.quantity-input');
    const buyButton = card.querySelector('.buy-button');
    if (!buyButton || !quantityInput) return;
    if (!State.isConnected) return; 

    const priceString = buyButton.dataset.price;
    const quantity = parseInt(quantityInput.value, 10);
    const translation = PRESALE_CONFIG.translations.en;

    if (isNaN(quantity) || quantity <= 0) {
        buyButton.innerHTML = `<i class='fa-solid fa-warning mr-2'></i> Inválido`;
        buyButton.dataset.dynamicContent = "true";
        return;
    }

    const pricePerItem = parseFloat(priceString.split(" ")[0]);
    const totalPrice = (pricePerItem * quantity).toFixed(4);
    const formattedTotalPrice = parseFloat(totalPrice).toString(); 
    const buyText = translation.cardBtnBuy || "Acquire Now";
    
    buyButton.innerHTML = `<i class='fa-solid fa-cart-shopping mr-2'></i>${buyText} (${formattedTotalPrice} BNB)`;
    buyButton.dataset.dynamicContent = "true";
}

async function handleBuyNFT(button) {
    const translations = PRESALE_CONFIG.translations.en;
    if (!State.signer) { return showToast(translations.buyAlert, 'error'); }
    if (!addresses.publicSale || addresses.publicSale === "0x...") { return showToast(translations.saleContractNotConfigured, 'error'); }
    
    const card = button.closest('.nft-card');
    const quantityInput = card.querySelector('.quantity-input');
    const quantity = parseInt(quantityInput.value, 10);
    
    if (isNaN(quantity) || quantity <= 0) { return showToast(translations.invalidQuantity, 'error'); }
    
    const tierId = button.dataset.tierId;
    const priceString = button.dataset.price; 
    const originalButtonHTML = button.innerHTML; 
    
    try {
        button.disabled = true;
        button.innerHTML = `<span class="loader !border-t-black mr-2"></span> ${translations.txPending}`;
        
        const pricePerItem = ethers.parseUnits(priceString.split(" ")[0], 18);
        const totalPrice = pricePerItem * BigInt(quantity);
        
        const saleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, State.signer);

        const tx = await saleContract.buyMultipleNFTs(tierId, quantity, { value: totalPrice });
        showToast(translations.txPending, 'info');
        
        const receipt = await tx.wait();
        showToast(translations.txSuccess, 'success', receipt.hash);
        
    } catch (error) {
        console.error("Presale Buy Error:", error);
        let errorMessage;
        if (error.code === 'INSUFFICIENT_FUNDS') { errorMessage = translations.insufficientFunds; }
        else if (error.code === 4001 || error.code === 'ACTION_REJECTED') { errorMessage = translations.userRejected; }
        else if (error.reason) {
             if (error.reason.includes("Valor BNB incorreto")) { errorMessage = "Incorrect BNB value sent."; }
             else { errorMessage = error.reason; }
        } else if (error.data?.message) { errorMessage = error.data.message; }
        else { errorMessage = error.message || translations.txRejected; }
        showToast(`${translations.txError} ${errorMessage}`, 'error');
    } finally {
        button.disabled = false;
        updateBuyButtonsState(State.isConnected); 
    }
}

function setupCountdown() {
    // ... (Esta função permanece inalterada) ...
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownDate = new Date(PRESALE_CONFIG.countdownDate).getTime();
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    if (!daysEl || !hoursEl || !minutesEl) { console.warn("Countdown elements not found in #sale section."); return; }
    const update = () => {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        if (distance < 0) {
            clearInterval(countdownInterval);
            const container = document.getElementById('countdown-container');
            // Manteve o texto original em PT, vamos trocar para EN
            if(container) container.innerHTML = `<p class="text-2xl font-bold text-red-500">SALE ENDED!</p>`;
            return;
        }
        const d = String(Math.floor(distance / 86400000)).padStart(2, '0');
        const h = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
        const m = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
        daysEl.textContent = d; daysEl.dataset.dynamicContent = "true";
        hoursEl.textContent = h; hoursEl.dataset.dynamicContent = "true";
        minutesEl.textContent = m; minutesEl.dataset.dynamicContent = "true";
    };
    update();
    countdownInterval = setInterval(update, 1000);
}

function setupScrollAnimations() {
    // ... (Esta função permanece inalterada) ...
    if (!('IntersectionObserver' in window)) {
         document.querySelectorAll('#presale .fade-in-section, #presale .roadmap-item').forEach(section => { section.classList.add('is-visible'); }); return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('#presale .fade-in-section, #presale .roadmap-item').forEach(section => { observer.observe(section); });
}


// --- Render Marketplace (V8.2 - HTML Limpo) ---
function renderMarketplace() {
    // ... (Esta função permanece inalterada) ...
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;

    const getHttpUrl = (ipfsUri) => {
        if (!ipfsUri || typeof ipfsUri !== 'string') return '';
        if (ipfsUri.startsWith('ipfs://')) {
            return `https://ipfs.io/ipfs/${ipfsUri.substring(7)}`;
        }
        return ipfsUri;
    };

    grid.innerHTML = PRESALE_CONFIG.nftTiers.map(tier => `
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl flex flex-col nft-card group overflow-hidden" data-tier-id="${tier.id}">
            <div class="w-full h-48 overflow-hidden bg-presale-bg-darker">
                <img src="${getHttpUrl(tier.img)}" alt="${tier.name}" class="w-full h-full object-cover nft-card-image"/>
            </div>
            <div class="p-4 flex flex-col flex-1">
                <h3 class="text-2xl font-bold ${tier.color}">${tier.name}</h3>
                <p class="text-3xl font-bold text-green-400 mb-4">${tier.boost}</p>
                <div class="w-full text-left bg-presale-bg-main p-4 rounded-lg my-2">
                    <p class="text-sm font-bold text-amber-400 mb-2" data-translate="cardAdvTitle"></p>
                    
                    <ul class="space-y-2 text-sm list-none list-inside text-text-secondary">
                        <li class="flex items-center gap-2"><i class="fa-solid fa-star text-amber-400 w-4 text-center"></i><span data-translate="cardAdv1"></span></li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-star text-amber-400 w-4 text-center"></i><span data-translate="cardAdv2"></span></li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-check text-green-500 w-4 text-center"></i><span data-translate="cardAdv3"></span></li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-gem text-cyan-400 w-4 text-center"></i><span data-translate="cardAdv4"></span></li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-arrow-trend-up text-green-400 w-4 text-center"></i><span data-translate="cardAdv5"></span></li>
                    </ul>
                    
                </div>
                <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-2">
                    <p class="text-sm text-text-secondary line-through">
                        <span data-translate="cardPriceBatch2"></span> ${tier.price}
                    </p>
                    <p class="font-bold text-2xl text-green-400">${tier.discountedPrice}</p>
                    <p class="text-xs font-bold text-amber-400" data-translate="cardPriceBatch1"></p>
                </div>

                <div class="my-3 w-full">
                    <label class="block text-center text-sm font-medium text-text-secondary mb-1" data-translate="cardQuantityLabel"></label>
                    <div class="quantity-selector">
                        <button class="quantity-btn quantity-minus">-</button>
                        <input type="number" class="quantity-input" value="1" min="1">
                        <button class="quantity-btn quantity-plus">+</button>
                    </div>
                </div>

                <button class="w-full btn-primary font-bold py-2.5 px-4 rounded-md buy-button mt-auto" disabled data-translate="cardBtnConnect" data-tier-id="${tier.id}" data-price="${tier.discountedPrice}">
                    Connect Wallet to Buy
                </button>
            </div>
        </div>
    `).join('');
}


// --- Exported Page Object ---

export const PresalePage = {
    // --- render() (HTML V8.3 - Limpo, Default 'en') ---
    render: () => {
        if (hasRendered) {
            PresalePage.update(State.isConnected);
            return;
        }

        const html = `
            <main id="presale-content" class="relative pb-20">
                <section class="relative text-center py-24 lg:py-40 px-4 overflow-hidden" style="background-color: var(--presale-bg-darker);">
                   <div class="absolute inset-0 bg-gradient-to-b from-presale-bg-darker via-presale-bg-darker/80 to-transparent z-0"></div>
                   <div class="relative z-10">
                       <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                           <span data-translate="heroTitle1"></span>
                           <span class="block presale-text-gradient" data-translate="heroTitle2"></span>
                       </h1>
                       <p class="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10" data-translate="heroSubtitle"></p>
                       <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                           <a href="#sale" class="w-full sm:w-auto inline-block btn-primary font-bold py-4 px-10 rounded-lg text-lg transform hover:scale-105 transition-transform">
                               <i class="fa-solid fa-tags mr-2"></i> <span data-translate="heroBtn1"></span>
                           </a>
                           <a href="#liquidity" class="w-full sm:w-auto inline-block bg-transparent border-2 border-presale-border-color hover:bg-presale-bg-card text-text-primary font-bold py-4 px-10 rounded-lg text-lg transition-colors" data-translate="heroBtn2">
                           </a>
                       </div>
                       <div class="max-w-xl mx-auto mt-10 fade-in-section">
                            <p class="font-bold text-lg mb-3 text-red-400" data-translate="heroStockBar"></p>
                            <div class="w-full bg-presale-bg-card border border-presale-border-color rounded-full h-4 overflow-hidden">
                               <div id="presale-progress-bar" class="bg-gradient-to-r from-red-500 to-amber-500 h-4" style="width: 10%;"></div>
                            </div>
                       </div>
                   </div>
                </section>

                <section id="liquidity" class="py-20 lg:py-28 px-4 fade-in-section" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-6xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-cyan-400 tracking-widest" data-translate="liquidityTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="liquidityTitle"></h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="liquiditySubtitle"></p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="p-8 bg-presale-bg-card rounded-lg border-2 border-red-800/50 text-center opacity-70">
                                <i class="fa-solid fa-hourglass-end text-5xl text-red-400 mb-6"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="liquidityCol1Title"></h3>
                                <p class="text-text-secondary text-lg" data-translate="liquidityCol1Desc"></p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border-2 border-green-500/50 text-center transform md:scale-105 relative">
                                 <div class="absolute -top-3 -right-3 px-3 py-1 bg-green-500 text-black text-sm font-bold rounded-full uppercase shadow-lg">Guaranteed</div>
                                <i class="fa-solid fa-rocket text-5xl text-green-400 mb-6"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="liquidityCol2Title"></h3>
                                <p class="text-text-secondary text-lg" data-translate="liquidityCol2Desc"></p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="decentralized-notary" class="py-20 lg:py-28 px-4 fade-in-section">
                <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-cyan-400 tracking-widest" data-translate="advantageTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="advantageTitle"></h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="advantageSubtitle"></p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color transform hover:-translate-y-2 transition-transform duration-300">
                                <i class="fa-solid fa-file-signature text-4xl text-blue-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="advantage1Title"></h3>
                                <p class="text-text-secondary" data-translate="advantage1Desc"></p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color transform hover:-translate-y-2 transition-transform duration-300">
                                <i class="fa-solid fa-trophy text-4xl text-amber-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="advantage2Title"></h3>
                                <p class="text-text-secondary" data-translate="advantage2Desc"></p>
                            </div>
                             <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color transform hover:-translate-y-2 transition-transform duration-300">
                                <i class="fa-solid fa-hand-holding-heart text-4xl text-pink-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="advantage3Title"></h3>
                                <p class="text-text-secondary" data-translate="advantage3Desc"></p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color transform hover:-translate-y-2 transition-transform duration-300">
                                <i class="fa-solid fa-gem text-4xl text-green-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="advantage4Title"></h3>
                                <p class="text-text-secondary" data-translate="advantage4Desc"></p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="sale" class="py-20 lg:py-28 px-4 fade-in-section">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-12">
                            <span class="text-sm font-bold text-amber-400 tracking-widest" data-translate="saleTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold presale-text-gradient mt-4" data-translate="saleTitle"></h2>
                        </div>

                        <div id="countdown-container" class="max-w-xl mx-auto mb-12">
                            <p class="font-bold text-lg mb-4 text-amber-400 animate-pulse" data-translate="saleTimerTitle"></p>
                            <div class="grid grid-cols-3 gap-2 sm:gap-4 text-center font-mono">
                                <div><div id="days" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownDays"></p></div>
                                <div><div id="hours" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownHours"></p></div>
                                <div><div id="minutes" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownMinutes"></p></div>
                            </div>
                        </div>

                        <div id="marketplace-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Cards Renderizados Aqui */}
                        </div>
                    </div>
                </section>

                <section id="funding" class="py-20 lg:py-28 px-4 fade-in-section" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-6xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-amber-400 tracking-widest" data-translate="fundingTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="fundingTitle"></h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="fundingSubtitle"></p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color text-center">
                                <i class="fa-solid fa-water text-4xl text-blue-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="funding1Title"></h3>
                                <p class="text-text-secondary" data-translate="funding1Desc"></p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color text-center">
                                <i class="fa-solid fa-bullhorn text-4xl text-purple-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="funding2Title"></h3>
                                <p class="text-text-secondary" data-translate="funding2Desc"></p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color text-center">
                                <i class="fa-solid fa-shield-halved text-4xl text-green-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="funding3Title"></h3>
                                <p class="text-text-secondary" data-translate="funding3Desc"></p>
                            </div>
                        </div>
                    </div>
                </section>

                 <section class="py-20 lg:py-28 px-4 fade-in-section" style="background-color: var(--presale-bg-darker);">
                     <div class="container mx-auto max-w-4xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-purple-400 tracking-widest" data-translate="roadmapTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="roadmapTitle"></h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="roadmapSubtitle"></p>
                        </div>
                        <div class="relative pl-8 border-l-2 border-presale-border-color">
                             <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold text-amber-400" data-translate="roadmap1Title"></h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap1Desc"></p>
                            </div>
                            <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap2Title"></h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap2Desc"></p>
                            </div>
                            <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap3Title"></h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap3Desc"></p>
                            </div>
                            <div class="roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap4Title"></h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap4Desc"></p>
                            </div>
                        </div>
                    </div>
                </section>

                <a href="#sale" title="Secure Your NFT" class="fixed bottom-6 right-6 z-30 btn-primary p-4 rounded-full text-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                    <i class="fa-solid fa-tags"></i>
                    <span class="sr-only" data-translate="anchorBtn"></span>
                </a>
            </main>
        `;

        DOMElements.presale.innerHTML = html;
        renderMarketplace();
        hasRendered = true;
        // Define o idioma para 'en'
        setLanguage('en');
    },

    // --- init() (V8.2 - Lógica de clique restaurada) ---
    init: () => {
        if (hasInitialized) { return; }
        const grid = document.getElementById('marketplace-grid');
        if (grid) {
             grid.addEventListener('click', (e) => {
                const buyButton = e.target.closest('.buy-button');
                if (buyButton) { handleBuyNFT(buyButton); return; }
                const card = e.target.closest('.nft-card');
                if (!card) return;
                const minusBtn = e.target.closest('.quantity-minus');
                const plusBtn = e.target.closest('.quantity-plus');
                if (minusBtn || plusBtn) {
                    const input = card.querySelector('.quantity-input');
                    if (!input) return;
                    let val = parseInt(input.value);
                    if (minusBtn && val > 1) { input.value = val - 1; }
                    else if (plusBtn) { input.value = val + 1; } 
                    updateTotalPrice(card); // Chama a função para validar e atualizar o preço
                }
            });
            grid.addEventListener('input', (e) => {
                const input = e.target.closest('.quantity-input');
                if (input) {
                    const card = input.closest('.nft-card');
                    updateTotalPrice(card); // Chama a função para validar e atualizar o preço
                }
            });
        }
        setupCountdown();
        setupScrollAnimations();
        hasInitialized = true;
    },

     // --- update() (V8.2 - Lógica restaurada) ---
    update: (isConnected) => {
        updateBuyButtonsState(isConnected);
    }
};