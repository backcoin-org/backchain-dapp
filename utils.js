// utils.js

const ethers = window.ethers;

import { State } from './state.js'; // Import não usado, pode ser removido se não for usar State aqui

export const ipfsGateway = "https://ipfs.io/ipfs/";

// Formata BigInt para número float (ex: saldo)
export const formatBigNumber = (value, decimals = 18) => {
    if (value === null || typeof value === 'undefined' || typeof value !== 'bigint') {
        // console.warn("formatBigNumber received invalid input:", value);
        return 0;
    }
    try {
        return parseFloat(ethers.formatUnits(value, decimals));
    } catch (e) {
        console.error("Error formatting BigNumber:", value, e);
        return 0;
    }
};

// Formata endereço (0x123...abcd)
export const formatAddress = (address) => {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) return "Invalid Address";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Formata pStake com sufixos (k, M, B, T)
export const formatPStake = (pStake) => {
    try {
        if (typeof pStake === 'undefined' || pStake === null || typeof pStake !== 'bigint') return '0';
        if (pStake < 1000n) return pStake.toString();

        // Converte para Number APENAS para determinar o sufixo, não para o cálculo final
        const pStakeNumForSuffix = Number(pStake);
        if (isNaN(pStakeNumForSuffix) || !isFinite(pStakeNumForSuffix)) return pStake.toLocaleString('en-US'); // Fallback se muito grande

        const suffixes = ["", "k", "M", "B", "T"];
        let i = 0;
        if (pStakeNumForSuffix >= 1) { // Evita log10(0)
             i = Math.floor(Math.log10(pStakeNumForSuffix) / 3);
        }

        if (i < suffixes.length) {
            // Usa BigInt para a divisão para manter precisão
            const divisor = 10n**(BigInt(i * 3));
            const numBig = pStake / divisor; // Divisão inteira
            const remainderBig = pStake % divisor;

            // Calcula a parte decimal usando BigInt antes de converter
            // Pega os 2 primeiros dígitos do resto, divide pelo divisor / 100
            const decimalDivisor = divisor / 100n;
            let decimalPart = 0;
            if (decimalDivisor > 0n) {
                 decimalPart = Number(remainderBig / decimalDivisor); // Agora converte para número
            }

            // Formata o número final
            const numFormatted = Number(numBig) + decimalPart / 100;

            return `${numFormatted.toFixed(2)}${suffixes[i]}`;
        } else {
            // Se for maior que Trilhões, apenas formata com vírgulas
            return pStake.toLocaleString('en-US');
        }
    } catch (e) {
        console.error("Error formatting pStake:", pStake, e);
        return 'Error';
    }
};


// Funções de Renderização com verificação de elemento
export const renderLoading = (el, text = "Loading...") => {
    if (!el) { console.warn("renderLoading: Element not found."); return; }
    el.innerHTML = `<div class="flex items-center justify-center p-4 text-zinc-400"><div class="loader inline-block mr-2"></div> ${text}</div>`;
};

export const renderError = (el, message = "An error occurred.") => {
    if (!el) { console.warn("renderError: Element not found."); return; }
    // Usa um estilo consistente
    el.innerHTML = `<div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center text-red-400">${message}</div>`;
};

export const renderNoData = (el, message = "No data available.") => {
    if (!el) { console.warn("renderNoData: Element not found."); return; }
    // Usa um estilo consistente
    el.innerHTML = `<div class="text-center p-4 bg-main border border-border-color rounded-lg col-span-full"><p class="text-zinc-500 italic">${message}</p></div>`;
}

// Renderização de Lista Paginada com verificações
export const renderPaginatedList = (allItems, containerEl, renderItemFn, itemsPerPage, currentPage = 1, onPageChange, gridClasses = 'space-y-3') => {
    if (!containerEl) { console.warn("renderPaginatedList: Container element not found."); return; }
    if (!Array.isArray(allItems)) {
         renderError(containerEl, "Invalid data for list.");
         return;
    }

    const totalItems = allItems.length;
    if (totalItems === 0) {
         renderNoData(containerEl, "No items to display."); // Mostra mensagem padrão se vazio
         return;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages)); // Garante que a página é válida

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = allItems.slice(start, end);

    // Tenta renderizar itens, captura erros
    let itemsHtml = '';
    try {
         itemsHtml = pageItems.map(renderItemFn).join('');
    } catch (renderError) {
         console.error("Error rendering list item:", renderError);
         itemsHtml = `<div class="text-red-400 col-span-full">Error rendering items.</div>`;
    }


    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = `
            <div class="flex items-center justify-center gap-2 mt-6">
                <button class="pagination-btn prev-page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left text-xs"></i></button>
                <span class="pagination-page-num">Page ${currentPage} of ${totalPages}</span>
                <button class="pagination-btn next-page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
        `;
    }

    // Limpa listeners antigos antes de adicionar novos
    containerEl.innerHTML = `<div class="${gridClasses}">${itemsHtml}</div>${paginationHtml}`;

    // Adiciona listeners aos botões de paginação, se existirem
    if (totalPages > 1) {
        const prevBtn = containerEl.querySelector('.prev-page-btn');
        const nextBtn = containerEl.querySelector('.next-page-btn');
        if (prevBtn) {
             prevBtn.addEventListener('click', (e) => onPageChange(parseInt(e.currentTarget.dataset.page)));
        }
        if (nextBtn) {
             nextBtn.addEventListener('click', (e) => onPageChange(parseInt(e.currentTarget.dataset.page)));
        }
    }
};