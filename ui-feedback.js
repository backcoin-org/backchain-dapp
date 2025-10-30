// ui-feedback.js - Versão Profissional e Otimizada com i18n

import { DOMElements } from './dom-elements.js';
import { addresses } from './config.js';
import { State } from './state.js';

// Gerenciamento de Timers e Flags de Exibição
let activeCountdownIntervals = {};
let hasShownIntroModal = false;
let hasShownWelcomeModal = false; // Flag para o modal de boas-vindas

// --- INTERNACIONALIZAÇÃO (i18n) ---

// Idioma padrão: Alterado para 'en' conforme base do sistema
let currentLang = 'en';

/**
 * Dicionário de traduções.
 */
const translations = {
    'pt': {
        // Títulos e Textos Principais
        'welcome_name': 'Backcoin.org',
        'welcome_slogan': 'O futuro é descentralizado',
        'welcome_subtitle': 'Conheça Algo Novo e Disruptivo',
        'welcome_description': 'Um ecossistema completo onde sua participação gera recompensas reais e impacto social.',
        'welcome_continue_btn': 'Continuar para as Ações Principais',
        'welcome_step2_title': 'Bem-vindo à Backchain',
        'welcome_step2_subtitle': 'O que você gostaria de fazer agora?',
        'welcome_presale_btn': 'Adquirir Booster NFT (50% OFF)',
        'welcome_airdrop_btn': 'Participar do Airdrop Gratuito',
        'welcome_explore_btn': 'Explorar o Ecossistema (Dashboard)',
        
        // Novos textos para botões de atalho
        'welcome_tokenomics_btn': 'Tokenomics',
        'welcome_about_btn': 'Saiba Mais',

        // Features (Welcome Modal)
        'feat_taxes_title': 'Ganhe Taxas do Ecossistema',
        'feat_taxes_desc': 'Delegue seus $BKC e receba uma parte das taxas de uso de *todos* os serviços.',
        'feat_pop_title': 'Mineração por Compra (PoP)',
        'feat_pop_desc': 'Ganhe $BKC ao criar Certificados de Vesting e apoiar a liquidez.',
        'feat_actions_title': 'Ações Descentralizadas',
        'feat_actions_desc': 'Participe de loterias e campanhas 100% on-chain, com justiça garantida.',
        'feat_notary_title': 'Cartório Descentralizado',
        'feat_notary_desc': 'Registre a existência de documentos na blockchain, para sempre.',
        'feat_dao_title': 'Governança (DAO)',
        'feat_dao_desc': 'Ajude a decidir o futuro do ecossistema votando em propostas.',

        // Intro Modal
        'intro_title': 'Participe. Ganhe. Apoie.',
        'intro_desc': 'A Backchain é um ecossistema de Ações Descentralizadas. Sua participação é transparente, segura e recompensadora.',
        'intro_feat1_title': 'Apoie o Crescimento da Rede',
        'intro_feat1_desc': 'Seu stake de $BKC contribui para a liquidez e estabilidade da rede.',
        'intro_feat2_title': 'Ganhe em Sorteios On-Chain',
        'intro_feat2_desc': 'Participe de sorteios com justiça verificável diretamente na blockchain.',
        'intro_feat3_title': 'Apoie Causas Sociais',
        'intro_feat3_desc': 'Ações de Caridade com transparência total e rastreabilidade.',
        'intro_understand_btn': 'Entendi, Continuar',

        // Share Modal
        'share_title': 'Compartilhe o Projeto',
        'share_desc': 'Ajude a revolução a crescer! Compartilhe com seus amigos e comunidade.',
        'share_copy_link_label': 'Ou copie o link diretamente:',
        'share_copy_btn': 'Copiar',
        'share_copied_toast': 'Link copiado!',
        'share_text': 'Estou acompanhando a Backchain! 💎 Um novo projeto de rede descentralizada que pode ser o próximo Bitcoin. Não perca a revolução! #Backchain #Web3 #Crypto',

        // UGC Modal
        'ugc_title': 'Submeta sua Publicação no ', // + platform
        'ugc_instructions_title': 'Instruções Importantes',
        'ugc_inst1_title': 'Link de Referência:',
        'ugc_inst1_desc': 'Certifique-se de incluir seu link de referência único (copiado abaixo).',
        'ugc_inst2_title': 'Hashtags:',
        'ugc_inst2_desc': 'Use as hashtags relevantes fornecidas.',
        'ugc_inst3_title': 'Conteúdo:',
        'ugc_inst3_desc': 'O post deve ser sobre a Backchain (notícias, artigos, canais oficiais).',
        'ugc_text_label': 'Texto Sugerido (Link e Hashtags)',
        'ugc_copy_text_btn': 'Copiar Texto para Publicação',
        'ugc_url_label': 'URL da sua publicação no ', // + platform
        'ugc_submit_btn': 'Submeter para Auditoria',
        'ugc_cancel_btn': 'Cancelar',
        'ugc_copied_toast': 'Texto Copiado!',
        'ugc_invalid_url_toast': 'Por favor, insira uma URL válida (iniciada com http/https).',

        // Toast
        'toast_nft_adding': 'Adicionando NFT #%s à sua carteira...',
        'toast_nft_added': 'NFT #%s adicionado com sucesso!',
        'toast_nft_canceled': 'Ação cancelada pelo usuário.',
        'toast_nft_error': 'Erro ao adicionar NFT: %s',
        'toast_no_wallet': 'Nenhuma carteira Ethereum detectada.',
        
        // Timer
        'timer_unlocked': 'Desbloqueado',
        'timer_fee_text': 'Taxa de Saque: 1% (Padrão)',
    },
    'en': {
        // Títulos e Textos Principais
        'welcome_name': 'Backcoin.org',
        'welcome_slogan': 'The future is decentralized',
        'welcome_subtitle': 'Discover Something New and Disruptive',
        'welcome_description': 'A complete ecosystem where your participation generates real rewards and social impact.',
        'welcome_continue_btn': 'Continue to Main Actions',
        'welcome_step2_title': 'Welcome to Backchain',
        'welcome_step2_subtitle': 'What would you like to do now?',
        'welcome_presale_btn': 'Acquire Booster NFT (50% OFF)',
        'welcome_airdrop_btn': 'Participate in the Free Airdrop',
        'welcome_explore_btn': 'Explore the Ecosystem (Dashboard)',

        // Novos textos para botões de atalho
        'welcome_tokenomics_btn': 'Tokenomics',
        'welcome_about_btn': 'About the Project',

        // Features (Welcome Modal)
        'feat_taxes_title': 'Earn Ecosystem Fees',
        'feat_taxes_desc': 'Delegate your $BKC and receive a share of the usage fees from *all* services.',
        'feat_pop_title': 'Proof-of-Purchase Mining (PoP)',
        'feat_pop_desc': 'Earn $BKC by creating Vesting Certificates and supporting liquidity.',
        'feat_actions_title': 'Decentralized Actions',
        'feat_actions_desc': 'Participate in 100% on-chain lotteries and campaigns, with guaranteed fairness.',
        'feat_notary_title': 'Decentralized Notary',
        'feat_notary_desc': 'Register the existence of documents on the blockchain, forever.',
        'feat_dao_title': 'Governance (DAO)',
        'feat_dao_desc': 'Help decide the future of the ecosystem by voting on proposals.',

        // Intro Modal
        'intro_title': 'Participate. Earn. Support.',
        'intro_desc': 'Backchain is an ecosystem of Decentralized Actions. Your participation is transparent, secure, and rewarding.',
        'intro_feat1_title': 'Support Network Growth',
        'intro_feat1_desc': 'Your $BKC stake contributes to the network\'s liquidity and stability.',
        'intro_feat2_title': 'Earn in On-Chain Lotteries',
        'intro_feat2_desc': 'Participate in lotteries with verifiable fairness directly on the blockchain.',
        'intro_feat3_title': 'Champion Social Causes',
        'intro_feat3_desc': 'Charity Actions with total transparency and traceability.',
        'intro_understand_btn': 'I Understand, Continue',

        // Share Modal
        'share_title': 'Share the Project',
        'share_desc': 'Help the revolution grow! Share with your friends and community.',
        'share_copy_link_label': 'Or copy the link directly:',
        'share_copy_btn': 'Copy',
        'share_copied_toast': 'Link copied!',
        'share_text': 'I\'m following Backchain! 💎 A new decentralized network project that could be the next Bitcoin. Don\'t miss the revolution! #Backchain #Web3 #Crypto',

        // UGC Modal
        'ugc_title': 'Submit Your Post on ', // + platform
        'ugc_instructions_title': 'Important Instructions',
        'ugc_inst1_title': 'Referral Link:',
        'ugc_inst1_desc': 'Ensure you include your unique referral link (copied below).',
        'ugc_inst2_title': 'Hashtags:',
        'ugc_inst2_desc': 'Use the relevant hashtags provided.',
        'ugc_inst3_title': 'Content:',
        'ugc_inst3_desc': 'The post must be about Backchain (news, articles, or official channels).',
        'ugc_text_label': 'Suggested Text (Link and Hashtags)',
        'ugc_copy_text_btn': 'Copy Text for Posting',
        'ugc_url_label': 'URL of your post on ', // + platform
        'ugc_submit_btn': 'Submit for Audit',
        'ugc_cancel_btn': 'Cancel',
        'ugc_copied_toast': 'Text Copied!',
        'ugc_invalid_url_toast': 'Please enter a valid URL (starting with http/https).',

        // Toast
        'toast_nft_adding': 'Adding NFT #%s to your wallet...',
        'toast_nft_added': 'NFT #%s added successfully!',
        'toast_nft_canceled': 'Action canceled by the user.',
        'toast_nft_error': 'Error adding NFT: %s',
        'toast_no_wallet': 'No Ethereum wallet detected.',
        
        // Timer
        'timer_unlocked': 'Unlocked',
        'timer_fee_text': 'Unstake Fee: 1% (Default)',
    },
    'es': {
        // Títulos e Textos Principais
        'welcome_name': 'Backcoin.org',
        'welcome_slogan': 'El futuro es descentralizado',
        'welcome_subtitle': 'Descubre Algo Nuevo y Disruptivo',
        'welcome_description': 'Un ecosistema completo donde tu participación genera recompensas reales e impacto social.',
        'welcome_continue_btn': 'Continuar a las Acciones Principales',
        'welcome_step2_title': 'Bienvenido a Backchain',
        'welcome_step2_subtitle': '¿Qué te gustaría hacer ahora?',
        'welcome_presale_btn': 'Adquirir Booster NFT (50% OFF)',
        'welcome_airdrop_btn': 'Participar en el Airdrop Gratuito',
        'welcome_explore_btn': 'Explorar el Ecosistema (Dashboard)',

        // Novos textos para botões de atalho
        'welcome_tokenomics_btn': 'Tokenomics',
        'welcome_about_btn': 'Acerca del Proyecto',

        // Features (Welcome Modal)
        'feat_taxes_title': 'Gana Tarifas del Ecosistema',
        'feat_taxes_desc': 'Delega tus $BKC y recibe una parte de las tarifas de uso de *todos* los servicios.',
        'feat_pop_title': 'Minería por Compra (PoP)',
        'feat_pop_desc': 'Gana $BKC al crear Certificados de Vesting y apoyar la liquidez.',
        'feat_actions_title': 'Acciones Descentralizadas',
        'feat_actions_desc': 'Participa en loterías y campañas 100% on-chain, con justicia garantizada.',
        'feat_notary_title': 'Notaría Descentralizada',
        'feat_notary_desc': 'Registra la existencia de documentos en la blockchain, para siempre.',
        'feat_dao_title': 'Gobernanza (DAO)',
        'feat_dao_desc': 'Ayuda a decidir el futuro del ecosistema votando propuestas.',

        // Intro Modal
        'intro_title': 'Participa. Gana. Apoya.',
        'intro_desc': 'Backchain es un ecosistema de Acciones Descentralizadas. Tu participación es transparente, segura y gratificante.',
        'intro_feat1_title': 'Apoya el Crecimiento de la Red',
        'intro_feat1_desc': 'Tu stake de $BKC contribuye a la liquidez y estabilidad de la red.',
        'intro_feat2_title': 'Gana en Loterías On-Chain',
        'intro_feat2_desc': 'Participa en loterías con justicia verificable directamente en la blockchain.',
        'intro_feat3_title': 'Apoya Causas Sociales',
        'intro_feat3_desc': 'Acciones de Caridad con total transparencia y trazabilidad.',
        'intro_understand_btn': 'Entendido, Continuar',

        // Share Modal
        'share_title': 'Comparte el Proyecto',
        'share_desc': '¡Ayuda a que la revolución crezca! Comparte con tus amigos y comunidad.',
        'share_copy_link_label': 'O copia el enlace directamente:',
        'share_copy_btn': 'Copiar',
        'share_copied_toast': '¡Enlace copiado!',
        'share_text': '¡Estoy siguiendo Backchain! 💎 Un nuevo proyecto de red descentralizada que podría ser el próximo Bitcoin. ¡No te pierdas la revolución! #Backchain #Web3 #Crypto',

        // UGC Modal
        'ugc_title': 'Envía tu Publicación en ', // + platform
        'ugc_instructions_title': 'Instrucciones Importantes',
        'ugc_inst1_title': 'Enlace de Referencia:',
        'ugc_inst1_desc': 'Asegúrate de incluir tu enlace de referencia único (copiado abajo).',
        'ugc_inst2_title': 'Hashtags:',
        'ugc_inst2_desc': 'Usa los hashtags relevantes proporcionados.',
        'ugc_inst3_title': 'Contenido:',
        'ugc_inst3_desc': 'La publicación debe ser sobre Backchain (noticias, artículos o canales oficiales).',
        'ugc_text_label': 'Texto Sugerido (Enlace e Hashtags)',
        'ugc_copy_text_btn': 'Copiar Texto para Publicación',
        'ugc_url_label': 'URL de tu publicación en ', // + platform
        'ugc_submit_btn': 'Enviar para Auditoría',
        'ugc_cancel_btn': 'Cancelar',
        'ugc_copied_toast': '¡Texto Copiado!',
        'ugc_invalid_url_toast': 'Por favor, introduce una URL válida (que empiece por http/https).',

        // Toast
        'toast_nft_adding': 'Añadiendo NFT #%s a tu cartera...',
        'toast_nft_added': '¡NFT #%s añadido con éxito!',
        'toast_nft_canceled': 'Acción cancelada por el usuario.',
        'toast_nft_error': 'Error al añadir NFT: %s',
        
        // Timer
        'timer_unlocked': 'Desbloqueado',
        'timer_fee_text': 'Tarifa de Retiro: 1% (Predeterminado)',
    }
};

