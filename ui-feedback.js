// js/ui-feedback.js
// ✅ FINAL VERSION: Clean Logo + Adjusted Button Flow (Buy -> Community -> Group)

import { DOMElements } from './dom-elements.js';
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
        content += `<a href="${explorerUrl}" target="_blank" title="View Transaction" class="ml-3 flex-shrink-0 text-zinc-200 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                      </a>`;
    }
    
    content += `<button class="ml-3 text-zinc-200 hover:text-white transition-colors" onclick="this.closest('.shadow-2xl').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>`;

    toast.innerHTML = content;
    DOMElements.toastContainer.appendChild(toast);

    setTimeout(() => { 
        toast.classList.remove('translate-x-full', 'opacity-0'); 
        toast.classList.add('translate-x-0', 'opacity-100'); 
    }, 50);

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
        '</style>';

    const modalHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div id="modal-content" class="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full ${maxWidth} shadow-2xl animate-fade-in-up max-h-full overflow-y-auto relative">
                <button class="closeModalBtn absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
                ${content}
            </div>
        </div>
        ${style}
    `;
    
    DOMElements.modalContainer.innerHTML = modalHTML;

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
                parentCard.querySelector('.unstake-btn')?.classList.remove('btn-disabled', 'opacity-50', 'cursor-not-allowed');
                parentCard.querySelector('.unstake-btn')?.removeAttribute('disabled');
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
            </div>`;
        return true; 
    });

    if (activeTimerElements.length === 0 && globalTimerInterval) {
        clearInterval(globalTimerInterval);
        globalTimerInterval = null;
    }
};

export const startCountdownTimers = (elements) => {
    elements.forEach(el => {
        if(!activeTimerElements.includes(el)) activeTimerElements.push(el);
    });
    if (!globalTimerInterval && activeTimerElements.length > 0) {
        updateAllTimers();
        globalTimerInterval = setInterval(updateAllTimers, 1000);
    }
};

// --- WALLET HELPERS ---

export async function addNftToWallet(contractAddress, tokenId) {
    if (!tokenId || !window.ethereum) {
        showToast('No wallet detected.', 'error');
        return;
    }
    try {
        showToast(`Adding NFT #${tokenId} to wallet...`, 'info');
        const wasAdded = await window.ethereum.request({ 
            method: 'wallet_watchAsset', 
            params: { 
                type: 'ERC721', 
                options: { address: contractAddress, tokenId: tokenId.toString() } 
            } 
        });
        if(wasAdded) showToast(`NFT #${tokenId} added successfully!`, 'success');
    } catch (error) { 
        console.error(error); 
        showToast(`Error: ${error.message}`, 'error');
    }
}

// --- SHARE MODAL ---
export function showShareModal(userAddress) {
    const projectUrl = window.location.origin;
    const content = `<div class="p-6 text-center text-zinc-300"><h3>Share functionality coming soon!</h3><p>${projectUrl}</p></div>`;
    openModal(content);
}

// --- WELCOME MODAL (CLEAN LOGO & NEW BUTTON FLOW) ---

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

    // Generic Placeholder URL
    const PRESALE_URL = "https://example.com/presale-coming-soon"; 

    const content = `
        <div class="text-center pt-2 pb-4">
            
            <div class="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 mb-6">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">ENVIRONMENT: <span class="text-white font-bold">BKC TESTNET</span></span>
            </div>

            <div class="mb-4">
                <img src="./assets/bkc_logo_3d.png" alt="Backcoin Logo" class="h-24 w-24 mx-auto rounded-full">
            </div>
            
            <h2 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
                Welcome to Backcoin
            </h2> 
            
            <p class="text-zinc-300 mb-8 text-sm leading-relaxed px-2">
                This application is running on the <strong>Testnet</strong>. 
                However, the <strong class="text-amber-400">Exclusive Presale</strong> is live on the <strong>BNB Mainnet</strong>.
            </p>

            <div class="flex flex-col gap-4">
                
                <button id="btnPresale" class="group relative w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-black font-black py-4 px-5 rounded-xl text-lg shadow-xl shadow-amber-500/20 pulse-gold border border-yellow-300/50 flex items-center justify-center gap-3 overflow-hidden">
                    <div class="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                    <i class="fa-solid fa-cart-shopping text-2xl animate-pulse"></i> 
                    <div class="flex flex-col items-start leading-none z-10">
                        <span class="text-xs font-bold opacity-80 uppercase tracking-wider">BNB Mainnet Event</span>
                        <span class="text-xl">BUY EXCLUSIVE NFT</span>
                    </div>
                    <i class="fa-solid fa-chevron-right ml-auto text-black/50 text-base"></i>
                </button>

                <button id="btnAirdrop" class="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-blue-500 text-white font-bold py-3.5 px-5 rounded-xl text-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg flex items-center justify-center gap-3">
                    <i class="fa-solid fa-users text-blue-400 text-xl"></i>
                    <span>Join Community & Airdrop</span>
                </button>

                <button id="btnSocials" class="w-full bg-transparent hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-semibold py-3 px-5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2">
                    <i class="fa-brands fa-telegram text-lg"></i>
                    <span>Enter Official Group / Learn More About Project</span>
                </button>

            </div>
            
            <div class="mt-6 text-xs text-zinc-500">
                Backcoin.org &copy; 2025
            </div>
        </div>
    `;

    openModal(content, 'max-w-sm', false); 
    
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    // --- BUTTON LISTENERS ---

    // 1. Presale (External Link)
    modalContent.querySelector('#btnPresale')?.addEventListener('click', () => {
        window.open(PRESALE_URL, '_blank');
        closeModal();
    });

    // 2. Airdrop (Community Action)
    modalContent.querySelector('#btnAirdrop')?.addEventListener('click', () => {
        navigateAndClose('airdrop');
    });

    // 3. Socials (Official Group Info)
    modalContent.querySelector('#btnSocials')?.addEventListener('click', () => {
        navigateAndClose('socials'); 
    });
}