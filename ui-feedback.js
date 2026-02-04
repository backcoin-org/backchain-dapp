// js/ui-feedback.js
// ✅ VERSÃO FINAL: Tratamento de Erro -32002 (MetaMask Sync Issue)
// ✅ ATUALIZADO: Removida lógica de Presale
// ✅ ATUALIZADO: Welcome Modal com mensagem CEO/Unstoppable

import { DOMElements } from './dom-elements.js';
// Se State não for usado aqui, pode remover a importação, mas mantive para compatibilidade
import { State } from './state.js';

// Timer Management
let activeTimerElements = []; 
let globalTimerInterval = null; 
let hasShownWelcomeModal = false; 

// --- BASIC UI FUNCTIONS (Toast & Modal) ---

export const showToast = (message, type = 'info', txHash = null) => {
    if (!DOMElements.toastContainer) return;

    const definitions = {
        success: { icon: 'fa-check-circle', color: 'bg-green-600', border: 'border-green-400' },
        error: { icon: 'fa-exclamation-triangle', color: 'bg-red-600', border: 'border-red-400' },
        info: { icon: 'fa-info-circle', color: 'bg-blue-600', border: 'border-blue-400' },
        warning: { icon: 'fa-exclamation-circle', color: 'bg-yellow-600', border: 'border-yellow-400' }
    };
    const def = definitions[type] || definitions.info;

    const toast = document.createElement('div');
    toast.className = `flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg transition-all duration-500 ease-out 
                       transform translate-x-full opacity-0 
                       ${def.color} border-l-4 ${def.border} mb-3`;

    let content = `
        <div class="flex items-center flex-1">
            <i class="fa-solid ${def.icon} text-xl mr-3"></i>
            <div class="text-sm font-medium leading-tight">${message}</div>
        </div>
    `;

    if (txHash) {
        const explorerUrl = `https://sepolia.arbiscan.io/tx/${txHash}`;
        content += `<a href="${explorerUrl}" target="_blank" title="View on Arbiscan" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`;
    }
    
    content += `<button class="ml-3 text-white/80 hover:text-white transition-colors focus:outline-none" onclick="this.closest('.shadow-lg').remove()">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>`;

    toast.innerHTML = content;
    DOMElements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0'); 
        toast.classList.add('translate-x-0', 'opacity-100'); 
    });

    setTimeout(() => { 
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
};

export const closeModal = () => { 
    if (!DOMElements.modalContainer) return;
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        const content = document.getElementById('modal-content');
        if (content) {
            content.classList.remove('animate-fade-in-up');
            content.classList.add('animate-fade-out-down');
        }
        backdrop.classList.remove('opacity-100'); 
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
            DOMElements.modalContainer.innerHTML = '';
        }, 300); 
    }
};

