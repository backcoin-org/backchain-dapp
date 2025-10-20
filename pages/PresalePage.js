// pages/PresalePage.js

const ethers = window.ethers;

import { DOMElements } from '../dom-elements.js';
import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses, publicSaleABI } from '../config.js';

// --- Configurações e Traduções da Página de Pré-venda ---

const PRESALE_CONFIG = {
    countdownDate: "2025-11-20T23:59:59",
    nftTiers: [
        { id: 0, name: "Diamond", boost: "+50%", price: "2.00 ETH", discountedPrice: "1.00 ETH", quantity: 20, img: "https://ipfs.io/ipfs/bafybeign2k73pq5pdicg2v2jdgumavw6kjmc4nremdenzvq27ngtcusv5i", color: "text-cyan-400" },
        { id: 1, name: "Platinum", boost: "+40%", price: "0.80 ETH", discountedPrice: "0.40 ETH", quantity: 30, img: "https://ipfs.io/ipfs/bafybeiag32gp4wssbjbpxjwxewer64fecrtjryhmnhhevgec74p4ltzrau", color: "text-gray-300" },
        { id: 2, name: "Gold", boost: "+30%", price: "0.30 ETH", discountedPrice: "0.15 ETH", quantity: 80, img: "https://ipfs.io/ipfs/bafybeido6ah36xn4rpzkvl5avicjzf225ndborvx726sjzpzbpvoogntem", color: "text-amber-400" },
        { id: 3, name: "Silver", boost: "+20%", price: "0.15 ETH", discountedPrice: "0.075 ETH", quantity: 160, img: "https://ipfs.io/ipfs/bafybeiaktaw4op7zrvsiyx2sghphrgm6sej6xw362mxgu326ahljjyu3gu", color: "text-gray-400" },
        { id: 4, name: "Bronze", boost: "+10%", price: "0.08 ETH", discountedPrice: "0.04 ETH", quantity: 240, img: "https://ipfs.io/ipfs/bafybeifkke3zepb4hjutntcv6vor7t2e4k5oseaur54v5zsectcepgseye", color: "text-yellow-600" }
    ],
    translations: {
        pt: {
            insufficientFunds: "Fundos insuficientes. Você precisa de mais ETH na rede Sepolia para esta compra.", userRejected: "Transação rejeitada pelo usuário.", soldOut: "Esgotado! A quantidade solicitada não está mais disponível.",
            txPending: "Aguardando confirmação...", txSuccess: "Compra realizada com sucesso!", txError: "Erro na transação:", buyAlert: "Por favor, conecte sua carteira primeiro.", saleContractNotConfigured: "Endereço do contrato de venda não configurado.", invalidQuantity: "Selecione uma quantidade válida.", txRejected: "Transação rejeitada.",
            heroTitle1: "Quebre as Regras.", heroTitle2: "Construa o Futuro.",
            heroSubtitle: "Backchain é uma rebelião contra o sistema falido da Web3. Adquira um <strong>ativo de poder</strong> com 50% de desconto e financie um ecossistema onde 100% dos fundos geram liquidez e crescimento.",
            heroBtn1: "Garantir Desconto", heroBtn2: "Entender o Ecossistema",
            countdownTitle: "O Lote 1 com 50% OFF acaba em:", countdownDays: "Dias", countdownHours: "Horas", countdownMinutes: "Minutos", countdownSeconds: "Segundos",
            cycleTag: "O MOTOR ECONÔMICO", cycleTitle: "O Ciclo de Valor Autossuficiente.",
            cycleSubtitle: "Nosso ecossistema é um ciclo fechado onde cada ação gera valor para a comunidade. Simples e poderoso.",
            cycle1Title: "Mineração por Compra", cycle1Desc: "Sua participação ativa minera novos tokens, injetando-os diretamente nos pools de recompensa do ecossistema.",
            cycle2Title: "Staking Inteligente", cycle2Desc: "Faça staking, proteja a rede e reivindique as recompensas geradas pela mineração e por todas as taxas da plataforma.",
            cycle3Title: "O NFT: Seu Multiplicador", cycle3Desc: "Use seu NFT para <span class='font-bold text-green-400'>amplificar a porcentagem de recompensas</span> que você pode reivindicar, acelerando seus ganhos.",
            powerTag: "SEU ATIVO DE PODER", powerTitle: "O NFT como Ativo Estratégico.",
            powerSubtitle: "Mais que um JPEG. É a chave para maximizar seus resultados, com utilidade real e liquidez garantida.",
            power1Title: "Ganhos Exponenciais", power1Desc: "Multiplique suas recompensas de Staking e Mineração. Transforme seu NFT em uma máquina de renda passiva.",
            power2Title: "Liquidez Imediata", power2Desc: "Negocie seu NFT a qualquer momento em nosso Marketplace e converta-o em tokens $BKC instantaneamente.",
            power3Title: "Escassez Programada", power3Desc: "Com um número fixo de Certificados, seu valor intrínseco é projetado para crescer junto com o ecossistema.",
            power4Title: "Financie a Rebelião", power4Desc: "100% dos fundos vão para liquidez e marketing, garantindo um lançamento justo, explosivo e livre da influência de VCs.",
            saleTitle: "Lote 1: Oportunidade Única de 50% OFF",
            saleSubtitle: "Adquira seu Certificado pela metade do preço. Válido até 20 de Novembro ou enquanto durarem os estoques.",
            roadmapTag: "NOSSO PLANO DE VOO", roadmapTitle: "O Futuro é Inevitável.",
            roadmapSubtitle: "Esta venda é o catalisador. Nosso roadmap é ambicioso, transparente e já está em execução.",
            roadmap1Title: "<i class='fa-solid fa-check-circle mr-3'></i>Fase 1: Fundação (Concluído)", roadmap1Desc: "Desenvolvimento e auditoria dos smart contracts. Implantação e testes exaustivos na rede de testes.",
            roadmap2Title: "<i class='fa-solid fa-rocket mr-3'></i>Fase 2: Lançamento (Você está aqui)", roadmap2Desc: "Venda estratégica de NFTs para financiar liquidez e marketing. Lançamento oficial do token $BKC e do dApp na Mainnet.",
            roadmap3Title: "<i class='fa-solid fa-satellite-dish mr-3'></i>Fase 3: Expansão", roadmap3Desc: "Lançamento do sistema de Ações Comunitárias. Integração com parceiros e listagens em exchanges de renome.",
            roadmap4Title: "<i class='fa-solid fa-landmark-flag mr-3'></i>Fase 4: Governança DAO", roadmap4Desc: "Implementação da DAO, entregando o controle do protocolo para a comunidade e alcançando a verdadeira descentralização.",
            footerText: "&copy; 2025 Backchain. A revolução não será centralizada.",
            cardRewardEfficiency: "Multiplicador de Recompensa", cardPriceBatch1: "Preço do Lote 1", cardAvailable: "Disponíveis",
            cardBtnConnect: "Conectar para Adquirir", cardBtnBuy: "Adquirir Agora",
        },
        // Outras traduções (en, es) podem ser adicionadas aqui se necessário
    }
};

