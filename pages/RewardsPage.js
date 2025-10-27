// pages/RewardsPage.js

import { DOMElements } from '../dom-elements.js'; // <-- *** ADICIONADO ***
import { State } from '../state.js';
import { loadMyCertificates, calculateUserTotalRewards, getHighestBoosterBoost } from '../modules/data.js';
import { executeWithdraw, executeUniversalClaim } from '../modules/transactions.js';
import { formatBigNumber, renderLoading, renderNoData, renderPaginatedList, ipfsGateway } from '../utils.js';
import { startCountdownTimers, addNftToWallet } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { safeContractCall } from '../modules/data.js';

// Base URI para os metadados dos Certificados de Vesting (do configureSystem.ts)
const VESTING_CERT_BASE_URI = "ipfs://bafybeiew62trbumuxfta36hh7tz7pdzhnh73oh6lnsrxx6ivq5mxpwyo24/";

let rewardsCurrentPage = 1;
const ITEMS_PER_PAGE = 6; // Ajustado para 6 por página, por exemplo

// --- Função Auxiliar para obter HTML do Certificado ---
async function getFullCertificateHTML(certificate) {
    const { tokenId } = certificate;

    // Buscar dados da posição de vesting
    const position = await safeContractCall(State.rewardManagerContract, 'vestingPositions', [tokenId], {totalAmount: 0n, startTime: 0n});
    const totalAmount = position.totalAmount;
    const formattedAmount = formatBigNumber(totalAmount); // Converter para número
    const startTime = Number(position.startTime);
    const vestingDuration = Number(await safeContractCall(State.rewardManagerContract, 'VESTING_DURATION', [], 5n * 365n * 86400n));
    const endTime = startTime + vestingDuration;
    const now = Math.floor(Date.now() / 1000);
    const elapsedTime = Math.max(0, now - startTime);
    const progress = Math.min(100, Math.floor((elapsedTime * 100) / vestingDuration));

    // Determinar o tier com base no valor
    let tierName = 'bronze';
    let metadataFileName = 'bronze.json';
    let tierColor = 'text-yellow-600';

    if (formattedAmount > 10000) {
        tierName = 'diamond';
        metadataFileName = 'diamond.json';
        tierColor = 'text-cyan-400';
    } else if (formattedAmount > 5000) {
        tierName = 'gold';
        metadataFileName = 'gold.json';
        tierColor = 'text-amber-400';
    } else if (formattedAmount > 1000) {
        tierName = 'silver';
        metadataFileName = 'silver.json';
        tierColor = 'text-gray-400';
    }

    // Construir a URI e buscar metadados
    const tokenURI = VESTING_CERT_BASE_URI + metadataFileName;
    let imageUrl = './assets/bkc_logo_3d.png'; // Fallback image
    let displayName = `Vesting Certificate #${tokenId.toString()}`; // Fallback name

    try {
        const response = await fetch(tokenURI.replace("ipfs://", ipfsGateway)); //
        if (response.ok) {
            const metadata = await response.json();
            imageUrl = metadata.image ? metadata.image.replace("ipfs://", ipfsGateway) : imageUrl; //
            displayName = metadata.name || displayName;
        } else {
            console.warn(`Metadata not found for ${tierName} certificate (${tokenId}): ${response.status}`);
        }
    } catch (e) {
        console.warn(`Could not fetch certificate metadata for ${tokenId}:`, e);
    }

    // Calcula valores de retirada (simulação frontend)
    let amountToOwner = 0n;
    let penaltyAmount = 0n;
    const initialPenaltyBips = Number(await safeContractCall(State.rewardManagerContract, 'INITIAL_PENALTY_BIPS', [], 5000n)); //
    if (now >= endTime) {
        amountToOwner = totalAmount;
    } else {
        penaltyAmount = (totalAmount * BigInt(initialPenaltyBips)) / 10000n;
        amountToOwner = totalAmount - penaltyAmount;
    }
    const endDateFormatted = new Date(endTime * 1000).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });

    // Renderizar o HTML com os dados
    return `
        <div class="bg-sidebar border border-border-color rounded-xl p-6 certificate-card flex flex-col h-full">
            <div class="flex items-start gap-4 mb-4">
                 <img src="${imageUrl}" alt="${displayName}" class="w-16 h-16 rounded-lg object-cover border border-zinc-700 nft-clickable-image" data-address="${addresses.rewardManager}" data-tokenid="${tokenId.toString()}">
                <div>
                    <h3 class="font-bold text-lg ${tierColor}">${displayName}</h3>
                    <p class="text-2xl font-bold text-amber-400">${formattedAmount.toFixed(2)} $BKC</p>
                    <p class="text-xs text-zinc-500">Token ID: ${tokenId.toString()}</p>
                </div>
            </div>

            <div class="space-y-2 text-sm mb-4 flex-grow">
                <div class="flex justify-between">
                    <span class="text-zinc-400">Vesting End:</span>
                    <span>${endDateFormatted}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-400">Penalty (Pre-Vest):</span>
                    <span class="text-red-400">${initialPenaltyBips / 100}% (~${formatBigNumber(penaltyAmount).toFixed(2)} $BKC)</span>
                </div>
            </div>

            <div class="mb-4">
                <div class="w-full bg-main rounded-full h-2.5 border border-border-color">
                    <div class="bg-green-500 h-2 rounded-full" style="width: ${progress}%"></div>
                </div>
                <p class="text-xs text-center text-zinc-400 mt-1">Vesting Progress: ${progress}%</p>
            </div>

            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors withdraw-btn mt-auto" data-tokenid="${tokenId.toString()}">
                <i class="fa-solid fa-money-bill-transfer mr-2"></i> Withdraw
            </button>
            <p class="text-xs text-center text-zinc-400 mt-2">You will receive ~${formatBigNumber(amountToOwner).toFixed(4)} $BKC</p>
        </div>
    `;
}

