// utils.js
// ✅ VERSÃO FINAL: Formatação Robusta + Renderização Otimizada + Safe BigInt Handling

const ethers = window.ethers;

// Gateway IPFS Padrão (Pinata/Cloudflare são mais rápidos que ipfs.io)
export const ipfsGateway = "https://white-defensive-eel-240.mypinata.cloud/ipfs/";

// =======================================================
// FORMATAÇÃO DE DADOS (BigInt / Address)
// =======================================================

// Formata BigInt para número float (ex: saldo) com precisão configurável
export const formatBigNumber = (value, decimals = 18) => {
    if (value === null || typeof value === 'undefined') return 0;
    
    // Se já for number/string, tenta converter direto
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);

    try {
        // Safe BigInt Check
        const bigValue = BigInt(value); 
        return parseFloat(ethers.formatUnits(bigValue, decimals));
    } catch (e) {
        // Silencioso em produção para não poluir console com erros de renderização
        return 0;
    }
};

// Formata endereço (0x123...abcd)
export const formatAddress = (address) => {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) return "...";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Formata pStake com sufixos (k, M, B, T) de forma segura
export const formatPStake = (pStake) => {
    try {
        if (pStake === undefined || pStake === null) return '0';
        
        // Converte para BigInt se não for
        const bigPStake = typeof pStake === 'bigint' ? pStake : BigInt(pStake);

        if (bigPStake < 1000n) return bigPStake.toString();

        // Lógica de sufixo (Baseada em Number para simplificação visual)
        const numValue = Number(bigPStake);
        
        // Se for infinito (maior que JS Number safe integer), retorna string pura
        if (!isFinite(numValue)) return bigPStake.toLocaleString('en-US');

        const suffixes = ["", "k", "M", "B", "T"];
        const suffixNum = Math.floor(("" + Math.floor(numValue)).length / 3);
        
        let shortValue = parseFloat((suffixNum !== 0 ? (numValue / Math.pow(1000, suffixNum)) : numValue).toPrecision(3));
        if (shortValue % 1 !== 0) {
            shortValue = shortValue.toFixed(2);
        }
        return shortValue + suffixes[suffixNum];

    } catch (e) {
        return '0';
    }
};


// =======================================================
// RENDERIZAÇÃO DE COMPONENTES (HTML Strings)
// =======================================================

export const renderLoading = (text = "Loading...") => {
    return `<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${text}</div>`;
};

export const renderError = (message = "An error occurred.") => {
    return `<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400 text-sm">${message}</div>`;
};

export const renderNoData = (message = "No data available.") => {
    return `<div class="text-center p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg col-span-full">
                <i class="fa-regular fa-folder-open text-2xl text-zinc-600 mb-2"></i>
                <p class="text-zinc-500 italic text-sm">${message}</p>
            </div>`;
};


// =======================================================
// LISTAS E PAGINAÇÃO (Lógica Reutilizável)
// =======================================================

/**
 * Renderiza uma lista completa com paginação automática.
 */
export const renderPaginatedList = (allItems, containerEl, renderItemFn, itemsPerPage, currentPage = 1, onPageChange, gridClasses = 'space-y-3') => {
    if (!containerEl) return;
    
    if (!Array.isArray(allItems) || allItems.length === 0) {
         containerEl.innerHTML = renderNoData("No items to display.");
         return;
    }

    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Ajusta página atual se estiver fora dos limites
    const safePage = Math.max(1, Math.min(currentPage, totalPages));

    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = allItems.slice(start, end);

    let itemsHtml = '';
    try {
         itemsHtml = pageItems.map(renderItemFn).join('');
    } catch (renderError) {
         console.error("Render Error:", renderError);
         itemsHtml = renderError("Failed to render items.");
    }

    // Controles de Paginação Internos
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = `
            <div class="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-zinc-800/50">
                <button class="pagination-btn prev-page-btn p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                    data-page="${safePage - 1}" ${safePage === 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <span class="text-xs text-zinc-500 font-mono">Page ${safePage} / ${totalPages}</span>
                <button class="pagination-btn next-page-btn p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                    data-page="${safePage + 1}" ${safePage === totalPages ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>
        `;
    }

    containerEl.innerHTML = `<div class="${gridClasses}">${itemsHtml}</div>${paginationHtml}`;

    // Listeners
    if (totalPages > 1) {
        containerEl.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(!btn.hasAttribute('disabled')) {
                    onPageChange(parseInt(btn.dataset.page));
                }
            });
        });
    }
};

/**
 * Renderiza APENAS os controles de paginação (Para uso manual/separado).
 */
export function renderPaginationControls(containerEl, currentPage, totalPages, onPageChange) {
    if (!containerEl) return;
    
    if (totalPages <= 1) {
        containerEl.innerHTML = ''; 
        return;
    }

    const paginationHtml = `
        <div class="flex items-center justify-center gap-3 mt-4">
            <button class="pagination-btn prev-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                ${currentPage} / ${totalPages}
            </span>
            <button class="pagination-btn next-page-btn w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;
    
    containerEl.innerHTML = paginationHtml;

    containerEl.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(!btn.hasAttribute('disabled')) {
                onPageChange(parseInt(btn.dataset.page));
            }
        });
    });
}