let currentLang = 'pt'; // Padrão
let countdownInterval = null;
let hasRendered = false;
let hasInitialized = false;

// --- Funções da Página ---

function setLanguage(lang = 'pt') {
    currentLang = lang;
    const translation = PRESALE_CONFIG.translations[lang] || PRESALE_CONFIG.translations.pt;
    document.querySelectorAll('#presale [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translation[key]) el.innerHTML = translation[key];
    });
    document.querySelectorAll('#presale .nft-card').forEach(updateTotalPrice);
    updateBuyButtonsState(State.isConnected);
}

function updateBuyButtonsState(isConnected) {
    const translation = PRESALE_CONFIG.translations[currentLang] || PRESALE_CONFIG.translations.pt;
    document.querySelectorAll('#presale .buy-button').forEach(button => {
        const card = button.closest('.nft-card');
        if (card.classList.contains('sold-out')) return;
        button.disabled = !isConnected;
        if (!isConnected) {
            button.innerHTML = translation.cardBtnConnect;
        } else {
            updateTotalPrice(card); // Atualiza o texto para "Adquirir Agora (Total ETH)"
        }
    });
}

function updateTotalPrice(card) {
    const quantityInput = card.querySelector('.quantity-input');
    const buyButton = card.querySelector('.buy-button');
    if (!buyButton || !quantityInput || !State.isConnected) return;

    const priceString = buyButton.dataset.price;
    const quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    const pricePerItem = parseFloat(priceString.split(" ")[0]);
    const totalPrice = (pricePerItem * quantity).toFixed(4).replace(/\.0+$/, '');

    const buyText = (PRESALE_CONFIG.translations[currentLang] || PRESALE_CONFIG.translations.pt).cardBtnBuy || "Adquirir Agora";
    
    buyButton.innerHTML = `<i class='fa-solid fa-cart-shopping mr-2'></i>${buyText} (${totalPrice} ETH)`;
}