/**
 * Obtém a string traduzida para a chave e idioma atual.
 * @param {string} key - Chave do dicionário de traduções.
 * @param {string[]} [args=[]] - Argumentos para substituição de placeholders (%s).
 * @returns {string} - A string traduzida.
 */
const getTranslation = (key, args = []) => {
    let text = translations[currentLang][key] || translations['pt'][key] || key;
    args.forEach(arg => {
        text = text.replace('%s', arg);
    });
    return text;
};

/**
 * Define o idioma atual e armazena no State.
 * @param {string} lang - Código do idioma ('pt', 'en', 'es').
 */
export const setLanguage = (lang) => {
    if (translations[lang]) {
        currentLang = lang;
        console.log(`Idioma alterado para: ${lang}`);
        
        // Se o modal de boas-vindas estiver aberto, reabra-o para atualizar o idioma
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop && modalBackdrop.querySelector('.lang-selector')) {
            closeModal(); 
            // Usa setTimeout para garantir que a transição de fechamento termine antes de reabrir
            setTimeout(showWelcomeModal, 350); 
        }
    }
};

// --- FUNÇÕES BÁSICAS DE UI (Mantidas) ---

/**
 * Exibe uma notificação Toast customizada.
 */
export const showToast = (message, type = 'info', txHash = null) => {
    if (!DOMElements.toastContainer) return;

    // Definições de Estilo
    const definitions = {
        success: { icon: 'fa-check-circle', color: 'bg-green-600', border: 'border-green-400' },
        error: { icon: 'fa-exclamation-triangle', color: 'bg-red-600', border: 'border-red-400' },
        info: { icon: 'fa-info-circle', color: 'bg-blue-600', border: 'border-blue-400' }
    };
    const def = definitions[type] || definitions.info;

    const toast = document.createElement('div');
    toast.className = `flex items-center w-full max-w-xs p-3 text-white rounded-lg shadow-2xl transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${def.color} border-l-4 ${def.border}`;

    let content = `
        <div class="flex items-center flex-1">
            <i class="fa-solid ${def.icon} text-lg mr-3"></i>
            <div class="text-sm font-medium">${message}</div>
        </div>
    `;

    if (txHash) {
        const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        content += `<a href="${explorerUrl}" target="_blank" title="View on Etherscan" class="ml-3 flex-shrink-0 text-zinc-200 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                     </a>`;
    }
    
    // Botão de fechar para profissionalismo
    content += `<button class="ml-3 text-zinc-200 hover:text-white transition-colors" onclick="this.closest('.shadow-2xl').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>`;

    toast.innerHTML = content;
    DOMElements.toastContainer.appendChild(toast);

    // Animação de entrada
    setTimeout(() => { 
        toast.classList.remove('translate-x-full', 'opacity-0'); 
        toast.classList.add('translate-x-0', 'opacity-100'); 
    }, 50);

    // Animação de saída e remoção
    setTimeout(() => { 
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 500); // Remove após a transição de saída
    }, 5000);
};