export const openModal = (content, maxWidth = 'max-w-md', allowCloseOnBackdrop = true) => {
    if (!DOMElements.modalContainer) return;
    
    const style = 
        '<style>' +
            '@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }' +
            '@keyframes fade-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }' +
            '.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }' +
            '.animate-fade-out-down { animation: fade-out-down 0.3s ease-in forwards; }' +
            '.pulse-gold { animation: pulse-gold 2s infinite; }' +
            '@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }' +
            '@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }' +
            '.animate-glow { animation: glow 2s ease-in-out infinite; }' +
            '@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }' +
            '.animate-float { animation: float 3s ease-in-out infinite; }' +
            '@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }' +
            '.animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }' +
        '</style>';

    const modalHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${maxWidth} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl transition-colors focus:outline-none"><i class="fa-solid fa-xmark"></i></button>
                ${content}
            </div>
        </div>
        ${style}
    `;
    
    DOMElements.modalContainer.innerHTML = modalHTML;

    requestAnimationFrame(() => {
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) backdrop.classList.remove('opacity-0');
        if (backdrop) backdrop.classList.add('opacity-100');
    });

    document.getElementById('modal-backdrop')?.addEventListener('click', e => {
        if (allowCloseOnBackdrop && e.target.id === 'modal-backdrop') {
            closeModal();
        }
    });

    document.getElementById('modal-content')?.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
};

// --- TIMER OPTIMIZATION ---

const updateAllTimers = () => {
    const now = Math.floor(Date.now() / 1000);
    activeTimerElements = activeTimerElements.filter(el => {
        if (!document.body.contains(el)) return false;
        const unlockTime = parseInt(el.dataset.unlockTime, 10);
        const remaining = unlockTime - now;

        if (remaining <= 0) {
            el.innerHTML = `<span class="text-green-500 font-semibold flex items-center"><i class="fa-solid fa-lock-open mr-1"></i> Unlocked</span>`;
            const parentCard = el.closest('.delegation-card');
            if (parentCard) {
                parentCard.querySelector('.force-unstake-btn')?.remove();
                const unstakeBtn = parentCard.querySelector('.unstake-btn');
                if (unstakeBtn) {
                    unstakeBtn.classList.remove('btn-disabled', 'opacity-50', 'cursor-not-allowed');
                    unstakeBtn.removeAttribute('disabled');
                }
            }
            return false; 
        }

        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        el.innerHTML = `
            <div class="flex items-center space-x-1 font-mono text-sm">
                <span class="text-amber-400">${String(days).padStart(2, '0')}d</span>
                <span class="text-zinc-500">:</span>
                <span class="text-amber-400">${String(hours).padStart(2, '0')}h</span>
                <span class="text-zinc-500">:</span>
                <span class="text-amber-400">${String(minutes).padStart(2, '0')}m</span>
                <span class="text-zinc-500">:</span>
                <span class="text-amber-400">${String(seconds).padStart(2, '0')}s</span>
            </div>
        `;
        return true;
    });

    if (activeTimerElements.length === 0 && globalTimerInterval) {
        clearInterval(globalTimerInterval);
        globalTimerInterval = null;
    }
};

export const registerTimerElement = (element) => {
    if (!element || activeTimerElements.includes(element)) return;
    activeTimerElements.push(element);
    if (!globalTimerInterval) {
        globalTimerInterval = setInterval(updateAllTimers, 1000);
    }
    updateAllTimers();
};

// --- EXTERNAL SERVICES ERROR HANDLING ---

export const handleRpcError = (error) => {
    console.error("RPC Error caught:", error);
    
    const errorCode = error.code || error?.data?.code;
    const errorMessage = error.message || error?.data?.message || String(error);

    if (errorCode === -32002 || errorMessage.includes('-32002')) {
        showToast(
            'MetaMask has a pending request. Please open your MetaMask wallet extension and complete or reject any pending actions.',
            'warning'
        );
        return;
    }

    if (errorCode === 4001 || errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
        showToast('Transaction cancelled by user.', 'info');
        return;
    }

    if (errorMessage.toLowerCase().includes('insufficient funds')) {
        showToast('Insufficient funds in your wallet.', 'error');
        return;
    }

    showToast(`Error: ${errorMessage.substring(0, 100)}...`, 'error');
};

// --- ADD NFT TO WALLET ---

export async function addNftToWallet(tokenId, tierName) {
    if (!window.ethereum) {
        showToast('MetaMask not detected', 'error');
        return;
    }

    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: {
                    address: '0xf2EA307686267dC674859da28C58CBb7a5866BCf', // RewardBoosterNFT V6
                    tokenId: tokenId.toString(),
                },
            },
        });

        if (wasAdded) {
            showToast(`${tierName} NFT #${tokenId} added to wallet!`, 'success');
        } else {
            showToast('NFT not added to wallet', 'info');
        }
    } catch (error) {
        console.error('Error adding NFT to wallet:', error);
        showToast('Failed to add NFT to wallet', 'error');
    }
}

// --- SHARE MODAL ---

