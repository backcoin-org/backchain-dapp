// pages/PresalePage.js
// ✅ ARQUIVO TOTALMENTE AJUSTADO
// 1. Preços lidos dinamicamente do contrato (priceInWei)
// 2. Lógica de Escassez Contínua (Lotes de 10 a 70) implementada (mintedCount)
// 3. Countdown ajustado para 1º de Dezembro (início da Fase 2)
// 4. Preços da Fase 2 (do script 2_update_presale_prices.ts) exibidos
// 5. UX Móvel: Vantagens em <details> (accordion) e grade vira carrossel

const ethers = window.ethers;
import { DOMElements } from '../dom-elements.js';
import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, publicSaleABI } from '../config.js';

// =================================================================
// ### INÍCIO DAS NOVAS CONFIGURAÇÕES ###
// =================================================================
const PRESALE_CONFIG = {
    // Nova data do Countdown: 1º de Dezembro de 2025 (meia-noite, início do dia)
    countdownDate: "2025-12-01T00:00:00Z", // Fim da Fase 1
    
    // Configurações estáticas dos Tiers (Vantagens, Imagens, Lotes)
    nftTiers: [
        { 
            id: 0, 
            name: "Diamond", 
            boost: "+50%", 
            batchSize: 10, // Lote de 10
            phase2Price: "5.40 BNB", // Preço da Fase 2 (do seu script)
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
            batchSize: 20, // Lote de 20
            phase2Price: "2.16 BNB", // Preço da Fase 2
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
            batchSize: 30, // Lote de 30
            phase2Price: "0.81 BNB", // Preço da Fase 2
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
            batchSize: 40, // Lote de 40
            phase2Price: "0.405 BNB", // Preço da Fase 2
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
            batchSize: 50, // Lote de 50
            phase2Price: "0.216 BNB", // Preço da Fase 2
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
            batchSize: 60, // Lote de 60
            phase2Price: "0.105 BNB", // Preço da Fase 2
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
            batchSize: 70, // Lote de 70
            phase2Price: "0.015 BNB", // Preço da Fase 2
            img: "ipfs://bafybeiela7zrsnyva47pymhmnr6dj2aurrkwxhpwo7eaasx3t24y6n3aay", 
            color: "text-indigo-300", 
            advantages: [
                "1% Minimal Reward Boost for Staking and PoP Mining."
            ] 
        }
    ].map(tier => ({
        ...tier,
        // Placeholders para dados dinâmicos
        priceInWei: 0n, // Será preenchido pelo contrato
        mintedCount: 0, // Será preenchido pelo contrato
        isSoldOut: false // Será calculado
    })),
    
    // Traduções (ajustadas para a nova realidade)
    translations: {
        en: {
            // ... (mensagens de erro mantidas) ...
            insufficientFunds: "Insufficient funds...", userRejected: "Transaction rejected...",
            soldOut: "This tier is sold out.", 
            txPending: "Awaiting confirmation...", txSuccess: "Purchase successful!", txError: "Transaction Error:", buyAlert: "Please connect your wallet first.", saleContractNotConfigured: "Sale contract address not configured.", invalidQuantity: "Please select a valid quantity (1 or more).", txRejected: "Transaction rejected.",
            
            // Textos da UI atualizados
            saleTag: "BATCH 1: 50% DISCOUNT",
            saleTitle: "Choose Your Power",
            saleTimerTitle: "Time Remaining Until Phase 2 Price Increase (1-Dec-2025):", // Nova data
            countdownDays: "D", countdownHours: "H", countdownMinutes: "M", countdownSeconds: "S",
            
            cardPricePhase2: "Phase 2 Price:", // Novo
            cardPricePhase1: "Phase 1 (50% OFF):", // Novo
            cardQuantityLabel: "Quantity:", 
            
            cardAdvTitle: "Booster Advantages:",
            cardAdvToggle: "View Advantages", // Novo (para accordion)
            
            cardBtnConnect: "Connect Wallet to Buy",
            cardBtnBuy: "Acquire Now",
            cardBtnSoldOut: "Sold Out", // Novo
            cardProgressLabel: "Batch Progress:", // Novo
            
            loadingText: "Loading Prices from Blockchain...", // Novo
            
            // ... (outros textos de hero/key benefits mantidos) ...
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
            anchorBtn: "Secure Your NFT",
        }
    }
};
// =================================================================
// ### FIM DAS NOVAS CONFIGURAÇÕES ###
// =================================================================


let currentLang = 'en';
let countdownInterval = null;
let hasRendered = false;

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

// --- Funções de UI Atualizadas ---