// --- Funções de Renderização da Página ---
async function renderPaginatedCertificates(page) {
    const containerEl = document.getElementById('certificates-list-container'); //
    if (!containerEl) return;

    if (!State.isConnected || !State.myCertificates || State.myCertificates.length === 0) { //
        renderNoData(containerEl, "You don't have any Vesting Certificates yet."); //
        return;
    }

    renderLoading(containerEl); //

    renderPaginatedList( //
        State.myCertificates, //
        containerEl,
        (cert) => `<div class="loading-placeholder h-64 bg-sidebar border border-border-color rounded-xl flex items-center justify-center"><div class="loader inline-block"></div></div>`, // Placeholder
        ITEMS_PER_PAGE,
        page,
        (newPage) => {
            rewardsCurrentPage = newPage;
            renderPaginatedCertificates(rewardsCurrentPage);
        },
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' // Grid classes
    );

    // Carrega o HTML completo para os itens da página atual
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = State.myCertificates.slice(start, end); //
    const htmlPromises = pageItems.map(getFullCertificateHTML);
    const itemsHtml = await Promise.all(htmlPromises);

    // Substitui os placeholders pelo HTML real
    const placeholders = containerEl.querySelectorAll('.loading-placeholder');
    placeholders.forEach((ph, index) => {
        if (itemsHtml[index]) {
            ph.outerHTML = itemsHtml[index];
        } else {
            ph.remove(); // Remove placeholders extras se houver menos itens que o esperado
        }
    });
}