async function handleBuyNFT(button) {
    const translations = PRESALE_CONFIG.translations[currentLang] || PRESALE_CONFIG.translations.pt;
    if (!State.signer) { return showToast(translations.buyAlert, 'error'); }
    if (!addresses.publicSale || addresses.publicSale.includes("...")) { return showToast(translations.saleContractNotConfigured, 'error'); }

    const card = button.closest('.nft-card');
    const quantityInput = card.querySelector('.quantity-input');
    const quantity = parseInt(quantityInput.value, 10);
    
    if (isNaN(quantity) || quantity <= 0) { return showToast(translations.invalidQuantity, 'error'); }

    const tierId = button.dataset.tierId;
    const priceString = button.dataset.price;
    const originalButtonHTML = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = `<span class="loader"></span> ${translations.txPending}`;
        
        const pricePerItem = ethers.parseEther(priceString.split(" ")[0]);
        const totalPrice = pricePerItem * BigInt(quantity);

        const saleContract = new ethers.Contract(addresses.publicSale, publicSaleABI, State.signer);
        
        const tx = await saleContract.buyMultipleNFTs(tierId, quantity, { value: totalPrice });
        
        showToast(translations.txPending, 'info');
        const receipt = await tx.wait();
        showToast(translations.txSuccess, 'success', receipt.hash);
    } catch (error) {
        console.error(error);
        let errorMessage;
        if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = translations.insufficientFunds;
        } else if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            errorMessage = translations.userRejected;
        } else if (error.reason && (error.reason.includes("excede o estoque") || error.reason.includes("exceeds stock"))) {
            errorMessage = translations.soldOut;
        } else {
            errorMessage = error.reason || translations.txRejected;
        }
        showToast(`${translations.txError} ${errorMessage}`, 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalButtonHTML;
        // Re-atualiza o preço no botão
        if (State.isConnected) {
            updateTotalPrice(card);
        }
    }
}

function setupCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const countdownDate = new Date(PRESALE_CONFIG.countdownDate).getTime();
    const container = document.getElementById('countdown-container');
    if (!container) return;

    countdownInterval = setInterval(() => {
        const now = new Date().getTime(); const distance = countdownDate - now;
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
             clearInterval(countdownInterval);
             return;
        }

        if (distance < 0) { 
            clearInterval(countdownInterval); 
            container.innerHTML = `<p class="text-2xl font-bold text-red-500">OFERTA ENCERRADA!</p>`; 
            return; 
        }
        
        const d = String(Math.floor(distance / 86400000)).padStart(2, '0');
        const h = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
        const m = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
        
        daysEl.textContent = d; 
        hoursEl.textContent = h;
        minutesEl.textContent = m; 
        secondsEl.textContent = s;
    }, 1000);
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) { 
                entry.target.classList.add('is-visible'); 
                observer.unobserve(entry.target); 
            } 
        });
    }, { threshold: 0.15 });
    
    document.querySelectorAll('#presale .fade-in-section, #presale .roadmap-item').forEach(section => {
        observer.observe(section);
    });
}

