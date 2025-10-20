// ui-feedback.js

import { DOMElements } from './dom-elements.js';
import { addresses } from './config.js';
import { State } from './state.js'; // Adicionado para showIntroModal

// Gerenciamento de Timers
let activeCountdownIntervals = {};

// --- FUNÇÕES BÁSICAS ---

export const showToast = (message, type = 'info', txHash = null) => {
    if (!DOMElements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 w-full max-w-xs p-4 text-white rounded-lg shadow-lg transform translate-x-full opacity-0 transition-all duration-300 ease-out`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    toast.classList.add(colors[type]);
    let content = `<i class="fa-solid ${icons[type]}"></i><div class="text-sm font-normal">${message}</div>`;
    if (txHash) {
        const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        content += `<a href="${explorerUrl}" target="_blank" title="View on Etherscan" class="ml-auto text-lg hover:text-zinc-200"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
    }
    toast.innerHTML = content;
    DOMElements.toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-x-full', 'opacity-0'); toast.classList.add('translate-x-0', 'opacity-100'); }, 100);
    setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 5000); }, 5000);
};

export const closeModal = () => { DOMElements.modalContainer.innerHTML = ''; };

// Modificado para aceitar maxWidth
export const openModal = (content, maxWidth = 'max-w-md') => {
    const modalHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div id="modal-content" class="bg-sidebar border border-border-color rounded-xl p-6 w-full ${maxWidth} animate-fade-in-up">
                ${content}
                <button class="hidden" id="closeModalBtn"></button>
            </div>
        </div>
        <style>
            @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        </style>
    `;
    DOMElements.modalContainer.innerHTML = modalHTML;
    document.getElementById('modal-backdrop').addEventListener('click', e => {
        if (e.target.id === 'modal-backdrop') closeModal();
    });
    // Adiciona listener a TODOS os botões com a classe closeModalBtn DENTRO do modal atual
    document.getElementById('modal-content').querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
};


// --- FUNÇÃO DE INTRODUÇÃO (AGORA EXPORTADA) ---
let hasShownIntroModal = false;

export function showIntroModal() {
    if (hasShownIntroModal) return;

    const introContent = `
        <div class="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
            <h3 class="2xl font-extrabold text-amber-400 mb-4">Participate. Earn. Support.</h3>
            <p class="text-zinc-300 mb-4">
                Decentralized Actions drive the Backchain ecosystem. Participation is transparent, secure, and uniquely rewarding.
            </p>
            <ul class="space-y-3 text-zinc-300 ml-4">
                <li class="flex items-start">
                    <i class="fa-solid fa-handshake text-green-400 mt-1 mr-3 flex-shrink-0"></i>
                    <div>
                        <strong class="text-white">Support Network Growth:</strong> Your stake locks $BKC, contributing directly to the network's liquidity and stability.
                    </div>
                </li>
                <li class="flex items-start">
                    <i class="fa-solid fa-trophy text-yellow-400 mt-1 mr-3 flex-shrink-0"></i>
                    <div>
                        <strong class="text-white">Earn from Sports:</strong> Win from prize pools in Lottery Draws, guaranteed by verifiable on-chain fairness.
                    </div>
                </li>
                <li class="flex items-start">
                    <i class="fa-solid fa-heart text-red-400 mt-1 mr-3 flex-shrink-0"></i>
                    <div>
                        <strong class="text-white">Champion a Cause:</strong> Fund Charity Actions to provide fully transparent and traceable support for vetted causes.
                    </div>
                </li>
            </ul>
        </div>
        <div class="mt-4 flex justify-end">
            <button class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-md transition-colors closeModalBtn">I Understand</button>
        </div>
    `;
    openModal(introContent);
    hasShownIntroModal = true;
}

// --- FUNÇÕES DE TIMER E CARTEIRA ---

export const startCountdownTimers = (elements) => {
    // Clear any existing intervals
    Object.values(activeCountdownIntervals).forEach(clearInterval);
    activeCountdownIntervals = {};

    elements.forEach(el => {
        const unlockTime = parseInt(el.dataset.unlockTime, 10);
        const delegationIndex = el.dataset.index;

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = unlockTime - now;

            if (remaining <= 0) {
                el.innerHTML = `<span class="text-green-400 font-bold">Unlocked</span>`;
                const parentCard = el.closest('.delegation-card');
                if (parentCard) {
                    parentCard.querySelector('.force-unstake-btn')?.remove();
                    parentCard.querySelector('.unstake-btn')?.classList.remove('btn-disabled');
                    parentCard.querySelector('.unstake-btn')?.removeAttribute('disabled');

                    const expiredTextEl = parentCard.querySelector('.delegation-expired-text'); // Nota: Este elemento não existe no HTML atual
                    if (expiredTextEl) expiredTextEl.innerHTML = `<div class="text-xs text-green-400 mt-2 pt-2 border-t border-border-color/50">You can unstake now to receive your full amount with no penalty.</div>`;
                }

                clearInterval(activeCountdownIntervals[delegationIndex]);
                delete activeCountdownIntervals[delegationIndex];
                return;
            }

            const days = Math.floor(remaining / 86400);
            const hours = Math.floor((remaining % 86400) / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;

            el.innerHTML = `
                <span class="font-mono text-amber-400">${String(days).padStart(2, '0')}d</span>
                <span class="font-mono text-zinc-400">:</span>
                <span class="font-mono text-amber-400">${String(hours).padStart(2, '0')}h</span>
                <span class="font-mono text-zinc-400">:</span>
                <span class="font-mono text-amber-400">${String(minutes).padStart(2, '0')}m</span>
                <span class="font-mono text-zinc-400">:</span>
                <span class="font-mono text-amber-400">${String(seconds).padStart(2, '0')}s</span>`;
        };

        updateTimer();
        activeCountdownIntervals[delegationIndex] = setInterval(updateTimer, 1000);
    });
}

export async function addNftToWallet(contractAddress, tokenId) {
    if (!tokenId) return;
    try {
        showToast(`Adding NFT #${tokenId} to your wallet...`, 'info');
        const wasAdded = await window.ethereum.request({ method: 'wallet_watchAsset', params: { type: 'ERC721', options: { address: contractAddress, tokenId: tokenId.toString() } } });
        if(wasAdded) {
            showToast(`NFT #${tokenId} added to wallet!`, 'success');
        }
    } catch (error) { console.error(error); showToast(`Error adding NFT: ${error.message}`, 'error');}
}