async function renderClaimableRewards() {
    const panelEl = document.getElementById('claimable-rewards-panel'); //
    const contentEl = document.getElementById('rewards-details-content'); //
    const loaderEl = document.getElementById('rewards-loader'); //
    if (!panelEl || !contentEl || !loaderEl) return;

    if (!State.isConnected) { //
        panelEl.classList.add('hidden');
        return;
    }

    panelEl.classList.remove('hidden');
    loaderEl.classList.remove('hidden');
    contentEl.innerHTML = '';

    // 1. Calcular Recompensas Brutas
    const { stakingRewards, minerRewards, totalRewards } = await calculateUserTotalRewards(); //

    // 2. Obter Eficiência Atual do Booster
    const efficiencyData = await getHighestBoosterBoost(); //
    const currentEfficiency = efficiencyData.efficiency; // Ex: 50, 70, 100

    // 3. Calcular Valores de Reivindicação
    const currentClaimBips = 5000 + efficiencyData.highestBoost;
    const claimedAmount = (totalRewards * BigInt(currentClaimBips)) / 10000n;
    const potentialAmount = totalRewards; // 100% efficiency
    const unclaimedAmount = potentialAmount - claimedAmount;

    loaderEl.classList.add('hidden');
    contentEl.innerHTML = `
        <div class="space-y-3 mb-4">
            <div class="flex justify-between items-center text-lg"><span class="text-zinc-400">Total Rewards Owed:</span><span class="font-semibold text-amber-400">${formatBigNumber(potentialAmount).toFixed(4)} $BKC</span></div>
            <div class="flex justify-between items-center text-lg py-1 px-2 bg-zinc-700/50 rounded"><span class="text-zinc-200">Current Claim Rate:</span><span class="font-bold text-green-400">${currentEfficiency}%</span></div>
            <div class="flex justify-between items-center text-lg"><span class="text-zinc-400">Total Claimable NOW:</span><span class="font-bold text-amber-400">${formatBigNumber(claimedAmount).toFixed(4)} $BKC</span></div>
            <div class="border-t border-border-color my-2"></div>
            <div class="flex justify-between items-center text-sm font-bold bg-red-800/20 p-2 rounded"><span class="text-red-400">Lost (or deferred) Rewards:</span><span class="text-red-400">${formatBigNumber(unclaimedAmount).toFixed(4)} $BKC</span></div>
            <p class="text-xs text-zinc-400 pt-1">Acquire a Booster NFT to claim up to 100% of your lost rewards.</p>
        </div>
        <button id="claimAllRewardsBtn" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors ${totalRewards === 0n ? 'btn-disabled' : ''}" ${totalRewards === 0n ? 'disabled' : ''}>
            <i class="fa-solid fa-gift mr-2"></i> Claim All Rewards (${formatBigNumber(claimedAmount).toFixed(4)} $BKC)
        </button>
    `; //

    // O listener do botão de claim agora está em initListeners
}


export const RewardsPage = {
    hasInitializedListeners: false, // Flag para garantir que os listeners sejam adicionados apenas uma vez

    async render() {
        // Carrega dados necessários antes de renderizar
        await getHighestBoosterBoost(); //
        await loadMyCertificates(); //

        // Renderiza as seções da página
        await renderClaimableRewards();
        await renderPaginatedCertificates(rewardsCurrentPage);

        // Inicializa listeners na primeira renderização
        if (!this.hasInitializedListeners) {
            this.initListeners();
            this.hasInitializedListeners = true;
        }
    },

    initListeners() {
        // *** AGORA USA DOMElements.rewards ***
        const container = DOMElements.rewards; //
        if (!container) {
             console.error("Rewards page container not found for listeners.");
             return;
        }
         console.log("Initializing RewardsPage listeners..."); // Log para confirmação

        // Listener único no container principal para delegação de eventos
        container.addEventListener('click', async (e) => {
            const withdrawBtn = e.target.closest('.withdraw-btn'); // Renomeado de '.withdraw-cert-btn' para corresponder ao HTML
            const nftImage = e.target.closest('.nft-clickable-image');
            const claimAllBtn = e.target.closest('#claimAllRewardsBtn'); // Adicionado listener para claim all aqui

            if (withdrawBtn && !withdrawBtn.disabled) {
                const tokenId = withdrawBtn.dataset.tokenid; // Corrigido para minúsculas
                console.log(`Withdraw button clicked for token ID: ${tokenId}`);
                const success = await executeWithdraw(tokenId, withdrawBtn); //
                if (success) {
                    rewardsCurrentPage = 1; // Volta para a primeira página
                    await loadMyCertificates(); // Recarrega certificados
                    await renderClaimableRewards(); // Re-renderiza painel de claim
                    await renderPaginatedCertificates(rewardsCurrentPage); // Re-renderiza certificados
                }
            } else if (nftImage) {
                 e.preventDefault();
                 const address = nftImage.dataset.address;
                 const tokenId = nftImage.dataset.tokenid; // Corrigido para minúsculas
                 if (address && tokenId && address.toLowerCase() === addresses.rewardManager.toLowerCase()) { //
                    addNftToWallet(address, tokenId); //
                 }
            } else if (claimAllBtn && !claimAllBtn.disabled) {
                 console.log("Claim All button clicked via event listener");
                 try {
                     // Recalcula recompensas antes de chamar a transação
                     const { stakingRewards, minerRewards } = await calculateUserTotalRewards(); //
                     const success = await executeUniversalClaim(stakingRewards, minerRewards, claimAllBtn); //
                     if (success) {
                         // Re-renderiza para atualizar os saldos e o painel
                         await renderClaimableRewards();
                     }
                 } catch (error) {
                      console.error("Error during claim all process:", error);
                 }
            }
        });
        console.log("RewardsPage listeners attached.");
    }
    // init() foi removido, lógica agora está em render()
};