function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;
    
    grid.innerHTML = PRESALE_CONFIG.nftTiers.map(tier => `
        <div class="bg-presale-bg-card border border-presale-border-color rounded-xl p-4 flex flex-col items-center nft-card group" data-tier-id="${tier.id}">
            <div class="w-full aspect-square overflow-hidden rounded-lg mb-4 bg-presale-bg-darker"><img src="${tier.img}" alt="${tier.name}" class="w-full h-full object-contain nft-card-image"/></div>
            <h3 class="text-xl font-bold ${tier.color}">${tier.name}</h3>
            <p class="text-2xl font-bold text-green-400">${tier.boost}</p>
            <p class="text-sm text-text-secondary mb-2" data-translate="cardRewardEfficiency"></p>
            <div class="w-full bg-presale-bg-main p-3 rounded-lg text-center my-2">
                <p class="text-xs text-text-secondary" data-translate="cardPriceBatch1"></p>
                <div class="flex items-center justify-center gap-2"><p class="text-sm text-text-secondary line-through">${tier.price}</p><p class="font-bold text-xl text-green-400">${tier.discountedPrice}</p></div>
            </div>
            <div class="my-3 w-full">
                <div class="quantity-selector">
                    <button class="quantity-btn quantity-minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" max="${tier.quantity}">
                    <button class="quantity-btn quantity-plus">+</button>
                </div>
            </div>
            <p class="text-sm text-text-secondary mb-3"><span data-translate="cardAvailable"></span>: <span class="font-bold available-count">${tier.quantity}</span></p>
            <button class="w-full btn-primary font-bold py-2.5 px-4 rounded-md buy-button" disabled data-translate="cardBtnConnect" data-tier-id="${tier.id}" data-price="${tier.discountedPrice}">Conectar para Adquirir</button>
        </div>
    `).join('');
}


// --- Objeto da Página Exportado ---