function updateBuyButtonsState(isConnected) {
    const translation = PRESALE_CONFIG.translations.en;
    document.querySelectorAll('#presale .buy-button').forEach(button => {
        const card = button.closest('.nft-card');
        if (!card) return;
        
        const tierId = button.dataset.tierId;
        const tier = PRESALE_CONFIG.nftTiers.find(t => t.id == tierId);
        
        if (tier && tier.isSoldOut) {
            button.disabled = true;
            button.innerHTML = `<i class='fa-solid fa-ban mr-2'></i> ${translation.cardBtnSoldOut}`;
            return;
        }

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

    const tierId = buyButton.dataset.tierId;
    const tier = PRESALE_CONFIG.nftTiers.find(t => t.id == tierId);
    
    if (!tier || tier.isSoldOut) return; // Não faz nada se estiver esgotado

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

    // Calcula o preço total baseado no priceInWei (BigInt)
    const pricePerItem = tier.priceInWei; // Este já é um BigInt
    const totalPrice = pricePerItem * BigInt(quantity);
    
    const formattedTotalPrice = ethers.formatUnits(totalPrice, 18);
    
    // Formata para exibição (remove zeros desnecessários)
    const displayPrice = parseFloat(formattedTotalPrice).toString(); 

    const buyText = translation.cardBtnBuy || "Acquire Now";
    
    buyButton.innerHTML = `<i class='fa-solid fa-cart-shopping mr-2'></i>${buyText} (${displayPrice} BNB)`;
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
    const tier = PRESALE_CONFIG.nftTiers.find(t => t.id == tierId);
    
    if (!tier || tier.priceInWei === 0n) {
        return showToast(translations.txError + " Price not loaded.", 'error');
    }

    try {
        button.disabled = true;
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> ${translations.txPending}`;
        
        // Pega o priceInWei DINÂMICO
        const pricePerItem = tier.priceInWei;
        const totalPrice = pricePerItem * BigInt(quantity);
        
        const saleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, State.signer);

        // Chama a função correta
        const tx = await saleContract.buyMultipleNFTs(tierId, quantity, { value: totalPrice });
        showToast(translations.txPending, 'info');
        
        const receipt = await tx.wait();
        showToast(translations.txSuccess, 'success', receipt.hash);
        
        // Atualiza a contagem de mintados na UI
        fetchTierData(tierId); // Recarrega os dados apenas deste tier
        
    } catch (error) {
        console.error("Presale Buy Error:", error);
        let errorMessage;
        if (error.code === 'INSUFFICIENT_FUNDS') { errorMessage = translations.insufficientFunds; }
        else if (error.code === 4001 || error.code === 'ACTION_REJECTED') { errorMessage = translations.userRejected; }
        // Verifica a mensagem de "Sold out" do contrato
        else if (error.reason && error.reason.includes("Sale: Sold out")) { errorMessage = translations.soldOut; }
        // Verifica a mensagem de "Incorrect native value"
        else if (error.reason && error.reason.includes("Sale: Incorrect native value")) { errorMessage = "Incorrect BNB value sent. Price may have changed."; }
        else if (error.reason) { errorMessage = error.reason; }
        else if (error.data?.message) { errorMessage = error.data.message; }
        else { errorMessage = error.message || translations.txRejected; }
        showToast(`${translations.txError} ${errorMessage}`, 'error');
    } finally {
        // Não reativa o botão se estiver esgotado
        if (!tier.isSoldOut) {
             button.disabled = false;
        }
        updateBuyButtonsState(State.isConnected); 
    }
}

function setupCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    // Usa a nova data do config
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
            if(container) container.innerHTML = `<p class="text-3xl font-bold text-red-500">PHASE 2 IS LIVE!</p>`;
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

// =================================================================
// ### INÍCIO DAS NOVAS FUNÇÕES (Leitura e Escassez) ###
// =================================================================

/**
 * Busca os dados de TODOS os tiers (preço, vendidos) do contrato.
 */
async function fetchAllTierData() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;
    
    try {
        if (!State.provider) {
            console.warn("Provider not available for fetching tier data.");
            return;
        }
        if (!addresses.publicSale || addresses.publicSale === "0x...") {
             throw new Error("PublicSale address not configured.");
        }
        
        const saleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, State.provider);
        
        const tierIds = PRESALE_CONFIG.nftTiers.map(t => t.id);
        
        // Busca todos os tiers em paralelo
        const tierDataPromises = tierIds.map(id => saleContract.tiers(id));
        const tierResults = await Promise.all(tierDataPromises);

        // Atualiza o CONFIG principal
        tierResults.forEach((data, index) => {
            const tierId = tierIds[index];
            const tierConfig = PRESALE_CONFIG.nftTiers.find(t => t.id === tierId);
            
            if (tierConfig) {
                tierConfig.priceInWei = data.priceInWei;
                tierConfig.mintedCount = Number(data.mintedCount);
                // O contrato não tem 'maxSupply' infinito, mas o JS tratará como 'esgotado'
                // se o contrato reverter. Aqui verificamos o preço.
                if (data.priceInWei === 0n) {
                    tierConfig.isSoldOut = true; // Se o preço é 0, o tier não está à venda
                }
            }
        });

        // Agora que os dados estão no CONFIG, renderiza os cards
        renderMarketplace();
        
    } catch (error) {
        console.error("Failed to fetch tier data:", error);
        grid.innerHTML = `<p class="text-red-500 text-center col-span-full">${error.message}</p>`;
    }
}

/**
 * Busca dados de um ÚNICO tier (usado após a compra)
 */
async function fetchTierData(tierId) {
     try {
        if (!State.provider) return;
        const saleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, State.provider);
        const data = await saleContract.tiers(tierId);
        
        const tierConfig = PRESALE_CONFIG.nftTiers.find(t => t.id == tierId);
        if (tierConfig) {
            tierConfig.priceInWei = data.priceInWei;
            tierConfig.mintedCount = Number(data.mintedCount);
            if (data.priceInWei === 0n) { // Assume que preço 0 = não configurado/esgotado
                 tierConfig.isSoldOut = true;
            }
            
            // Re-renderiza apenas este card
            const cardElement = document.querySelector(`.nft-card[data-tier-id="${tierId}"]`);
            if (cardElement) {
                const newCardHTML = createCardHTML(tierConfig);
                cardElement.outerHTML = newCardHTML;
                // Re-aplica o estado do botão
                const newCard = document.querySelector(`.nft-card[data-tier-id="${tierId}"]`);
                updateBuyButtonsState(State.isConnected);
            }
        }
    } catch (error) {
        console.error(`Failed to update tier ${tierId}:`, error);
    }
}

/**
 * Lógica de Lote Alvo (Escassez Contínua)
 * Retorna o "teto" do lote atual.
 */
function getBatchTarget(mintedCount, batchSize) {
    if (mintedCount === 0) return batchSize;
    // Ex: (8, 10) -> Math.ceil(8 / 10) * 10 = 1 * 10 = 10
    // Ex: (10, 10) -> Math.ceil(10 / 10) * 10 = 1 * 10 = 10 (Errado)
    
    // Lógica correta:
    // Ex: (8, 10) -> Math.floor(8 / 10) * 10 + 10 = 0 + 10 = 10. (Alvo é 10)
    // Ex: (10, 10) -> Math.floor(10 / 10) * 10 + 10 = 10 + 10 = 20. (Alvo é 20)
    // Ex: (19, 10) -> Math.floor(19 / 10) * 10 + 10 = 10 + 10 = 20. (Alvo é 20)
    // Ex: (20, 10) -> Math.floor(20 / 10) * 10 + 10 = 20 + 10 = 30. (Alvo é 30)
    return Math.floor(mintedCount / batchSize) * batchSize + batchSize;
}

/**
 * Helper para pegar URL IPFS (mantido)
 */
const getHttpUrl = (ipfsUri) => {
    if (!ipfsUri || typeof ipfsUri !== 'string') return '';
    if (ipfsUri.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${ipfsUri.substring(7)}`;
    }
    return ipfsUri;
};

/**
 * Cria o HTML de um único card (reutilizável)
 */
function createCardHTML(tier) {
    const translations = PRESALE_CONFIG.translations.en;
    
    // --- Lógica de Escassez ---
    const minted = tier.mintedCount;
    const batchTarget = getBatchTarget(minted, tier.batchSize);
    const progressPercent = Math.max(0, Math.min(100, (minted / batchTarget) * 100));

    // --- Lógica de Preço ---
    const isConfigured = tier.priceInWei > 0n;
    const currentPriceFormatted = isConfigured ? parseFloat(ethers.formatUnits(tier.priceInWei, 18)).toString() : "N/A";
    const phase2PriceFormatted = tier.phase2Price || "N/A";

    return `
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl flex flex-col nft-card group overflow-hidden shadow-xl hover:shadow-amber-500/30 transition-shadow duration-300 snap-center flex-shrink-0 w-11/12 sm:w-full" data-tier-id="${tier.id}">
            
            <div class="w-full h-48 overflow-hidden bg-presale-bg-darker relative">
                <img src="${getHttpUrl(tier.img)}" alt="${tier.name}" class="w-full h-full object-cover nft-card-image transition-transform duration-500 group-hover:scale-105"/>
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 class="text-3xl font-black ${tier.color} drop-shadow-lg">${tier.name}</h3>
                </div>
            </div>
            
            <div class="p-4 flex flex-col flex-1">
                <p class="text-4xl font-extrabold text-green-400 mb-4">${tier.boost}</p>
                
                <details class="w-full text-left bg-zinc-800 p-3 rounded-lg my-2 flex-1 group/details">
                    <summary class="text-sm font-bold text-amber-400 uppercase cursor-pointer list-none flex justify-between items-center">
                        <span data-translate="cardAdvToggle"></span>
                        <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open/details:rotate-180"></i>
                    </summary>
                    <ul class="space-y-1.5 text-sm list-none list-inside text-text-primary mt-3 pt-3 border-t border-zinc-700">
                        ${tier.advantages.map(adv => `
                            <li class="flex items-start gap-2">
                                <i class="fa-solid fa-check-circle text-xs text-green-500 mt-1 flex-shrink-0"></i>
                                <span>${adv}</span>
                            </li>
                        `).join('')}
                    </ul>
                </details>
                
                <div class="w-full text-left my-3">
                    <div class="flex justify-between text-xs font-bold text-text-secondary mb-1">
                        <span data-translate="cardProgressLabel"></span>
                        <span class="text-amber-400">${minted} / ${batchTarget}</span>
                    </div>
                    <div class="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-amber-500 h-2.5 rounded-full" style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-3">
                    <p class="text-sm text-text-secondary line-through">
                        <span data-translate="cardPricePhase2"></span> ${phase2PriceFormatted}
                    </p>
                    <p class="font-bold text-3xl text-red-500">${currentPriceFormatted} BNB</p>
                    <p class="text-xs font-bold text-amber-400 mt-1" data-translate="cardPricePhase1"></p>
                </div>

                <div class="my-3 w-full">
                    <label class="block text-center text-sm font-medium text-text-secondary mb-1" data-translate="cardQuantityLabel"></label>
                    <div class="quantity-selector">
                        <button class="quantity-btn quantity-minus">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" ${tier.isSoldOut ? 'disabled' : ''}>
                        <button class="quantity-btn quantity-plus">+</button>
                    </div>
                </div>

                <button class="w-full btn-primary font-bold py-3 px-4 rounded-lg buy-button mt-auto shadow-md" ${tier.isSoldOut ? 'disabled' : 'data-translate="cardBtnConnect"'} data-tier-id="${tier.id}">
                    ${tier.isSoldOut ? translations.cardBtnSoldOut : translations.cardBtnConnect}
                </button>
            </div>
        </div>
    `;
}

/**
 * Renderiza os placeholders e inicia a busca de dados
 */
function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;
    const translations = PRESALE_CONFIG.translations.en;

    // Se os dados ainda não foram buscados, mostra placeholders
    if (PRESALE_CONFIG.nftTiers[0].priceInWei === 0n) {
        grid.innerHTML = `<p class="text-lg text-amber-400 text-center col-span-full animate-pulse">${translations.loadingText}</p>`;
        fetchAllTierData(); // Inicia a busca
        return;
    }

    // Se os dados foram buscados, renderiza os cards
    grid.innerHTML = PRESALE_CONFIG.nftTiers.map(createCardHTML).join('');
    
    // Atualiza o estado dos botões
    updateBuyButtonsState(State.isConnected);
    // Aplica a tradução aos elementos estáticos
    setLanguage('en');
}

// =================================================================
// ### FIM DAS NOVAS FUNÇÕES ###
// =================================================================


// --- Exported Page Object ---

export const PresalePage = {
    render: () => {
        const html = `
            <main id="presale-content" class="relative pb-20">
                
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

                        <div id="marketplace-grid" class="flex flex-nowrap overflow-x-auto gap-6 snap-x snap-mandatory px-4 py-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8 sm:p-0 sm:overflow-visible">
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
        hasRendered = true; // Marca que o HTML base foi renderizado
        
        // Inicia a renderização dos cards (que inclui a busca de dados)
        renderMarketplace();
        
        // Inicia os ouvintes de eventos e o countdown
        PresalePage.init(); 
        setLanguage('en');
        if (State.isConnected) {
            PresalePage.update(true);
        }
    },

    init: () => {
        const grid = document.getElementById('marketplace-grid');
        
        if (grid && !grid._listenersAttached) { 
             grid.addEventListener('click', (e) => {
                const buyButton = e.target.closest('.buy-button');
                if (buyButton && !buyButton.disabled) { 
                    handleBuyNFT(buyButton); 
                    return; 
                }
                
                const card = e.target.closest('.nft-card');
                if (!card) return;
                const input = card.querySelector('.quantity-input');
                if (!input || input.disabled) return;
                
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

            grid._listenersAttached = true; 
        }
        
        // Inicia o countdown com a data de 1º de Dezembro
        setupCountdown();
    },

    update: (isConnected) => {
        if (!hasRendered) return; // Não faz nada se o HTML não foi renderizado
        
        // Se conectar, força a busca de dados (caso não tenham sido buscados)
        if (isConnected && PRESALE_CONFIG.nftTiers[0].priceInWei === 0n) {
            fetchAllTierData();
        } else {
             updateBuyButtonsState(isConnected);
        }
    }
};