// --- AJUSTE 2: NOVA FUNÇÃO DE MODAL DE COMPARTILHAMENTO ---

export function showShareModal() {
    const projectUrl = window.location.origin;

    // --- CORREÇÃO DE IDIOMA ---
    const copyText = `I'm watching Backchain! 💎 A new decentralized network project that could be the next Bitcoin. Don't miss the revolution! #Backchain #Web3 #Crypto`;

    // Versões codificadas para URLs
    const encodedUrl = encodeURIComponent(projectUrl);
    const encodedText = encodeURIComponent(copyText + " " + projectUrl); // WhatsApp/Telegram
    const encodedTwitterText = encodeURIComponent(copyText); // Twitter

    const content = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Share the Project</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p class="text-zinc-300 mb-6">Help the revolution grow! Share the project with your friends.</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">

            <a href="https://twitter.com/intent/tweet?text=${encodedTwitterText}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-blue-400 hover:bg-blue-500">
                <i class="fa-brands fa-twitter fa-2x"></i>
                <span class="mt-2 font-semibold">Twitter</span>
            </a>

            <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-blue-500 hover:bg-blue-600">
                <i class="fa-brands fa-telegram fa-2x"></i>
                <span class="mt-2 font-semibold">Telegram</span>
            </a>

            <a href="https://api.whatsapp.com/send?text=${encodedText}" target="_blank" rel="noopener noreferrer" class="share-link-btn bg-green-500 hover:bg-green-600">
                <i class="fa-brands fa-whatsapp fa-2x"></i>
                <span class="mt-2 font-semibold">WhatsApp</span>
            </a>
        </div>

        <div class="mt-6">
            <label class="text-sm font-medium text-zinc-400">Or copy the link</label>
            <div class="flex gap-2 mt-2">
                <input type="text" id="shareLinkInput" value="${projectUrl}" readonly class="form-input flex-1 !bg-zinc-900 border-zinc-700">
                <button id="copyShareLinkBtn" class="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-md">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        </div>

        <style>
            .share-link-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 1.5rem 1rem;
                border-radius: 0.5rem;
                color: white;
                transition: background-color 0.2s;
                text-decoration: none;
            }
            #shareLinkInput {
                 background-color: var(--bg-main); border: 1px solid var(--border-color);
            }
        </style>
    `;

    openModal(content);

    // Adiciona listener para o botão de copiar link dentro do modal
    document.getElementById('copyShareLinkBtn').addEventListener('click', (e) => {
        const input = document.getElementById('shareLinkInput');
        const button = e.currentTarget;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
            button.innerHTML = '<i class="fa-solid fa-check"></i>';
            showToast('Link copied!', 'success');
            setTimeout(() => {
                button.innerHTML = '<i class="fa-solid fa-copy"></i>';
                closeModal();
            }, 1500);
        });
    });
}


// --- NOVO MODAL PARA SUBMISSÃO UGC ---
/**
 * Abre um modal específico para submeter conteúdo UGC.
 * @param {string} platform - Nome da plataforma (e.g., 'YouTube', 'X/Twitter').
 * @param {string} referralLink - O link de referência do usuário.
 * @param {string} shareText - O texto pré-gerado com hashtags.
 * @param {function} onSubmit - Callback function to execute when the submit button is clicked, passing the URL.
 */
// *** CORREÇÃO: ADICIONADO 'export' ***
export function openUgcSubmitModal(platform, referralLink, shareText, onSubmit) {
    const content = `
        <div class="flex justify-between items-center mb-5">
            <h3 class="text-xl font-bold text-white">Submit Your ${platform} Post</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div class="bg-main border border-border-color rounded-lg p-4 mb-5 space-y-3">
             <p class="text-sm text-zinc-300 font-semibold">
                <i class="fa-solid fa-circle-info mr-2 text-blue-400"></i>Ensure your post includes:
            </p>
            <ul class="list-disc list-inside text-sm text-zinc-400 space-y-1 pl-2">
                <li>Your unique referral link (copied below).</li>
                <li>Relevant hashtags (copied below).</li>
                <li>A link to Backchain news, articles, or official channels.</li>
            </ul>
        </div>


        <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-400 mb-1">Your Referral Link & Hashtags</label>
            <textarea id="ugcShareText" rows="4" readonly class="form-input !bg-zinc-800 border-zinc-700 font-mono text-xs">${shareText}</textarea>
            <button id="copyShareTextBtn" class="mt-2 text-xs bg-zinc-600 hover:bg-zinc-700 rounded px-3 py-1 w-full"><i class="fa-solid fa-copy mr-1"></i> Copy Text</button>
        </div>

        <div class="mb-6">
            <label for="ugcPostUrlInput" class="block text-sm font-medium text-zinc-300 mb-1">
                Paste the URL of YOUR ${platform} post:
            </label>
            <input type="url" id="ugcPostUrlInput" required placeholder="https://..." class="form-input">
        </div>

        <div class="flex gap-3">
            <button id="confirmUgcSubmitBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-md transition-colors flex-1">
                <i class="fa-solid fa-paper-plane mr-2"></i>Submit for Audit
            </button>
             <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors closeModalBtn">Cancel</button>
        </div>
    `;
    openModal(content, 'max-w-lg'); // Modal um pouco maior

    // Listener para o botão de copiar texto
    document.getElementById('copyShareTextBtn')?.addEventListener('click', (e) => {
        const textarea = document.getElementById('ugcShareText');
        const button = e.currentTarget;
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Copied!';
            setTimeout(() => { button.innerHTML = originalIcon; }, 1500);
        });
    });

    // Listener para o botão de submissão final
    document.getElementById('confirmUgcSubmitBtn')?.addEventListener('click', () => {
        const urlInput = document.getElementById('ugcPostUrlInput');
        const url = urlInput.value.trim();
        if (url && url.startsWith('http')) {
            onSubmit(url); // Chama o callback passado com a URL
            // O callback (em AirdropPage) será responsável por fechar o modal após a lógica de submissão
        } else {
            showToast('Please enter a valid URL starting with http/https.', 'error');
        }
    });
}