export function showShareModal() {
    const projectUrl = window.location.origin;
    const shareText = encodeURIComponent("Check out Backcoin - The Unstoppable DeFi Protocol on Arbitrum! Build your own business. Be Your Own CEO. 🚀 #Backcoin #DeFi #Arbitrum #BeYourOwnCEO");

    const content = `
        <div class="text-center py-2">
            <div class="mb-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full mb-3">
                    <i class="fa-solid fa-share-nodes text-3xl text-amber-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">Spread the Word</h2>
                <p class="text-zinc-400 text-sm">Help us grow the unstoppable community!</p>
            </div>

            <!-- Social Share Grid -->
            <div class="grid grid-cols-4 gap-3 mb-5">
                <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(projectUrl)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-sky-600 border border-zinc-700 hover:border-sky-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-x-twitter text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">Twitter</span>
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(projectUrl)}&text=${shareText}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-600 border border-zinc-700 hover:border-blue-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-telegram text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">Telegram</span>
                </a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(projectUrl)}&title=Backcoin%20Protocol&summary=${shareText}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-700 border border-zinc-700 hover:border-blue-600 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-linkedin-in text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">LinkedIn</span>
                </a>
                <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(projectUrl)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-green-600 border border-zinc-700 hover:border-green-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-whatsapp text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">WhatsApp</span>
                </a>
            </div>

            <!-- Copy Link Section -->
            <div class="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-xl p-2">
                <div class="flex-1 px-3 py-2 bg-black/30 rounded-lg overflow-hidden">
                    <p id="share-url-text" class="text-xs font-mono text-zinc-400 truncate">${projectUrl}</p>
                </div>
                <button id="copy-link-btn" onclick="navigator.clipboard.writeText('${projectUrl}').then(() => { 
                            document.getElementById('copy-link-btn').innerHTML = '<i class=\\'fa-solid fa-check\\'></i>'; 
                            document.getElementById('copy-link-btn').classList.add('bg-green-600', 'border-green-500');
                            document.getElementById('copy-link-btn').classList.remove('bg-amber-600', 'border-amber-500', 'hover:bg-amber-500');
                            setTimeout(() => { 
                                document.getElementById('copy-link-btn').innerHTML = '<i class=\\'fa-solid fa-copy\\'></i>'; 
                                document.getElementById('copy-link-btn').classList.remove('bg-green-600', 'border-green-500');
                                document.getElementById('copy-link-btn').classList.add('bg-amber-600', 'border-amber-500', 'hover:bg-amber-500');
                            }, 2000); 
                        })" 
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-amber-600 hover:bg-amber-500 border border-amber-500 rounded-lg text-white transition-all duration-300">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>

            <!-- Footer -->
            <p class="mt-4 text-[11px] text-zinc-600">
                <i class="fa-solid fa-heart text-red-500 mr-1"></i>
                Thank you for supporting Backcoin!
            </p>
        </div>
    `;

    openModal(content, 'max-w-md');
}

// --- WELCOME MODAL (UNSTOPPABLE + CEO) ---

const navigateAndClose = (target) => {
    if (window.navigateTo) {
        window.navigateTo(target);
    } else {
        console.error("navigateTo function not found.");
    }
    closeModal();
};