export const PresalePage = {
    render: () => {
        // Renderiza o HTML da página apenas uma vez
        if (hasRendered) {
            // Se já renderizou, apenas atualiza o estado dos botões
            PresalePage.update(State.isConnected);
            return;
        }

        const html = `
            <main>
                <section class="relative text-center py-24 lg:py-40 px-4 overflow-hidden" style="background-color: var(--presale-bg-darker);">
                    <div class="absolute inset-0 bg-gradient-to-b from-presale-bg-darker to-transparent z-0"></div>
                    <div class="relative z-10">
                        <h1 class="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                            <span data-translate="heroTitle1">Quebre as Regras.</span>
                            <span class="block presale-text-gradient" data-translate="heroTitle2">Construa o Futuro.</span>
                        </h1>
                        <p class="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10" data-translate="heroSubtitle">
                            Backchain é uma rebelião contra o sistema falido da Web3. Adquira um <strong>ativo de poder</strong> com 50% de desconto e financie um ecossistema onde 100% dos fundos geram liquidez e crescimento.
                        </p>
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <a href="#venda" class="w-full sm:w-auto inline-block btn-primary font-bold py-4 px-10 rounded-lg text-lg">
                                <i class="fa-solid fa-tags mr-2"></i> <span data-translate="heroBtn1">Garantir Desconto</span>
                            </a>
                            <a href="#ciclo" class="w-full sm:w-auto inline-block bg-transparent border-2 border-presale-border-color hover:bg-presale-bg-card text-text-primary font-bold py-4 px-10 rounded-lg text-lg transition-colors" data-translate="heroBtn2">
                                Entender o Ecossistema
                            </a>
                        </div>
                        <div id="countdown-container" class="max-w-xl mx-auto">
                            <p class="font-bold text-lg mb-4 text-amber-400 animate-pulse" data-translate="countdownTitle">O Lote 1 com 50% OFF acaba em:</p>
                            <div class="grid grid-cols-4 gap-2 sm:gap-4 text-center font-mono">
                                <div><div id="days" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownDays">Dias</p></div>
                                <div><div id="hours" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownHours">Horas</p></div>
                                <div><div id="minutes" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownMinutes">Minutos</p></div>
                                <div><div id="seconds" class="text-4xl sm:text-6xl font-bold bg-black/30 backdrop-blur-sm border border-presale-border-color py-3 rounded-lg">00</div><p class="text-sm text-text-secondary mt-2" data-translate="countdownSeconds">Segundos</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="ciclo" class="py-20 lg:py-28 px-4 fade-in-section" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-6xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-amber-400 tracking-widest" data-translate="cycleTag">O MOTOR ECONÔMICO</span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="cycleTitle">O Ciclo de Valor Autossuficiente.</h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="cycleSubtitle">
                                Nosso ecossistema é um ciclo fechado onde cada ação gera valor para a comunidade. Simples e poderoso.
                            </p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div class="fade-in-section">
                                <div class="flex items-center justify-center h-20 w-20 mx-auto rounded-full bg-presale-bg-card border-2 border-presale-border-color text-amber-400 text-3xl font-bold mb-4">1</div>
                                <h3 class="text-2xl font-bold mb-2" data-translate="cycle1Title">Mineração por Compra</h3>
                                <p class="text-text-secondary" data-translate="cycle1Desc">Sua participação ativa minera novos tokens, injetando-os diretamente nos pools de recompensa do ecossistema.</p>
                            </div>
                            <div class="fade-in-section" style="transition-delay: 200ms;">
                                <div class="flex items-center justify-center h-20 w-20 mx-auto rounded-full bg-presale-bg-card border-2 border-presale-border-color text-amber-400 text-3xl font-bold mb-4">2</div>
                                <h3 class="text-2xl font-bold mb-2" data-translate="cycle2Title">Staking Inteligente</h3>
                                <p class="text-text-secondary" data-translate="cycle2Desc">Faça staking, proteja a rede e reivindique as recompensas geradas pela mineração e por todas as taxas da plataforma.</p>
                            </div>
                            <div class="fade-in-section" style="transition-delay: 400ms;">
                                <div class="flex items-center justify-center h-20 w-20 mx-auto rounded-full bg-presale-bg-card border-2 border-presale-border-color text-amber-400 text-3xl font-bold mb-4">3</div>
                                <h3 class="text-2xl font-bold mb-2" data-translate="cycle3Title">O NFT: Seu Multiplicador</h3>
                                <p class="text-text-secondary" data-translate="cycle3Desc">Use seu NFT para <span class="font-bold text-green-400">amplificar a porcentagem de recompensas</span> que você pode reivindicar, acelerando seus ganhos.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="py-20 lg:py-28 px-4 fade-in-section">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-16">
                             <span class="text-sm font-bold text-cyan-400 tracking-widest" data-translate="powerTag">SEU ATIVO DE PODER</span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="powerTitle">O NFT como Ativo Estratégico.</h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="powerSubtitle">Mais que um JPEG. É a chave para maximizar seus resultados, com utilidade real e liquidez garantida.</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color">
                                <i class="fa-solid fa-bolt text-4xl text-green-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="power1Title">Ganhos Exponenciais</h3>
                                <p class="text-text-secondary" data-translate="power1Desc">Multiplique suas recompensas de Staking e Mineração. Transforme seu NFT em uma máquina de renda passiva.</p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color">
                                <i class="fa-solid fa-store text-4xl text-cyan-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="power2Title">Liquidez Imediata</h3>
                                <p class="text-text-secondary" data-translate="power2Desc">Negocie seu NFT a qualquer momento em nosso Marketplace e converta-o em tokens $BKC instantaneamente.</p>
                            </div>
                             <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color">
                                <i class="fa-solid fa-gem text-4xl text-purple-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="power3Title">Escassez Programada</h3>
                                <p class="text-text-secondary" data-translate="power3Desc">Com um número fixo de Certificados, seu valor intrínseco é projetado para crescer junto com o ecossistema.</p>
                            </div>
                            <div class="p-8 bg-presale-bg-card rounded-lg border border-presale-border-color">
                                <i class="fa-solid fa-hand-fist text-4xl text-amber-400 mb-5"></i>
                                <h3 class="text-2xl font-bold mb-3" data-translate="power4Title">Financie a Rebelião</h3>
                                <p class="text-text-secondary" data-translate="power4Desc">100% dos fundos vão para liquidez e marketing, garantindo um lançamento justo, explosivo e livre da influência de VCs.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="venda" class="py-20 lg:py-28 px-4 fade-in-section" style="background-color: var(--presale-bg-darker);">
                    <div class="container mx-auto max-w-7xl">
                        <div class="text-center mb-12">
                            <h2 class="text-4xl md:text-5xl font-bold presale-text-gradient" data-translate="saleTitle">Lote 1: Oportunidade Única de 50% OFF</h2>
                            <p class="text-lg text-text-secondary mt-4" data-translate="saleSubtitle">Adquira seu Certificado pela metade do preço. Válido até 20 de Novembro ou enquanto durarem os estoques.</p>
                        </div>
                        <div id="marketplace-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"></div>
                    </div>
                </section>
                
                <section class="py-20 lg:py-28 px-4 fade-in-section">
                    <div class="container mx-auto max-w-4xl">
                        <div class="text-center mb-16">
                            <span class="text-sm font-bold text-purple-400 tracking-widest" data-translate="roadmapTag">NOSSO PLANO de VOO</span>
                            <h2 class="text-4xl md:text-5xl font-bold my-4" data-translate="roadmapTitle">O Futuro é Inevitável.</h2>
                            <p class="text-lg text-text-secondary max-w-3xl mx-auto" data-translate="roadmapSubtitle">Esta venda é o catalisador. Nosso roadmap é ambicioso, transparente e já está em execução.</p>
                        </div>
                        <div class="relative pl-8 border-l-2 border-presale-border-color">
                            <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold text-amber-400" data-translate="roadmap1Title"><i class="fa-solid fa-check-circle mr-3"></i>Fase 1: Fundação (Concluído)</h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap1Desc">Desenvolvimento e auditoria dos smart contracts. Implantação e testes exaustivos na rede de testes.</p>
                            </div>
                            <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap2Title"><i class="fa-solid fa-rocket mr-3"></i>Fase 2: Lançamento (Você está aqui)</h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap2Desc">Venda estratégica de NFTs para financiar liquidez e marketing. Lançamento oficial do token $BKC e do dApp na Mainnet.</p>
                            </div>
                            <div class="mb-12 roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap3Title"><i class="fa-solid fa-satellite-dish mr-3"></i>Fase 3: Expansão</h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap3Desc">Lançamento do sistema de Ações Comunitárias. Integração com parceiros e listagens em exchanges de renome.</p>
                            </div>
                            <div class="roadmap-item">
                                <h3 class="text-2xl font-bold" data-translate="roadmap4Title"><i class="fa-solid fa-landmark-flag mr-3"></i>Fase 4: Governança DAO</h3>
                                <p class="text-text-secondary mt-2" data-translate="roadmap4Desc">Implementação da DAO, entregando o controle do protocolo para a comunidade e alcançando a verdadeira descentralização.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer class="text-center p-8 border-t border-presale-border-color" style="background-color: var(--presale-bg-darker);">
                    <p class="text-text-secondary" data-translate="footerText">&copy; 2025 Backchain. A revolução não será centralizada.</p>
                </footer>
            </main>
        `;
        
        DOMElements.presale.innerHTML = html;
        renderMarketplace();
        hasRendered = true;
    },

    init: () => {
        // Inicializa os listeners e timers
        if (hasInitialized) {
            // Se os listeners já foram iniciados, apenas reinicia o countdown e as animações
            // para o caso de a página ter sido 'hidden' e 'shown' novamente.
            setupCountdown();
            setupScrollAnimations();
            return;
        }

        // Adiciona listeners dos botões de compra
        document.getElementById('marketplace-grid').addEventListener('click', (e) => {
            const buyButton = e.target.closest('.buy-button');
            if (buyButton) {
                handleBuyNFT(buyButton);
                return;
            }

            const card = e.target.closest('.nft-card');
            if (!card) return;

            const minusBtn = e.target.closest('.quantity-minus');
            const plusBtn = e.target.closest('.quantity-plus');
            const input = card.querySelector('.quantity-input');
            const max = parseInt(input.max, 10);

            if (minusBtn) {
                let val = parseInt(input.value); 
                if (val > 1) { 
                    input.value = val - 1; 
                    updateTotalPrice(card); 
                }
            } else if (plusBtn) {
                let val = parseInt(input.value); 
                if (val < max) { 
                    input.value = val + 1; 
                    updateTotalPrice(card); 
                }
            }
        });

        // Listener para o input de quantidade
        document.getElementById('marketplace-grid').addEventListener('input', (e) => {
            const input = e.target.closest('.quantity-input');
            if (input) {
                const card = input.closest('.nft-card');
                const max = parseInt(input.max, 10);
                let val = parseInt(input.value); 
                if (isNaN(val) || val < 1) input.value = 1; 
                if (val > max) input.value = max; 
                updateTotalPrice(card);
            }
        });

        setupCountdown();
        setupScrollAnimations();
        setLanguage('pt'); // Define o idioma padrão
        
        hasInitialized = true;
    },

    // Função chamada pelo app.js quando o estado de conexão muda
    update: (isConnected) => {
        updateBuyButtonsState(isConnected);
    }
};