/**
 * Fecha o modal atual.
 */
export const closeModal = () => { 
    if (!DOMElements.modalContainer) return;
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        // Adiciona classe para animação de saída
        const content = document.getElementById('modal-content');
        if (content) {
            content.classList.remove('animate-fade-in-up');
            content.classList.add('animate-fade-out-down');
        }
        backdrop.classList.add('opacity-0');
        
        // Remove após a transição
        setTimeout(() => {
            DOMElements.modalContainer.innerHTML = '';
        }, 300); 
    }
};

/**
 * Abre um modal com conteúdo customizado.
 */
export const openModal = (content, maxWidth = 'max-w-md', allowCloseOnBackdrop = true) => {
    if (!DOMElements.modalContainer) return;
    
    // Animações CSS para profissionalismo
    const style = 
        '<style>' +
            '@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }' +
            '@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }' +
            '.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }' +
            '.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }' +
        '</style>';

    const modalHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full ${maxWidth} shadow-2xl animate-fade-in-up max-h-full overflow-y-auto">
                ${content}
            </div>
        </div>
        ${style}
    `;
    
    // Limpa o conteúdo anterior e insere o novo
    DOMElements.modalContainer.innerHTML = modalHTML;

    // Adiciona listener para fechar ao clicar no fundo
    document.getElementById('modal-backdrop')?.addEventListener('click', e => {
        if (allowCloseOnBackdrop && e.target.id === 'modal-backdrop') {
            closeModal();
        }
    });

    // Adiciona listener a TODOS os botões com a classe closeModalBtn DENTRO do modal atual
    document.getElementById('modal-content')?.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
};

// --- FUNÇÕES DE TIMER E CARTEIRA (Mantidas) ---

/**
 * Inicia a contagem regressiva para elementos de desbloqueio.
 */
export const startCountdownTimers = (elements) => {
    // Limpa quaisquer intervalos existentes
    Object.values(activeCountdownIntervals).forEach(clearInterval);
    activeCountdownIntervals = {};

    elements.forEach(el => {
        const unlockTime = parseInt(el.dataset.unlockTime, 10);
        const delegationIndex = el.dataset.index;

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = unlockTime - now;

            if (remaining <= 0) {
                // Estilo mais limpo para "Unlocked"
                el.innerHTML = `<span class="text-green-500 font-semibold flex items-center"><i class="fa-solid fa-lock-open mr-1"></i> ${getTranslation('timer_unlocked')}</span>`;
                
                const parentCard = el.closest('.delegation-card');
                if (parentCard) {
                    parentCard.querySelector('.force-unstake-btn')?.remove();
                    // Garante que os botões de unstake fiquem ativos e com estilo consistente
                    parentCard.querySelector('.unstake-btn')?.classList.remove('btn-disabled', 'opacity-50', 'cursor-not-allowed');
                    parentCard.querySelector('.unstake-btn')?.removeAttribute('disabled');
                    
                    const penaltyTextEl = parentCard.querySelector('.delegation-penalty-text');
                    if (penaltyTextEl) {
                        penaltyTextEl.textContent = getTranslation('timer_fee_text');
                        penaltyTextEl.classList.remove('text-red-400/80');
                        penaltyTextEl.classList.add('text-green-500'); // Cor de sucesso
                    }
                }

                clearInterval(activeCountdownIntervals[delegationIndex]);
                delete activeCountdownIntervals[delegationIndex];
                return;
            }

            const days = Math.floor(remaining / 86400);
            const hours = Math.floor((remaining % 86400) / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;

            // Layout de timer mais profissional (separadores em cinza, números em destaque)
            el.innerHTML = `
                <div class="flex items-center space-x-1 font-mono text-sm">
                    <span class="text-amber-400">${String(days).padStart(2, '0')}d</span>
                    <span class="text-zinc-500">:</span>
                    <span class="text-amber-400">${String(hours).padStart(2, '0')}h</span>
                    <span class="text-zinc-500">:</span>
                    <span class="text-amber-400">${String(minutes).padStart(2, '0')}m</span>
                    <span class="text-zinc-500">:</span>
                    <span class="text-amber-400">${String(seconds).padStart(2, '0')}s</span>
                </div>`;
        };

        updateTimer();
        activeCountdownIntervals[delegationIndex] = setInterval(updateTimer, 1000);
    });
}

/**
 * Adiciona um NFT à carteira do usuário via Metamask (ou similar).
 */
export async function addNftToWallet(contractAddress, tokenId) {
    if (!tokenId || !window.ethereum) {
        showToast(getTranslation('toast_no_wallet'), 'error');
        return;
    }
    try {
        showToast(getTranslation('toast_nft_adding', [tokenId]), 'info');
        const wasAdded = await window.ethereum.request({ 
            method: 'wallet_watchAsset', 
            params: { 
                type: 'ERC721', 
                options: { 
                    address: contractAddress, 
                    tokenId: tokenId.toString() 
                } 
            } 
        });
        if(wasAdded) {
            showToast(getTranslation('toast_nft_added', [tokenId]), 'success');
        } else {
            showToast(getTranslation('toast_nft_canceled'), 'info');
        }
    } catch (error) { 
        console.error(error); 
        showToast(getTranslation('toast_nft_error', [error.message]), 'error');
    }
}

// --- FUNÇÕES DE MODAIS ESPECÍFICOS (Mantidas) ---

// --- FUNÇÃO DE INTRODUÇÃO (Mantida) ---
export function showIntroModal() {
    if (hasShownIntroModal) return;

    const introContent = `
        <div class="space-y-4">
            <h3 class="text-2xl font-extrabold text-amber-400 mb-4 border-b border-zinc-700 pb-2">${getTranslation('intro_title')}</h3>
            <p class="text-zinc-300">
                ${getTranslation('intro_desc')}
            </p>
            <ul class="space-y-4">
                <li class="flex items-start p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <i class="fa-solid fa-handshake text-green-400 mt-1 mr-3 flex-shrink-0 text-xl"></i>
                    <div>
                        <strong class="text-white block text-lg">${getTranslation('intro_feat1_title')}</strong>
                        <span class="text-zinc-400 text-sm">${getTranslation('intro_feat1_desc')}</span>
                    </div>
                </li>
                <li class="flex items-start p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <i class="fa-solid fa-trophy text-yellow-400 mt-1 mr-3 flex-shrink-0 text-xl"></i>
                    <div>
                        <strong class="text-white block text-lg">${getTranslation('intro_feat2_title')}</strong>
                        <span class="text-zinc-400 text-sm">${getTranslation('intro_feat2_desc')}</span>
                    </div>
                </li>
                <li class="flex items-start p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <i class="fa-solid fa-heart text-red-400 mt-1 mr-3 flex-shrink-0 text-xl"></i>
                    <div>
                        <strong class="text-white block text-lg">${getTranslation('intro_feat3_title')}</strong>
                        <span class="text-zinc-400 text-sm">${getTranslation('intro_feat3_desc')}</span>
                    </div>
                </li>
            </ul>
        </div>
        <div class="mt-6 flex justify-end">
            <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2.5 px-6 rounded-lg transition-colors closeModalBtn shadow-lg">${getTranslation('intro_understand_btn')}</button>
        </div>
    `;
    openModal(introContent, 'max-w-xl');
    hasShownIntroModal = true;
}

// --- FUNÇÃO DE MODAL DE COMPARTILHAMENTO (Mantida) ---
export function showShareModal() {
    const projectUrl = window.location.origin;

    const copyText = getTranslation('share_text'); 

    const encodedUrl = encodeURIComponent(projectUrl);
    const encodedText = encodeURIComponent(copyText + " " + projectUrl); 
    const encodedTwitterText = encodeURIComponent(copyText); 

    const content = `
        <div class="flex justify-between items-start mb-6 border-b border-zinc-700 pb-4">
            <h3 class="text-2xl font-bold text-white">${getTranslation('share_title')}</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <p class="text-zinc-300 mb-8 text-center">${getTranslation('share_desc')}</p>

        <div class="grid grid-cols-3 gap-4 text-center">
            <a href="https://twitter.com/intent/tweet?text=${encodedTwitterText}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-blue-500 hover:bg-blue-600 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                <i class="fa-brands fa-twitter fa-3x mb-2"></i>
                <span class="font-semibold text-lg">X (Twitter)</span>
            </a>

            <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-sky-500 hover:bg-sky-600 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                <i class="fa-brands fa-telegram fa-3x mb-2"></i>
                <span class="font-semibold text-lg">Telegram</span>
            </a>

            <a href="https://api.whatsapp.com/send?text=${encodedText}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-green-500 hover:bg-green-600 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                <i class="fa-brands fa-whatsapp fa-3x mb-2"></i>
                <span class="font-semibold text-lg">WhatsApp</span>
            </a>
        </div>

        <div class="mt-8 pt-4 border-t border-zinc-800">
            <label class="text-sm font-medium text-zinc-400 block mb-2">${getTranslation('share_copy_link_label')}</label>
            <div class="flex gap-2">
                <input type="text" id="shareLinkInput" value="${projectUrl}" readonly class="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 font-mono focus:border-amber-500 focus:ring-amber-500">
                <button id="copyShareLinkBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-5 rounded-lg transition-colors flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-copy text-lg"></i>
                </button>
            </div>
        </div>
    `;

    openModal(content, 'max-w-2xl');

    // Adiciona listener para o botão de copiar link dentro do modal
    document.getElementById('copyShareLinkBtn')?.addEventListener('click', (e) => {
        const input = document.getElementById('shareLinkInput');
        const button = e.currentTarget;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check text-lg"></i>';
            showToast(getTranslation('share_copied_toast'), 'success');
            setTimeout(() => {
                button.innerHTML = originalIcon;
            }, 1500);
        });
    });
}

/**
 * Abre um modal específico para submeter conteúdo UGC.
 */
export function openUgcSubmitModal(platform, referralLink, shareText, onSubmit) {
    const content = `
        <div class="flex justify-between items-start mb-6 border-b border-zinc-700 pb-4">
            <h3 class="text-2xl font-bold text-white">${getTranslation('ugc_title')}${platform}</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div class="bg-zinc-800/50 border border-blue-600/50 rounded-xl p-5 mb-6 space-y-4">
             <p class="text-lg text-blue-400 font-semibold flex items-center">
                <i class="fa-solid fa-lightbulb mr-3 text-2xl"></i>${getTranslation('ugc_instructions_title')}
            </p>
            <ul class="list-disc list-inside text-zinc-300 space-y-2 pl-4">
                <li><strong class="text-white">${getTranslation('ugc_inst1_title')}</strong> ${getTranslation('ugc_inst1_desc')}</li>
                <li><strong class="text-white">${getTranslation('ugc_inst2_title')}</strong> ${getTranslation('ugc_inst2_desc')}</li>
                <li><strong class="text-white">${getTranslation('ugc_inst3_title')}</strong> ${getTranslation('ugc_inst3_desc')}</li>
            </ul>
        </div>

        <div class="mb-6">
            <label class="block text-sm font-medium text-zinc-400 mb-2">${getTranslation('ugc_text_label')}</label>
            <textarea id="ugcShareText" rows="4" readonly class="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 font-mono resize-none">${shareText}</textarea>
            <button id="copyShareTextBtn" class="mt-3 text-sm bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg px-4 py-2 w-full transition-colors">
                <i class="fa-solid fa-copy mr-2"></i> ${getTranslation('ugc_copy_text_btn')}
            </button>
        </div>

        <div class="mb-8">
            <label for="ugcPostUrlInput" class="block text-lg font-medium text-white mb-2">
                ${getTranslation('ugc_url_label')}${platform}:
            </label>
            <input type="url" id="ugcPostUrlInput" required placeholder="https://..." class="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:ring-amber-500">
        </div>

        <div class="flex gap-4">
            <button id="confirmUgcSubmitBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg transition-colors flex-1 text-lg shadow-lg">
                <i class="fa-solid fa-paper-plane mr-2"></i> ${getTranslation('ugc_submit_btn')}
            </button>
             <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors closeModalBtn">
                <i class="fa-solid fa-xmark mr-2"></i> ${getTranslation('ugc_cancel_btn')}
             </button>
        </div>
    `;
    openModal(content, 'max-w-xl'); 

    // Listener para o botão de copiar texto
    document.getElementById('copyShareTextBtn')?.addEventListener('click', (e) => {
        const textarea = document.getElementById('ugcShareText');
        const button = e.currentTarget;
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = `<i class="fa-solid fa-check mr-2"></i> ${getTranslation('ugc_copied_toast')}`;
            showToast(getTranslation('ugc_copied_toast'), 'success');
            setTimeout(() => { button.innerHTML = originalText; }, 1500);
        });
    });

    // Listener para o botão de submissão final
    document.getElementById('confirmUgcSubmitBtn')?.addEventListener('click', () => {
        const urlInput = document.getElementById('ugcPostUrlInput');
        const url = urlInput.value.trim();
        if (url && url.startsWith('http')) {
            onSubmit(url); 
            // O callback (em AirdropPage) é responsável por fechar o modal
        } else {
            showToast(getTranslation('ugc_invalid_url_toast'), 'error');
            urlInput.focus();
        }
    });
}

// =======================================================
//  MODAL DE BOAS-VINDAS (REESCRITO EM 2 ETAPAS)
// =======================================================

/**
 * Função auxiliar para renderizar item de feature (melhora a legibilidade)
 */
function renderFeatureItem(title, description, icon, iconColor) {
    return `
        <div class="flex items-start p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 transition-transform hover:bg-zinc-800 hover:border-amber-500/50">
            <i class="fa-solid ${icon} ${iconColor} mt-1 mr-3 flex-shrink-0 text-xl"></i>
            <div>
                <strong class="text-white block text-lg">${title}</strong>
                <span class="text-zinc-400 text-sm">${description}</span>
            </div>
        </div>
    `;
}

/**
 * ETAPA 2: A tela de botões de ações principais, AGORA COM TOKENOMICS E ABOUT
 */
function showWelcomeModalStep2() {
    const content = `
        <div class="text-center p-4">
            <img src="./assets/bkc_logo_3d.png" alt="Backcoin.org Logo" class="h-24 w-24 mx-auto mb-4 shadow-xl rounded-full border-4 border-amber-500/50">
            <h2 class="text-3xl font-extrabold text-white mb-2">${getTranslation('welcome_step2_title')}</h2>
            <h3 class="text-xl font-semibold text-amber-400 mb-6">${getTranslation('welcome_step2_subtitle')}</h3>
            
            <div class="flex flex-col gap-4">
                <button id="welcomeBtnPresale" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-extrabold py-3 px-5 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl">
                    <i class="fa-solid fa-tags mr-3"></i> ${getTranslation('welcome_presale_btn')}
                </button>
                
                <button id="welcomeBtnAirdrop" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-5 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl">
                    <i class="fa-solid fa-parachute-box mr-3"></i> ${getTranslation('welcome_airdrop_btn')}
                </button>
                
                <button id="welcomeBtnTokenomics" class="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-lg">
                    <i class="fa-solid fa-chart-line mr-3"></i> ${getTranslation('welcome_tokenomics_btn')}
                </button>

                <button id="welcomeBtnAbout" class="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-lg">
                    <i class="fa-solid fa-circle-info mr-3"></i> ${getTranslation('welcome_about_btn')}
                </button>

                <button id="welcomeBtnExplore" class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold py-3 px-4 rounded-xl transition-colors closeModalBtn text-base mt-2">
                    <i class="fa-solid fa-compass mr-3"></i> ${getTranslation('welcome_explore_btn')}
                </button>
            </div>
        </div>
    `;
    
    // Abre o modal (substituindo o conteúdo do Passo 1)
    openModal(content, 'max-w-sm'); 

    // Adiciona os listeners de navegação
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    // Função auxiliar para navegação
    const navigateAndClose = (target) => {
        // Envia o clique do link do menu para que a navegação e o 'active' sejam gerenciados pelo app.js
        document.querySelector(`.sidebar-link[data-target="${target}"]`)?.click();
        closeModal();
    };

    modalContent.querySelector('#welcomeBtnPresale')?.addEventListener('click', () => navigateAndClose('presale'));
    modalContent.querySelector('#welcomeBtnAirdrop')?.addEventListener('click', () => navigateAndClose('airdrop'));
    
    // Listeners para os novos atalhos
    modalContent.querySelector('#welcomeBtnTokenomics')?.addEventListener('click', () => navigateAndClose('tokenomics'));
    modalContent.querySelector('#welcomeBtnAbout')?.addEventListener('click', () => navigateAndClose('about'));
    
    // O botão explore/dashboard
    modalContent.querySelector('#welcomeBtnExplore')?.addEventListener('click', () => navigateAndClose('dashboard'));
}

/**
 * Renderiza os botões de seleção de idioma com imagens de bandeira.
 * As imagens devem estar acessíveis em ./assets/[código].png
 */
function renderLanguageSelectors() {
    const langs = [
        { code: 'en', text: 'English', img: './assets/en.png' }, 
        { code: 'pt', text: 'Português', img: './assets/pt.png' }, 
        { code: 'es', text: 'Español', img: './assets/es.png' }
    ];
    
    // Determina o destaque visual
    const activeClass = 'ring-2 ring-amber-500 scale-110 opacity-100';
    const inactiveClass = 'opacity-70 hover:opacity-100';

    return `
        <div class="flex justify-center space-x-3 mb-6">
            ${langs.map(lang => `
                <button 
                    class="lang-selector p-1.5 rounded-full transition-all duration-200 
                    ${lang.code === currentLang ? activeClass : inactiveClass}" 
                    data-lang="${lang.code}" 
                    title="${lang.text}"
                >
                    <img src="${lang.img}" alt="${lang.text} Flag" class="w-8 h-8 rounded-full shadow-lg">
                </button>
            `).join('')}
        </div>
    `;
}

/**
 * ETAPA 1: O modal de curiosidade (Visão Geral do Ecossistema)
 */
export function showWelcomeModal() {
    // Só exibe uma vez por sessão
    const shouldShow = !hasShownWelcomeModal;
    hasShownWelcomeModal = true;
    if (!shouldShow) {
        // Se o modal já foi exibido, só o reabre se for chamado manualmente (ex: troca de idioma)
    }

    // Constrói o HTML dos itens de feature usando a função auxiliar
    const featureItems = [
        renderFeatureItem(getTranslation('feat_taxes_title'), getTranslation('feat_taxes_desc'), 'fa-sack-dollar', 'text-green-400'),
        renderFeatureItem(getTranslation('feat_pop_title'), getTranslation('feat_pop_desc'), 'fa-gem', 'text-cyan-400'),
        renderFeatureItem(getTranslation('feat_actions_title'), getTranslation('feat_actions_desc'), 'fa-dice', 'text-purple-400'),
        renderFeatureItem(getTranslation('feat_notary_title'), getTranslation('feat_notary_desc'), 'fa-scroll', 'text-yellow-400'),
        renderFeatureItem(getTranslation('feat_dao_title'), getTranslation('feat_dao_desc'), 'fa-users-cog', 'text-red-400')
    ].join(''); // Junta os itens em uma única string HTML

    const content = `
        <div class="text-center p-4">
            ${renderLanguageSelectors()}
            <img src="./assets/bkc_logo_3d.png" alt="Backcoin.org Logo" class="h-20 w-20 mx-auto mb-4 shadow-xl rounded-full">
            
            <h2 class="text-4xl font-extrabold text-amber-400 leading-none">${getTranslation('welcome_name')}</h2> 
            <h3 class="text-xl font-semibold text-white mb-6">${getTranslation('welcome_slogan')}</h3>

            <h3 class="text-xl font-semibold text-white mb-6">${getTranslation('welcome_subtitle')}</h3>
            <p class="text-zinc-300 mb-8">
                ${getTranslation('welcome_description')}
            </p>
            
            <div class="space-y-3 text-left">
                ${featureItems}
            </div>
            
            <button id="welcomeBtnContinue" class="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3.5 px-5 rounded-lg text-xl transition-all duration-300 transform hover:scale-[1.01] mt-8 shadow-lg">
                ${getTranslation('welcome_continue_btn')} <i class="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>
    `;

    openModal(content, 'max-w-lg'); 

    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    // Adiciona listener para os seletores de idioma
    modalContent.querySelectorAll('.lang-selector').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            const newLang = e.currentTarget.dataset.lang;
            // Se o idioma for alterado, a função setLanguage fechará e reabrirá o modal
            setLanguage(newLang); 
        });
    });

    // O botão "Continuar" agora chama o Passo 2 (os botões de ação)
    modalContent.querySelector('#welcomeBtnContinue')?.addEventListener('click', () => {
        showWelcomeModalStep2();
    });
}