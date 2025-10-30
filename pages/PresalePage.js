// pages/PresalePage.js

const ethers = window.ethers;
import { DOMElements } from '../dom-elements.js';
import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, publicSaleABI } from '../config.js';

// --- CONFIGURAÇÃO (ATUALIZADA com texto do timer em INGLÊS) ---
const PRESALE_CONFIG = {
    countdownDate: "2025-11-20T23:59:59",
    nftTiers: [
        { 
            id: 0, 
            name: "Diamond", 
            boost: "+50%", 
            price: "7.20 BNB", 
            discountedPrice: "3.60 BNB", 
            img: "ipfs://bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i", 
            color: "text-cyan-400", 
            advantages: [
                "50% Max Reward Boost (Permanent) for Staking and PoP Mining.",
                "Maximum Fee Reduction across the entire Backchain ecosystem.",
                "Guaranteed instant auto-sale with the highest $BKC price (24/7 Liquidity).",
                "NFT Floor Value Appreciation with every ecosystem transaction.",
                "Priority Access to Beta Features."
            ] 
        },
        { 
            id: 1, 
            name: "Platinum", 
            boost: "40%", 
            price: "2.88 BNB", 
            discountedPrice: "1.44 BNB", 
            img: "ipfs://bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", 
            color: "text-gray-300", 
            advantages: [
                "40% Max Reward Boost for Staking and PoP Mining.",
                "High Fee Reduction on services and campaigns.",
                "Guaranteed instant auto-sale in the dedicated AMM Pool (24/7 Liquidity).",
                "NFT Floor Value Appreciation with every ecosystem transaction.",
                "Early Access to Key Features."
            ] 
        },
        { 
            id: 2, 
            name: "Gold", 
            boost: "30%", 
            price: "1.08 BNB", 
            discountedPrice: "0.54 BNB", 
            img: "ipfs://bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", 
            color: "text-amber-400", 
            advantages: [
                "30% Solid Reward Boost for Staking and PoP Mining.",
                "Moderate Ecosystem Fee Reduction.",
                "Guaranteed instant auto-sale (24/7 Liquidity).",
                "NFT Floor Value Appreciation with every ecosystem transaction.",
                "Guaranteed Liquidity Access."
            ] 
        },
        { 
            id: 3, 
            name: "Silver", 
            boost: "20%", 
            price: "0.54 BNB", 
            discountedPrice: "0.27 BNB", 
            img: "ipfs://bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", 
            color: "text-gray-400", 
            advantages: [
                "20% Good Reward Boost for Staking and PoP Mining.",
                "Basic Ecosystem Fee Reduction.",
                "Guaranteed instant auto-sale (24/7 Liquidity).",
                "NFT Floor Value Appreciation with every ecosystem transaction."
            ] 
        },
        { 
            id: 4, 
            name: "Bronze", 
            boost: "10%", 
            price: "0.288 BNB", 
            discountedPrice: "0.144 BNB", 
            img: "ipfs://bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", 
            color: "text-yellow-600", 
            advantages: [
                "10% Standard Reward Boost for Staking and PoP Mining.",
                "Access to the Liquidity Pool for Instant Sale.",
                "NFT Floor Value Appreciation."
            ] 
        },
        { 
            id: 5, 
            name: "Iron", 
            boost: "5%", 
            price: "0.14 BNB", 
            discountedPrice: "0.07 BNB", 
            img: "ipfs://bafybeidta4mytpfqtnnrspzij63m4lcnkp6l42m7hnhyjxioci5jhcf3vm", 
            color: "text-slate-500", 
            advantages: [
                "5% Entry Reward Boost for Staking and PoP Mining.",
                "Access to the Liquidity Pool for Instant Sale."
            ] 
        },
        { 
            id: 6, 
            name: "Crystal", 
            boost: "1%", 
            price: "0.02 BNB", 
            discountedPrice: "0.01 BNB", 
            img: "ipfs://bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay", 
            color: "text-indigo-300", 
            advantages: [
                "1% Minimal Reward Boost for Staking and PoP Mining."
            ] 
        }
    ],
    translations: {
        en: {
            insufficientFunds: "Insufficient funds...", userRejected: "Transaction rejected...",
            soldOut: "Sale Error. Please try again later.", 
            txPending: "Awaiting confirmation...", txSuccess: "Purchase successful!", txError: "Transaction Error:", buyAlert: "Please connect your wallet first.", saleContractNotConfigured: "Sale contract address not configured.", invalidQuantity: "Please select a valid quantity (1 or more).", txRejected: "Transaction rejected.",
            
            heroTitle1: "Secure Your Utility.",
            heroTitle2: `50% OFF Booster Sale.`, 
            heroSubtitle: `The Booster NFT is a one-time item that guarantees permanent utility within the Backchain ecosystem. Acquire yours at a 50% discount during Batch 1.`,
            heroBtn1: "View Sale",
            heroBtn2: "Core Benefits",
            
            heroStockBar: "Batch 1 Progress:", 

            keyBenefitsTag: "MAXIMIZE YOUR RETURN",
            keyBenefitsTitle: "Instant Utility & Guaranteed Value.",
            keyBenefitsSubtitle: "Your Booster NFT is the key to maximizing rewards and enjoying unparalleled stability in the ecosystem.",
            keyBenefit1Title: "Reward Multiplier",
            keyBenefit1Desc: "Permanently boost your $BKC earning rate from staking and PoP mining (up to +50%). *All Tiers*",
            keyBenefit2Title: "Guaranteed Liquidity",
            keyBenefit2Desc: "Sell instantly 24/7 back to the dedicated AMM pool for a dynamic $BKC price. No marketplace waiting. *Tiers Gold and above*",
            keyBenefit3Title: "Fee Reduction",
            keyBenefit3Desc: "Reduce service fees across the entire ecosystem, including the decentralized notary and campaigns. *Tiers Silver and above*",
            keyBenefit4Title: "Value Appreciation",
            keyBenefit4Desc: "A portion of every NFT trade constantly raises the NFT's intrinsic floor value in the liquidity pool, benefiting all holders. *Tiers Bronze and above*",
            
            saleTag: "BATCH 1: 50% DISCOUNT",
            saleTitle: "Choose Your Power",
            saleTimerTitle: "Time Remaining Until Batch 2 Price (50% Increase):", // <<< TEXTO CORRIGIDO AQUI
            countdownDays: "D", countdownHours: "H", countdownMinutes: "M", countdownSeconds: "S",
            cardPriceBatch2: "Batch 2 Price:",
            cardPriceBatch1: "Batch 1 (50% OFF):",
            cardQuantityLabel: "Quantity:", 
            
            cardAdvTitle: "Booster Advantages:",
            cardBtnConnect: "Connect Wallet to Buy",
            cardBtnBuy: "Acquire Now",
            anchorBtn: "Secure Your NFT",
        }
    }
};