export function showWelcomeModal() {
    if (hasShownWelcomeModal) return;
    hasShownWelcomeModal = true;

    const TELEGRAM_URL = "https://t.me/BackCoinorg";
    const DOCS_URL = "https://github.com/backcoin-org/backchain-dapp";

    const content = `
        <div class="text-center pt-2 pb-4">
            
            <!-- Voltaire Quote Banner -->
            <div class="relative bg-gradient-to-r from-zinc-800/80 via-zinc-900 to-zinc-800/80 border border-zinc-700/50 rounded-xl p-3 mb-5 overflow-hidden">
                <div class="absolute inset-0 animate-shimmer"></div>
                <p class="text-[11px] text-zinc-400 italic relative z-10">
                    "I may not agree with what you say, but I will defend to the death your right to say it."
                </p>
                <p class="text-[10px] text-amber-500/80 font-semibold mt-1 relative z-10">— Voltaire</p>
            </div>

            <!-- Network Badge -->
            <div class="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 mb-5 shadow-sm">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">NETWORK: <span class="text-emerald-400 font-bold">ARBITRUM SEPOLIA</span></span>
            </div>

            <!-- Logo with Glow -->
            <div class="mb-4 relative inline-block animate-float">
                <div class="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-glow"></div>
                <img src="/assets/bkc_logo_3d.png" alt="Backcoin Logo" class="h-24 w-24 mx-auto rounded-full relative z-10 shadow-2xl ring-2 ring-amber-500/30">
            </div>
            
            <!-- Title -->
            <h2 class="text-3xl font-black text-white mb-1 uppercase tracking-wide">
                Backchain Protocol
            </h2>
            
            <!-- Unstoppable Badge -->
            <div class="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 via-amber-600/20 to-red-600/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-4">
                <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
                <span class="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 uppercase tracking-wider">UNSTOPPABLE • PERMISSIONLESS • IMMUTABLE</span>
            </div>

            <!-- Main Description -->
            <p class="text-zinc-300 mb-4 text-sm leading-relaxed px-2">
                DeFi infrastructure that <strong class="text-amber-400">no one can stop</strong>. 
                No admin keys. No pause functions. No blacklists.
            </p>

            <!-- CEO Box -->
            <div class="bg-gradient-to-br from-amber-600/10 via-zinc-800/50 to-orange-600/10 border border-amber-500/20 rounded-xl p-4 mb-5">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <i class="fa-solid fa-crown text-amber-400"></i>
                    <span class="text-base font-black text-white uppercase tracking-wide">Be Your Own CEO</span>
                </div>
                <p class="text-xs text-zinc-400 leading-relaxed mb-3">
                    Build an interface to Backchain and <strong class="text-amber-400">earn commissions</strong> from every transaction. 
                    No permission needed. No registration. <strong class="text-white">You are the CEO.</strong>
                </p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-code text-purple-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Build</p>
                    </div>
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-users text-blue-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Attract Users</p>
                    </div>
                    <div class="bg-black/30 rounded-lg p-2">
                        <i class="fa-solid fa-coins text-amber-400 text-lg mb-1"></i>
                        <p class="text-[10px] text-zinc-500">Earn BKC+ETH</p>
                    </div>
                </div>
            </div>

            <!-- Community Badge -->
            <div class="inline-flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-full px-4 py-2 mb-5">
                <i class="fa-solid fa-users text-zinc-500"></i>
                <span class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">100% Community • 0% VCs • 0% Team Allocation</span>
            </div>

            <div class="flex flex-col gap-3">
                
                <!-- Airdrop Button (Principal) -->
                <button id="btnAirdrop" class="group relative w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-amber-500/20 pulse-gold border border-amber-400/50 flex items-center justify-center gap-3 overflow-hidden transform hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-gift text-2xl"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-0.5">Phase 1 Active</span>
                        <span class="text-lg">CLAIM FREE AIRDROP</span>
                    </div>
                    <div class="ml-auto flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                        <span class="text-xs font-bold">7M BKC</span>
                    </div>
                </button>

                <!-- Two columns: Explore & Be CEO -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Explore dApp Button -->
                    <button id="btnExplore" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-compass text-emerald-400 group-hover:rotate-12 transition-transform"></i>
                        <span>Explore dApp</span>
                    </button>

                    <!-- Be a CEO Button -->
                    <button id="btnCEO" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-crown text-amber-400 group-hover:scale-110 transition-transform"></i>
                        <span>Be a CEO</span>
                    </button>
                </div>

                <!-- Two columns: Docs & Telegram -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Docs Button -->
                    <button id="btnDocs" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-solid fa-book text-purple-400 group-hover:scale-110 transition-transform"></i>
                        <span>Docs</span>
                    </button>

                    <!-- Telegram Button -->
                    <button id="btnTelegram" class="bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700 hover:border-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                        <i class="fa-brands fa-telegram text-blue-400 group-hover:scale-110 transition-transform"></i>
                        <span>Telegram</span>
                    </button>
                </div>

                <!-- Community Button -->
                <button id="btnSocials" class="w-full bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-share-nodes text-zinc-400 group-hover:text-amber-400 group-hover:scale-110 transition-all"></i>
                    <span>Community & Socials</span>
                </button>
            </div>
            
            <!-- Footer with Unstoppable Message -->
            <div class="mt-5 pt-4 border-t border-zinc-800">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30"></div>
                    <i class="fa-solid fa-infinity text-amber-500/50 text-xs"></i>
                    <div class="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30"></div>
                </div>
                <p class="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">
                    No one can freeze it • No one can censor it • No one can stop it
                </p>
                <p class="text-[9px] text-zinc-700 font-mono">
                    THE PROTOCOL IS UNSTOPPABLE
                </p>
            </div>
        </div>
    `;

    openModal(content, 'max-w-sm', false); 
    
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    modalContent.querySelector('#btnAirdrop')?.addEventListener('click', () => {
        navigateAndClose('airdrop');
    });

    modalContent.querySelector('#btnExplore')?.addEventListener('click', () => {
        closeModal();
    });

    modalContent.querySelector('#btnCEO')?.addEventListener('click', () => {
        window.open(DOCS_URL + '/blob/main/docs/BE_YOUR_OWN_CEO.md', '_blank');
    });

    modalContent.querySelector('#btnDocs')?.addEventListener('click', () => {
        window.open(DOCS_URL, '_blank');
    });

    modalContent.querySelector('#btnSocials')?.addEventListener('click', () => {
        navigateAndClose('socials'); 
    });

    modalContent.querySelector('#btnTelegram')?.addEventListener('click', () => {
        window.open(TELEGRAM_URL, '_blank');
    });
}