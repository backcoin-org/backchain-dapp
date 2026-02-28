// js/ui-feedback.js
// ✅ VERSÃO FINAL: Tratamento de Erro -32002 (MetaMask Sync Issue)
// ✅ ATUALIZADO: Removida lógica de Presale
// ✅ ATUALIZADO: Welcome Modal com mensagem CEO/Unstoppable

import { DOMElements } from './dom-elements.js';
// Se State não for usado aqui, pode remover a importação, mas mantive para compatibilidade
import { State } from './state.js';
import { t, setLang } from './modules/i18n/index.js';

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
        const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        content += `<a href="${explorerUrl}" target="_blank" title="View on Explorer" class="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors">
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
            el.innerHTML = `<span class="text-green-500 font-semibold flex items-center"><i class="fa-solid fa-lock-open mr-1"></i> ${t('feedback.unlocked')}</span>`;
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
        showToast(t('feedback.metamaskPending'), 'warning');
        return;
    }

    if (errorCode === 4001 || errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
        showToast(t('feedback.txCancelled'), 'info');
        return;
    }

    if (errorMessage.toLowerCase().includes('insufficient funds')) {
        showToast(t('feedback.insufficientFunds'), 'error');
        return;
    }

    showToast(`${t('common.error')}: ${errorMessage.substring(0, 100)}...`, 'error');
};

// --- ADD NFT TO WALLET ---

export async function addNftToWallet(tokenId, tierName) {
    if (!window.ethereum) {
        showToast(t('feedback.metamaskNotDetected'), 'error');
        return;
    }

    try {
        const { addresses } = await import('./config.js');
        const nftAddress = addresses?.rewardBooster || '0x5507F70c71b8e1C694841E214fe8F9Dd7c899448';

        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC721',
                options: {
                    address: nftAddress,
                    tokenId: tokenId.toString(),
                },
            },
        });

        if (wasAdded) {
            showToast(t('feedback.nftAddedToWallet', { tier: tierName, id: tokenId }), 'success');
        } else {
            showToast(t('feedback.nftNotAdded'), 'info');
        }
    } catch (error) {
        console.error('Error adding NFT to wallet:', error);
        showToast(t('feedback.failedToAddNft'), 'error');
    }
}

// --- SHARE MODAL ---

export function showShareModal(userAddress) {
    const origin = window.location.origin;
    const isConnected = !!userAddress;
    const shareUrl = isConnected ? `${origin}/#dashboard?ref=${userAddress}` : origin;
    const shortAddr = isConnected ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '';

    const shareText = isConnected
        ? encodeURIComponent(t('feedback.shareConnectedText'))
        : encodeURIComponent(t('feedback.shareDisconnectedText'));

    const content = `
        <div class="text-center py-2">
            <div class="mb-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full mb-3">
                    <i class="fa-solid fa-graduation-cap text-3xl text-amber-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-1">${isConnected ? t('feedback.inviteEarn') : t('feedback.shareBackchain')}</h2>
                <p class="text-zinc-400 text-sm">${isConnected
                    ? t('feedback.shareTutorDesc')
                    : t('feedback.connectForTutorLink')}</p>
            </div>

            ${isConnected ? `
            <!-- Tutor Reward Badges -->
            <div class="flex justify-center gap-2 mb-4">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <i class="fa-solid fa-coins"></i> ${t('feedback.badge10BNB')}
                </span>
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <i class="fa-solid fa-gem"></i> ${t('feedback.badge5BKC')}
                </span>
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <i class="fa-solid fa-infinity"></i> ${t('feedback.badgeForever')}
                </span>
            </div>
            ` : `
            <div class="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p class="text-amber-400 text-xs"><i class="fa-solid fa-lightbulb mr-1"></i> ${t('feedback.connectForTutorLink')}</p>
            </div>
            `}

            <!-- Social Share Grid -->
            <div class="grid grid-cols-4 gap-3 mb-5">
                <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-sky-600 border border-zinc-700 hover:border-sky-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-x-twitter text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">${t('feedback.shareOn.twitter')}</span>
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-600 border border-zinc-700 hover:border-blue-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-telegram text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">${t('feedback.shareOn.telegram')}</span>
                </a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=Backchain%20Protocol&summary=${shareText}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-blue-700 border border-zinc-700 hover:border-blue-600 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-linkedin-in text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">LinkedIn</span>
                </a>
                <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}" target="_blank" class="flex flex-col items-center justify-center bg-zinc-800 hover:bg-green-600 border border-zinc-700 hover:border-green-500 rounded-xl p-3 transition-all duration-300 group">
                    <i class="fa-brands fa-whatsapp text-xl text-zinc-400 group-hover:text-white transition-colors mb-1"></i>
                    <span class="text-[10px] text-zinc-500 group-hover:text-white">${t('feedback.shareOn.whatsapp')}</span>
                </a>
            </div>

            <!-- Copy Link Section -->
            <div class="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-xl p-2">
                <div class="flex-1 px-3 py-2 bg-black/30 rounded-lg overflow-hidden">
                    <p id="share-url-text" class="text-xs font-mono text-zinc-400 truncate">${shareUrl}</p>
                </div>
                <button id="copy-link-btn" onclick="navigator.clipboard.writeText('${shareUrl}').then(() => {
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

            ${isConnected ? `
            <p class="mt-3 text-[11px] text-zinc-500">
                <i class="fa-solid fa-link text-amber-400/60 mr-1"></i>
                ${t('feedback.tutorEmbedded', { addr: shortAddr })}
            </p>
            ` : ''}

            <!-- Footer -->
            <p class="mt-3 text-[11px] text-zinc-600">
                <i class="fa-solid fa-circle-info mr-1"></i>
                ${isConnected
                    ? t('feedback.footerConnected')
                    : t('feedback.footerDisconnected')}
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

// Shared splash overlay styles + helpers (used by welcome + referral)
function injectSplashStyles() {
    if (document.getElementById('splash-styles')) return;
    const s = document.createElement('style');
    s.id = 'splash-styles';
    s.textContent = `
        @keyframes splash-in { 0% { opacity:0; transform:scale(0.92) translateY(12px); } 100% { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes splash-out { 0% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(0.95) translateY(-8px); } }
        @keyframes quote-line { 0% { width:0; } 100% { width:100%; } }
        @keyframes letter-in { 0% { opacity:0; transform:translateY(6px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes splash-progress { 0% { width:0; } 100% { width:100%; } }
        .splash-enter { animation: splash-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .splash-exit  { animation: splash-out 0.4s ease-in forwards; }
        .quote-line   { animation: quote-line 2s ease-out 0.4s both; }
        .letter-stagger span { display:inline-block; opacity:0; animation: letter-in 0.3s ease-out both; }
        .splash-bar { height:2px; background:linear-gradient(90deg,#b45309,#f59e0b,#b45309); border-radius:9999px; animation: splash-progress 3.5s linear forwards; }
    `;
    document.head.appendChild(s);
}

function buildStaggeredTitle(text = 'Backchain') {
    return [...text].map((ch, i) =>
        `<span style="animation-delay:${0.6 + i * 0.05}s">${ch}</span>`
    ).join('');
}

export function dismissSplash(id = 'welcome-splash') {
    const overlay = document.getElementById(id);
    if (!overlay || overlay._dismissed) return;
    overlay._dismissed = true;
    const inner = overlay.querySelector('.splash-enter,.splash-content');
    if (inner) { inner.classList.remove('splash-enter'); inner.classList.add('splash-exit'); }
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
}

export function showWelcomeModal() {
    // Show language selection modal on first visit (no backchain_lang in localStorage)
    // Returns a Promise that resolves when user picks a language
    if (localStorage.getItem('backchain_lang')) {
        hasShownWelcomeModal = true;
        return Promise.resolve();
    }

    return new Promise(resolve => {
        const langs = [
            { code: 'en', flag: './assets/en.png', name: 'English', native: 'English' },
            { code: 'pt', flag: './assets/pt.png', name: 'Portuguese', native: 'Português' },
            { code: 'es', flag: './assets/es.png', name: 'Spanish', native: 'Español' },
            { code: 'ru', flag: './assets/ru.png', name: 'Russian', native: 'Русский' },
            { code: 'zh', flag: './assets/zh.png', name: 'Chinese', native: '中文' },
            { code: 'ko', flag: './assets/ko.png', name: 'Korean', native: '한국어' },
        ];

        const overlay = document.createElement('div');
        overlay.id = 'lang-select-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);opacity:0;transition:opacity .3s ease';

        overlay.innerHTML = `
            <div style="text-align:center;max-width:400px;padding:32px 24px;animation:fade-in-up .4s ease both">
                <img src="./assets/bkc_logo_3d.png" alt="" style="height:56px;width:56px;margin:0 auto 20px;border-radius:50%;box-shadow:0 0 20px rgba(245,158,11,0.2)">
                <h2 style="color:#fff;font-size:20px;font-weight:800;margin-bottom:4px;letter-spacing:.5px">Backchain</h2>
                <p style="color:#a1a1aa;font-size:12px;margin-bottom:28px;letter-spacing:.15em;text-transform:uppercase">Select your language</p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px">
                    ${langs.map(l => `
                        <button data-pick-lang="${l.code}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:12px;cursor:pointer;transition:all .2s ease;outline:none" onmouseenter="this.style.borderColor='rgba(245,158,11,0.5)';this.style.background='rgba(245,158,11,0.08)'" onmouseleave="this.style.borderColor='rgba(63,63,70,0.5)';this.style.background='rgba(39,39,42,0.6)'">
                            <img src="${l.flag}" alt="${l.code}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
                            <span style="color:#fff;font-size:14px;font-weight:600">${l.native}</span>
                            <span style="color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:.1em">${l.code.toUpperCase()}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-pick-lang]');
            if (!btn) return;
            const lang = btn.dataset.pickLang;

            // Visual feedback — highlight selected
            btn.style.borderColor = 'rgba(245,158,11,0.8)';
            btn.style.background = 'rgba(245,158,11,0.15)';
            btn.style.transform = 'scale(1.05)';

            // Apply language
            setLang(lang);
            // setLang won't save if lang === current, so force save
            localStorage.setItem('backchain_lang', lang);
            hasShownWelcomeModal = true;

            // Animate out
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.remove(); resolve(); }, 300);
            }, 250);
        });
    });
}