let currentLang = 'en';
let countdownInterval = null;
let hasRendered = false;
let hasInitialized = false;

// --- Funções de Lógica e UI (Mantidas) ---

function setLanguage(lang = 'en') {
    currentLang = 'en';
    const translation = PRESALE_CONFIG.translations.en;
    
    document.querySelectorAll('#presale [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translation[key]) {
             el.innerHTML = translation[key];
        } else if (!el.dataset.dynamicContent) {
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
            button.removeAttribute('data-dynamic-content'); 
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
        buyButton.disabled = true;
        buyButton.innerHTML = `<i class='fa-solid fa-warning mr-2'></i> ${translation.invalidQuantity || "Inválido"}`;
        buyButton.dataset.dynamicContent = "true";
        return;
    } else {
        buyButton.disabled = false;
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
    
    try {
        button.disabled = true;
        button.innerHTML = `<span class="loader !border-t-black mr-2"></span> ${translations.txPending}`;
        
        const discountedPriceString = PRESALE_CONFIG.nftTiers.find(t => t.id == tierId)?.discountedPrice || priceString;
        const pricePerItem = ethers.parseUnits(discountedPriceString.split(" ")[0], 18);
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
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownDate = new Date(PRESALE_CONFIG.countdownDate).getTime();
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) { console.warn("Countdown elements not found in #sale section."); return; }
    
    const update = () => {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        
        if (distance < 0) {
            clearInterval(countdownInterval);
            const container = document.getElementById('countdown-container');
            if(container) container.innerHTML = `<p class="text-3xl font-bold text-red-500">SALE ENDED!</p>`;
            return;
        }
        
        const s = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
        const m = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
        const h = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
        const d = String(Math.floor(distance / 86400000)).padStart(2, '0');
        
        daysEl.textContent = d; daysEl.dataset.dynamicContent = "true";
        hoursEl.textContent = h; hoursEl.dataset.dynamicContent = "true";
        minutesEl.textContent = m; minutesEl.dataset.dynamicContent = "true";
        secondsEl.textContent = s; secondsEl.dataset.dynamicContent = "true";
    };
    update();
    countdownInterval = setInterval(update, 1000);
}

function setupScrollAnimations() {
    // CORREÇÃO: Remove a lógica de IntersectionObserver para garantir que o conteúdo seja visível.
    // Se a classe CSS 'fade-in-section' está causando opacidade zero ou translação,
    // o conteúdo não aparecerá. Vamos apenas ignorar a animação aqui.
    document.querySelectorAll('#presale .fade-in-section').forEach(section => { 
        section.classList.add('is-visible'); 
        // Se a classe 'is-visible' não existir, é melhor não fazer nada
        // Mas se houver uma classe 'fade-out' ou 'opacity-0' na seção, ela deve ser removida no CSS base.
    });
}


function renderMarketplace() {
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
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl flex flex-col nft-card group overflow-hidden shadow-xl hover:shadow-amber-500/30 transition-shadow duration-300" data-tier-id="${tier.id}">
            
            <div class="w-full h-48 overflow-hidden bg-presale-bg-darker relative">
                <img src="${getHttpUrl(tier.img)}" alt="${tier.name}" class="w-full h-full object-cover nft-card-image transition-transform duration-500 group-hover:scale-105"/>
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 class="text-3xl font-black ${tier.color} drop-shadow-lg">${tier.name}</h3>
                </div>
            </div>
            
            <div class="p-4 flex flex-col flex-1">
                <p class="text-4xl font-extrabold text-green-400 mb-4">${tier.boost}</p>
                
                <div class="w-full text-left bg-zinc-800 p-3 rounded-lg my-2 flex-1">
                    <p class="text-sm font-bold text-amber-400 mb-2 uppercase" data-translate="cardAdvTitle"></p>
                    
                    <ul class="space-y-1.5 text-sm list-none list-inside text-text-primary">
                        ${tier.advantages.map(adv => `
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check-circle text-xs text-green-500 mt-1 flex-shrink-0"></i>
                                <span>${adv}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-3">
                    <p class="text-sm text-text-secondary line-through">
                        <span data-translate="cardPriceBatch2"></span> ${tier.price}
                    </p>
                    <p class="font-bold text-3xl text-red-500">${tier.discountedPrice}</p>
                    <p class="text-xs font-bold text-amber-400 mt-1" data-translate="cardPriceBatch1"></p>
                </div>

                <div class="my-3 w-full">
                    <label class="block text-center text-sm font-medium text-text-secondary mb-1" data-translate="cardQuantityLabel"></label>
                    <div class="quantity-selector">
                        <button class="quantity-btn quantity-minus">-</button>
                        <input type="number" class="quantity-input" value="1" min="1">
                        <button class="quantity-btn quantity-plus">+</button>
                    </div>
                </div>

                <button class="w-full btn-primary font-bold py-3 px-4 rounded-lg buy-button mt-auto shadow-md" disabled data-translate="cardBtnConnect" data-tier-id="${tier.id}" data-price="${tier.discountedPrice}">
                    Connect Wallet to Buy
                </button>
            </div>
        </div>
    `).join('');
}


// --- Exported Page Object ---

export const PresalePage = {
    // --- render() (HTML COM CORES DE FUNDO EXPLÍCITAS E ANIMAÇÃO REMOVIDA) ---
    render: () => {
        // CORREÇÃO: Força a renderização completa na primeira vez.
        const html = `
            <main id="presale-content" class="relative pb-20">
                
                <section class="relative text-center py-24 lg:py-32 px-4 overflow-hidden" style="background-color: var(--presale-bg-darker);">
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
                           <a href="#key-benefits-section" class="w-full sm:w-auto inline-block bg-transparent border-2 border-presale-border-color hover:bg-presale-bg-card text-text-primary font-bold py-4 px-10 rounded-lg text-lg transition-colors" data-translate="heroBtn2">
                           </a>
                       </div>
                       <div class="max-w-xl mx-auto mt-10">
                            <p class="font-bold text-lg mb-3 text-red-400" data-translate="heroStockBar"></p>
                            <div class="w-full bg-presale-bg-card border border-presale-border-color rounded-full h-4 overflow-hidden">
                               <div id="presale-progress-bar" class="bg-gradient-to-r from-red-500 to-amber-500 h-4" style="width: 10%;"></div>
                            </div>
                       </div>
                   </div>
                </section>
                
                <section id="key-benefits-section" class="py-20 lg:py-28 px-4" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-cyan-400 tracking-widest" data-translate="keyBenefitsTag"></span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="keyBenefitsTitle"></h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="keyBenefitsSubtitle"></p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div class="p-6 bg-presale-bg-card rounded-lg border border-presale-border-color text-center transform hover:scale-[1.03] transition-transform duration-300">
                                <i class="fa-solid fa-ranking-star text-4xl text-green-400 mb-4"></i>
                                <h3 class="text-xl font-bold mb-2" data-translate="keyBenefit1Title"></h3>
                                <p class="text-text-secondary text-sm" data-translate="keyBenefit1Desc"></p>
                            </div>
                            <div class="p-6 bg-presale-bg-card rounded-lg border border-presale-border-color text-center transform hover:scale-[1.03] transition-transform duration-300">
                                <i class="fa-solid fa-water text-4xl text-blue-400 mb-4"></i>
                                <h3 class="text-xl font-bold mb-2" data-translate="keyBenefit2Title"></h3>
                                <p class="text-text-secondary text-sm" data-translate="keyBenefit2Desc"></p>
                            </div>
                             <div class="p-6 bg-presale-bg-card rounded-lg border border-presale-border-color text-center transform hover:scale-[1.03] transition-transform duration-300">
                                <i class="fa-solid fa-percent text-4xl text-purple-400 mb-4"></i>
                                <h3 class="text-xl font-bold mb-2" data-translate="keyBenefit3Title"></h3>
                                <p class="text-text-secondary text-sm" data-translate="keyBenefit3Desc"></p>
                            </div>
                            <div class="p-6 bg-presale-bg-card rounded-lg border border-presale-border-color text-center transform hover:scale-[1.03] transition-transform duration-300">
                                <i class="fa-solid fa-arrow-trend-up text-4xl text-amber-400 mb-4"></i>
                                <h3 class="text-xl font-bold mb-2" data-translate="keyBenefit4Title"></h3>
                                <p class="text-text-secondary text-sm" data-translate="keyBenefit4Desc"></p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="sale" class="py-20 lg:py-28 px-4" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-12">
                            <span class="text-sm font-bold text-amber-400 tracking-widest" data-translate="saleTag"></span>
                            <h2 class="text-5xl md:text-6xl font-black presale-text-gradient mt-4" data-translate="saleTitle"></h2>
                            <p class="mt-4 text-lg text-text-secondary" data-translate="saleTimerTitle"></p>
                        </div>

                        <div id="countdown-container" class="max-w-3xl mx-auto mb-16 p-6 bg-zinc-900 border border-amber-500/50 rounded-xl shadow-2xl">
                            <div class="grid grid-cols-4 gap-3 sm:gap-6 text-center font-mono">
                                <div><div id="days" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownDays"></p></div>
                                <div><div id="hours" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownHours"></p></div>
                                <div><div id="minutes" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownMinutes"></p></div>
                                <div><div id="seconds" class="text-4xl sm:text-5xl font-extrabold text-amber-400 bg-black/50 py-3 rounded-lg" data-dynamic-content="true">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownSeconds"></p></div>
                            </div>
                        </div>

                        <div id="marketplace-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {/* Cards Renderizados Aqui */}
                        </div>
                    </div>
                </section>

                <a href="#sale" title="Secure Your NFT" class="fixed bottom-6 right-6 z-30 btn-primary p-4 rounded-full text-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                    <i class="fa-solid fa-tags"></i>
                    <span class="sr-only" data-translate="anchorBtn"></span>
                </a>
            </main>
        `;
        
        // CORREÇÃO: Força a injeção do HTML, e somente depois inicializa.
        DOMElements.presale.innerHTML = html;
        renderMarketplace();
        hasRendered = true;
        PresalePage.init(); 
        setLanguage('en');
        // Se a página já foi navegada antes, o update será chamado via app.js
        if (State.isConnected) {
            PresalePage.update(true);
        }
    },

    // --- init() (Mantido o novo fluxo de inicialização) ---
    init: () => {
        if (hasInitialized) { 
            // Se já inicializado, apenas atualiza o estado (útil se chamado por updateUIState)
            PresalePage.update(State.isConnected);
            return; 
        }
        const grid = document.getElementById('marketplace-grid');
        if (grid) {
             grid.addEventListener('click', (e) => {
                const buyButton = e.target.closest('.buy-button');
                if (buyButton) { handleBuyNFT(buyButton); return; }
                const card = e.target.closest('.nft-card');
                if (!card) return;
                const input = card.querySelector('.quantity-input');
                if (!input) return;
                
                const minusBtn = e.target.closest('.quantity-minus');
                const plusBtn = e.target.closest('.quantity-plus');
                
                let val = parseInt(input.value);

                if (minusBtn && val > 1) { 
                    input.value = val - 1; 
                } else if (plusBtn) { 
                    input.value = val + 1; 
                } 
                
                input.dispatchEvent(new Event('input', { bubbles: true })); 
            });
            
            grid.addEventListener('input', (e) => {
                const input = e.target.closest('.quantity-input');
                if (input) {
                    const card = input.closest('.nft-card');
                    if (parseInt(input.value) < 1 || isNaN(parseInt(input.value))) {
                        input.value = 1; 
                    }
                    updateTotalPrice(card); 
                }
            });
        }
        setupCountdown();
        // Não chamamos setupScrollAnimations aqui para não forçar classes de opacidade que possam esconder o conteúdo
        hasInitialized = true;
    },

    update: (isConnected) => {
        updateBuyButtonsState(isConnected);
    }
};