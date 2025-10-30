// pages/ActionsPage.js

const ethers = window.ethers;

import { State } from '../state.js';
import { loadUserData } from '../modules/data.js';
import { formatBigNumber, formatAddress, renderLoading, renderError, renderNoData, renderPaginatedList, formatPStake } from '../utils.js';
import { showToast, openModal, closeModal, showIntroModal } from '../ui-feedback.js';
import { addresses } from '../config.js';
import { safeContractCall } from '../modules/data.js'; 

let actionsCurrentPage = 1;
let currentFilter = 'all'; 
let currentSort = 'default'; 

// --- Constantes e Helpers da UI ---
const ACTION_TYPES = ['Sports', 'Charity']; 
const ACTION_STATUS = ['Open', 'Finalized']; 

function getStatusBadge(action) {
    const statusText = ACTION_STATUS[action.status] || 'Unknown';
    const now = Math.floor(Date.now() / 1000);
    
    if (action.status === 0) { // Open
        if (now >= action.endTime) {
            return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400">Ready to Finalize</span>`;
        }
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">${statusText}</span>`;
    }
    if (action.status === 1) { // Finalized
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400">${statusText}</span>`;
    }
    return statusText;
}

// --- Funções de Transação ---

/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 1 =======================
 * ==================================================================
 * Atualizado para buscar a taxa de criação do Hub e enviar o boosterId.
 */
async function executeCreateAction(duration, type, charityStake, description, boosterId, btnElement) {
    if (!State.signer) return showToast("Connect wallet first.", "error");
    if (!State.ecosystemManagerContract || !State.actionsManagerContract) {
         return showToast("Contracts not loaded.", "error");
    }

    try {
        let stakeToApprove = 0n;
        let charityStakeWei = 0n;

        if (type === 1) { // Charity
            if (!charityStake || parseFloat(charityStake) <= 0) throw new Error("Stake for Charity must be greater than zero.");
            charityStakeWei = ethers.parseEther(charityStake.toString());
            stakeToApprove = charityStakeWei;
        } else { // Sports
            const minStakeSports = await safeContractCall(State.actionsManagerContract, 'getMinCreatorStake', [], 0n);
            if (minStakeSports === 0n) {
                throw new Error("Minimum stake for Sports is currently zero. The system may not be fully initialized or total supply is too low.");
            }
            stakeToApprove = minStakeSports;
        }
        
        // MUDANÇA: Buscar a taxa de criação no Hub
        const [creationFee] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["ACTION_CREATE_SERVICE"], // Chave do serviço 
            [0n, 0n]
        );
        
        // MUDANÇA: A aprovação total é o Stake + a Taxa de Criação 
        const totalApproval = stakeToApprove + creationFee;
        
        showToast(`Approving ${formatBigNumber(totalApproval)} $BKC (Stake + Fee)...`, "info");
        const approveTx = await State.bkcTokenContract.approve(addresses.actionsManager, totalApproval);
        await approveTx.wait();
        showToast('Approval successful!', "success");
        
        if(btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Creating...';
        showToast("Submitting action creation...", "info");
        
        // MUDANÇA: Envia o boosterId na chamada 
        const createTx = await State.actionsManagerContract.createAction(
            duration, 
            type, 
            charityStakeWei, 
            description,
            boosterId // <--- NOVO PARÂMETRO
        );
        const receipt = await createTx.wait();
        
        showToast('Action created successfully!', "success", receipt.hash);
        closeModal();
        await loadUserData();
        await ActionsPage.render(true);

    } catch (e) {
        console.error(e);
        const reason = e.reason || e.message || 'Transaction reverted.';
        showToast(`Creation Failed: ${reason}`, "error");
    } finally {
        if(btnElement) btnElement.innerHTML = 'Create Action';
    }
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 1 =========================
 * ==================================================================
 */


/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 2 =======================
 * ==================================================================
 * Atualizado para buscar a taxa de participação do Hub e enviar o boosterId.
 */
async function executeParticipate(actionId, amount, boosterId, btnElement) {
    if (!State.signer) return showToast("Connect wallet first.", "error");
     if (!State.ecosystemManagerContract || !State.actionsManagerContract) {
         return showToast("Contracts not loaded.", "error");
    }
    
    try {
        const amountWei = ethers.parseEther(amount.toString());

        // MUDANÇA: Buscar a taxa de participação no Hub
        const [participationFee] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["ACTION_PARTICIPATE_SERVICE"], // Chave do serviço 
            [0n, 0n]
        );

        // MUDANÇA: A aprovação total é o Valor + a Taxa de Participação 
        const totalApproval = amountWei + participationFee;

        showToast(`Approving ${formatBigNumber(totalApproval)} $BKC (Amount + Fee)...`, "info");
        
        const approveTx = await State.bkcTokenContract.approve(addresses.actionsManager, totalApproval);
        await approveTx.wait();
        showToast('Approval successful!', "success");
        
        if(btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Participating...';
        
        // MUDANÇA: Envia o boosterId na chamada 
        const participateTx = await State.actionsManagerContract.participate(
            actionId, 
            amountWei,
            boosterId // <--- NOVO PARÂMETRO
        );
        const receipt = await participateTx.wait();
        
        showToast('Participation successful!', "success", receipt.hash);
        closeModal();
        await ActionsPage.render(true);
    } catch (e) {
        console.error(e);
        showToast(`Error participating: ${e.reason || e.message || 'Transaction reverted.'}`, "error");
    } finally {
        if(btnElement) btnElement.innerHTML = 'Participate';
    }
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 2 =========================
 * ==================================================================
 */

async function executeFinalizeAction(actionId, btnElement) {
    if (!State.signer) return showToast("Connect wallet first.", "error");
    try {
        if(btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Finalizing...';
        const finalizeTx = await State.actionsManagerContract.finalizeAction(actionId);
        const receipt = await finalizeTx.wait();
        showToast('Action finalized! Prize distributed.', "success", receipt.hash);
        await loadUserData(); 
        await ActionsPage.render(true);
    } catch (e) {
        console.error(e);
        showToast(`Error finalizing action: ${e.reason || e.message || 'Transaction reverted.'}`, "error");
    } finally {
        if(btnElement) btnElement.innerHTML = 'Finalize Action';
    }
}

async function loadAllActions() {
    if (!State.actionsManagerContract) return [];
    try {
        const actionCounter = Number(await safeContractCall(State.actionsManagerContract, 'actionCounter', [], 0n));
        if (actionCounter === 0) return [];
        const promises = [];
        const fallbackActionStruct = { 
            id: 0n, creator: addresses.actionsManager, description: "", actionType: 0, status: 0, 
            endTime: 0n, totalPot: 0n, creatorStake: 0n, beneficiary: addresses.actionsManager, 
            totalCoupons: 0n, winner: addresses.actionsManager, closingBlock: 0n, winningCoupon: 0n 
        };
        for (let i = 1; i <= actionCounter; i++) {
            promises.push(safeContractCall(State.actionsManagerContract, 'actions', [i], fallbackActionStruct));
        }
        const rawActions = await Promise.all(promises);
        // Filtra ações que podem ter falhado ao carregar (retornado fallback com id 0)
        return rawActions.filter(a => a.id > 0n).map(a => ({
            id: Number(a.id), creator: a.creator, description: a.description, actionType: Number(a.actionType),
            status: Number(a.status), endTime: Number(a.endTime), totalPot: a.totalPot,
            beneficiary: a.beneficiary, winner: a.winner,
        })); 
    } catch (e) { console.error("Error loading all actions:", e); return []; }
}

function getActionCardHTML(action) {
    const now = Math.floor(Date.now() / 1000);
    const timeEnded = now >= action.endTime;
    const isFinalized = action.status === 1;

    let buttonHTML = '';
    if (!isFinalized) {
        if (timeEnded) {
            buttonHTML = `<button class="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-md transition-colors action-finalize-btn" data-id="${action.id}">Finalize Action</button>`;
        } else {
            const buttonText = action.actionType === 0 ? 'Participate' : 'Donate';
            const buttonColor = action.actionType === 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600';
            buttonHTML = `<button class="w-full ${buttonColor} text-white font-bold py-2 px-3 rounded-md transition-colors action-participate-btn" data-id="${action.id}" data-type="${action.actionType}">${buttonText}</button>`;
        }
    } else {
        // Se finalizado, não mostra botão de ação
        buttonHTML = `<div class="w-full text-center py-2"><span class="text-green-400 font-bold">Finalized!</span></div>`;
    }

    // Extrai o link de publicidade da descrição, se existir
    const publicityLinkMatch = action.description.match(/\[Link: (.*?)\]/);
    let descriptionText = publicityLinkMatch ? action.description.replace(publicityLinkMatch[0], '').trim() : action.description;
    const title = action.actionType === 0 ? `${descriptionText || 'Sports Action'} #${action.id}` : descriptionText;
    
    let resultLine = '';
    if (isFinalized) {
        const recipientAddress = action.actionType === 0 ? action.winner : action.beneficiary;
        const recipientLabel = action.actionType === 0 ? 'Winner' : 'Beneficiary';
        resultLine = `<div class="text-xs text-zinc-400 border-t border-border-color/50 pt-2 mt-2"><p><strong>${recipientLabel}:</strong> ${formatAddress(recipientAddress)}</p></div>`;
    }

    return `
        <div class="bg-sidebar border border-border-color rounded-xl p-5 flex flex-col justify-between h-full shadow-lg">
            <div>
                <div class="flex items-start justify-between mb-3 border-b border-border-color/50 pb-3">
                    <h3 class="text-xl font-bold break-words">${title}</h3>
                    ${getStatusBadge(action)}
                </div>
                <div class="space-y-3 flex-1 mb-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div><p class="text-xs text-zinc-500">Creator</p><p class="font-bold text-amber-300">${formatAddress(action.creator)}</p></div>
                        <div><p class="text-xs text-zinc-500">Current Pot</p><p class="font-bold text-green-400">${formatBigNumber(action.totalPot).toFixed(2)} $BKC</p></div>
                    </div>
                    ${resultLine}
                </div>
            </div>
            <div class="mt-auto flex gap-2">
                <div class="flex-1">${buttonHTML}</div>
                <button class="w-10 h-10 flex-shrink-0 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-md transition-colors action-share-btn" title="Share Action" data-id="${action.id}"><i class="fa-solid fa-share-nodes"></i></button>
            </div>
        </div>`;
}

/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 3 =======================
 * ==================================================================
 * Modal de criação agora é 'async' e busca dados dinâmicos do Hub
 * (taxas de recompensa, taxa de criação) antes de ser exibido.
 */
async function openCreateActionModal() {
    if (!State.isConnected) return showToast("Connect wallet first.", "error");
    if (!State.ecosystemManagerContract || !State.actionsManagerContract) {
        return showToast("Contracts not loaded. Please wait.", "error");
    }

    // 1. Torna a função async e mostra um loading
    openModal('<div class="text-center p-8"><div class="loader inline-block"></div> Loading requirements...</div>');

    try {
        // 2. Busca todos os dados dinâmicos do Hub/Contratos
        const [
            minStakeSports, 
            sportCreatorBips, 
            causeBips,
            [creationFee, createPStake]
        ] = await Promise.all([
            safeContractCall(State.actionsManagerContract, 'getMinCreatorStake', [], 0n),
            safeContractCall(State.ecosystemManagerContract, 'getFee', ["ACTION_SPORT_CREATOR_BIPS"], 0n), // 
            safeContractCall(State.ecosystemManagerContract, 'getFee', ["ACTION_CAUSE_BIPS"], 0n), // 
            safeContractCall(State.ecosystemManagerContract, 'getServiceRequirements', ["ACTION_CREATE_SERVICE"], [0n, 0n]) // [cite: 78, 337]
        ]);
        
        // 3. Formata os valores para exibição
        const minStakeSportsFormatted = formatBigNumber(minStakeSports, 18).toPrecision(8);
        const sportCreatorPercent = (Number(sportCreatorBips) / 100).toFixed(2); // BIPS para %
        const causePercent = (Number(causeBips) / 100).toFixed(2); // BIPS para %

        const userPStake = State.userTotalPStake || 0n;
        const meetsPStake = userPStake >= createPStake;

        let pStakeHTML = '';
        if (createPStake > 0n) {
            pStakeHTML = `
                <div class="flex justify-between items-center text-sm p-3 bg-zinc-800 rounded-lg border ${meetsPStake ? 'border-border-color' : 'border-red-500/50'}">
                    <span class="text-zinc-400">Min. pStake to Create:</span>
                    <span class="font-bold ${meetsPStake ? 'text-green-400' : 'text-red-400'}">
                        ${formatPStake(userPStake)} / ${formatPStake(createPStake)}
                    </span>
                </div>`;
        }
        
        let feeHTML = '';
        if (creationFee > 0n) {
             feeHTML = `<p class="text-xs text-zinc-400 text-center">A base creation fee of <strong class="text-amber-400">${formatBigNumber(creationFee)} $BKC</strong> will be added. Discounts apply.</p>`;
        }

        // 4. Monta o HTML do modal com os valores dinâmicos
        const content = `
            <h3 class="text-xl font-bold mb-4 text-amber-400">Create New Action</h3>
            <div class="space-y-4">
                ${pStakeHTML}
                <div>
                    <label for="actionType" class="block text-sm font-medium text-zinc-400 mb-2">Action Type</label>
                    <select id="actionType" class="form-input">
                        <option value="0">Sports Action (Lottery Draw)</option>
                        <option value="1">Charity Action (Fundraiser)</option>
                    </select>
                </div>
                
                <div id="sports-info" class="p-3 bg-zinc-800 border border-border-color rounded-lg text-sm space-y-2">
                    <p>A stake of <strong class="text-amber-400">${minStakeSportsFormatted} $BKC</strong> will be automatically transferred.</p>
                    <p class="text-xs text-green-400/80"><i class="fa-solid fa-star mr-1"></i>You will receive ${sportCreatorPercent}% of the total pot as a creator's reward.</p>
                </div>

                <div id="charity-fields" class="hidden space-y-4">
                    <div class="p-3 bg-zinc-800 border border-border-color rounded-lg text-sm text-green-400/80">
                        <i class="fa-solid fa-star mr-1"></i>As the beneficiary, you will receive ${causePercent}% of the total pot. Your stake is returned upon finalization.
                    </div>
                    <div>
                        <label for="charityStake" class="block text-sm font-medium text-zinc-400 mb-2">Your Stake ($BKC)</label>
                        <input type="number" id="charityStake" class="form-input" placeholder="e.g., 100">
                    </div>
                    <div>
                        <label for="publicityLink" class="block text-sm font-medium text-zinc-400 mb-2">Publicity Link (Optional)</label>
                        <input type="url" id="publicityLink" class="form-input" placeholder="https://youtube.com/your-channel">
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-zinc-400 mb-2">Short Description</label>
                        <textarea id="description" class="form-input" rows="3" placeholder="Explain the cause you are supporting..."></textarea>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-zinc-400 mb-2">Duration: <span id="durationLabel" class="font-bold text-amber-400">30 Days</span></label>
                    <div class="flex gap-2 mb-3">
                        <button class="text-xs px-3 py-1 rounded-md bg-amber-500 text-zinc-900 duration-btn" data-days="30">30 Days</button>
                        <button class="text-xs px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 duration-btn" data-days="180">6 Months</button>
                        <button class="text-xs px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 duration-btn" data-days="custom">Custom</button>
                    </div>
                    <input type="number" id="durationDays" class="form-input hidden" value="30" min="1">
                </div>
                
                ${feeHTML}

                <div class="flex gap-3">
                    <button id="confirmCreateActionBtn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex-1" ${!meetsPStake ? 'disabled' : ''}>
                         ${meetsPStake ? 'Create Action' : 'Insufficient pStake'}
                    </button>
                    <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-md transition-colors closeModalBtn">Cancel</button>
                </div>
            </div>
        `;
        
        // 5. Injeta o HTML final no modal e anexa os listeners internos do modal
        const modalSlot = document.getElementById('modal-content-slot');
        if (modalSlot) modalSlot.innerHTML = content;

        // Anexa listeners específicos do modal
        const actionTypeSelect = document.getElementById('actionType');
        const charityFields = document.getElementById('charity-fields');
        const sportsInfo = document.getElementById('sports-info');
        const durationInput = document.getElementById('durationDays');
        const durationLabel = document.getElementById('durationLabel');
        const durationBtns = document.querySelectorAll('.duration-btn');

        actionTypeSelect.addEventListener('change', () => {
            const isCharity = actionTypeSelect.value === '1';
            charityFields.style.display = isCharity ? 'block' : 'none';
            sportsInfo.style.display = isCharity ? 'none' : 'block';
        });

        durationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                durationBtns.forEach(b => {
                    b.classList.remove('bg-amber-500', 'text-zinc-900');
                    b.classList.add('bg-zinc-700');
                });
                e.target.classList.add('bg-amber-500', 'text-zinc-900');
                e.target.classList.remove('bg-zinc-700');
                const days = e.target.dataset.days;
                if (days === 'custom') {
                    durationInput.classList.remove('hidden');
                    durationInput.focus();
                    durationLabel.textContent = `${durationInput.value || 1} Days (Custom)`;
                } else {
                    durationInput.classList.add('hidden');
                    durationInput.value = days;
                    durationLabel.textContent = `${days} Days`;
                }
            });
        });
        durationInput.addEventListener('input', () => {
            durationLabel.textContent = `${durationInput.value || 1} Days (Custom)`;
        });

    } catch (e) {
        console.error("Failed to load action creation data:", e);
        showToast("Error loading creation data. Please try again.", "error");
        closeModal();
    }
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 3 =========================
 * ==================================================================
 */


/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 4 =======================
 * ==================================================================
 * Nova função para abrir o modal de participação.
 * Busca os requisitos (taxa/pStake) do Hub.
 */
async function openParticipateModal(actionId, actionType) {
    if (!State.isConnected) return showToast("Connect wallet first.", "error");
    if (!State.ecosystemManagerContract) return showToast("Hub contract not loaded.", "error");

    openModal('<div class="text-center p-8"><div class="loader inline-block"></div> Loading requirements...</div>');

    try {
        // 1. Busca os requisitos de participação no Hub [cite: 100, 337]
        const [partFee, pStakeReq] = await safeContractCall(
            State.ecosystemManagerContract, 
            'getServiceRequirements', 
            ["ACTION_PARTICIPATE_SERVICE"], 
            [0n, 0n]
        );

        const userPStake = State.userTotalPStake || 0n;
        const meetsPStake = userPStake >= pStakeReq;

        let pStakeHTML = '';
        if (pStakeReq > 0n) {
            pStakeHTML = `
                <div class="flex justify-between items-center text-sm p-3 bg-zinc-800 rounded-lg border ${meetsPStake ? 'border-border-color' : 'border-red-500/50'}">
                    <span class="text-zinc-400">Min. pStake to Participate:</span>
                    <span class="font-bold ${meetsPStake ? 'text-green-400' : 'text-red-400'}">
                        ${formatPStake(userPStake)} / ${formatPStake(pStakeReq)}
                    </span>
                </div>`;
        }
        
        let feeHTML = '';
        if (partFee > 0n) {
             feeHTML = `<p class="text-xs text-zinc-400 text-center">A base participation fee of <strong class="text-amber-400">${formatBigNumber(partFee)} $BKC</strong> will be added. Discounts apply.</p>`;
        }
        
        const title = actionType === 0 ? `Participate in Action #${actionId}` : `Donate to Action #${actionId}`;
        const label = actionType === 0 ? `Amount to Participate ($BKC)` : `Amount to Donate ($BKC)`;
        const buttonText = actionType === 0 ? `Participate` : `Donate`;

        // 2. Monta o HTML do modal
        const content = `
            <h3 class="text-xl font-bold mb-4">${title}</h3>
            <div class="space-y-4">
                ${pStakeHTML}
                <div>
                    <label for="participateAmount" class="block text-sm font-medium text-zinc-400 mb-2">${label}</label>
                    <input type="number" id="participateAmount" class="form-input" placeholder="e.g., 50">
                </div>
                ${feeHTML}
                <div class="flex gap-3">
                    <button id="confirmParticipateBtn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex-1" ${!meetsPStake ? 'disabled' : ''}>
                        ${meetsPStake ? buttonText : 'Insufficient pStake'}
                    </button>
                    <button class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-md transition-colors closeModalBtn">Cancel</button>
                </div>
            </div>
        `;
        
        // 3. Injeta o HTML e anexa o listener
        document.getElementById('modal-content-slot').innerHTML = content;

        document.getElementById('confirmParticipateBtn').addEventListener('click', async (e) => {
            const amount = document.getElementById('participateAmount').value;
            if (!amount || parseFloat(amount) <= 0) {
                return showToast("Please enter a valid amount.", "error");
            }
            // Pega o boosterId do estado global
            const boosterId = State.userBoosterId || 0n;
            await executeParticipate(actionId, amount, boosterId, e.target);
        });

    } catch (e) {
        console.error("Failed to open participate modal:", e);
        showToast("Error loading participation data.", "error");
        closeModal();
    }
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 4 =========================
 * ==================================================================
 */


/**
 * ==================================================================
 * ======================= INÍCIO DA CORREÇÃO 5 =======================
 * ==================================================================
 * Listeners da página atualizados para:
 * 1. Chamar o 'openCreateActionModal' (que agora é async).
 * 2. Passar o 'boosterId' para 'executeCreateAction'.
 * 3. Chamar o novo 'openParticipateModal' em vez de um toast.
 */
function setupActionsPageListeners() {
    const actionsContainer = document.getElementById('actions');
    // Evita anexar listeners múltiplos
    if (actionsContainer._listenersInitialized) return;
    actionsContainer._listenersInitialized = true;

    // Usa delegação de eventos para 'ouvir' cliques em botões
    // que podem ainda não existir (ex: dentro de modais ou cards)
    actionsContainer.addEventListener('click', async (e) => {
        // Encontra o botão mais próximo que foi clicado
        const target = e.target.closest('button');
        if (!target) return;
        
        // Previne comportamento padrão se for um botão relevante
        if (target.id === 'openCreateActionModalBtn' || target.id === 'confirmCreateActionBtn' || target.classList.contains('action-finalize-btn') || target.classList.contains('action-share-btn') || target.classList.contains('action-participate-btn')) {
            e.preventDefault();
        }

        // --- Roteamento de Cliques ---

        // 1. Botão Principal "Create New Action"
        if (target.id === 'openCreateActionModalBtn') {
            await openCreateActionModal(); // MUDANÇA: agora é 'await'
        } 
        
        // 2. Botão de Confirmação "Create Action" (Dentro do Modal)
        else if (target.id === 'confirmCreateActionBtn') {
            const durationDays = parseInt(document.getElementById('durationDays').value);
            const actionType = parseInt(document.getElementById('actionType').value);
            const charityStake = document.getElementById('charityStake').value;
            let description = document.getElementById('description').value || 'Sports Action';
            
            if (actionType === 1) { // Charity
                const publicityLink = document.getElementById('publicityLink').value;
                description = document.getElementById('description').value || 'Charity Action';
                if(publicityLink) description += ` [Link: ${publicityLink}]`;
            }

            // MUDANÇA: Pega o boosterId do estado global
            const boosterId = State.userBoosterId || 0n;
            
            await executeCreateAction(
                durationDays * 86400, // Converte dias para segundos
                actionType, 
                charityStake, 
                description, 
                boosterId, // <-- NOVO PARÂMETRO
                target
            );
        }
        
        // 3. Botão "Participate" ou "Donate" (Nos Cards)
        else if (target.classList.contains('action-participate-btn')) {
            // MUDANÇA: Chama o novo modal em vez de um toast
            const actionId = parseInt(target.dataset.id);
            const actionType = parseInt(target.dataset.type);
            await openParticipateModal(actionId, actionType);
        }
        
        // 4. Botão "Finalize Action" (Nos Cards)
        else if (target.classList.contains('action-finalize-btn')) {
            await executeFinalizeAction(parseInt(target.dataset.id), target);
        }
        
        // 5. Botão "Share" (Nos Cards)
        else if (target.classList.contains('action-share-btn')) {
            const actionId = target.dataset.id;
            const url = `${window.location.origin}${window.location.pathname}?page=actions&id=${actionId}`;
            try {
                await navigator.clipboard.writeText(url);
                showToast('Share link copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy link: ', err);
                showToast('Failed to copy link.', 'error');
            }
        }
    });
}
/**
 * ==================================================================
 * ======================== FIM DA CORREÇÃO 5 =========================
 * ==================================================================
 */


export const ActionsPage = {
    async render(isUpdate = false, filter = currentFilter) {
        currentFilter = filter;
        const container = document.getElementById('actions');
        
        if (!isUpdate || !document.getElementById('actions-tabs')) {
            container.innerHTML = `
                <h1 class="text-2xl md:text-3xl font-bold mb-6">Decentralized Actions</h1>
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 bg-sidebar border border-border-color rounded-xl mb-6 gap-4">
                    <div id="actions-tabs" class="-mb-px flex gap-4 border-b border-border-color/50 pt-1">
                        <button class="tab-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                        <button class="tab-btn ${filter === '0' ? 'active' : ''}" data-filter="0">Sports</button>
                        <button class="tab-btn ${filter === '1' ? 'active' : ''}" data-filter="1">Charity</button>
                    </div>
                    <button id="openCreateActionModalBtn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-lg">
                        <i class="fa-solid fa-plus mr-2"></i>Create New Action
                    </button>
                </div>
                <div id="actions-list-container"></div>`;
            container._listenersInitialized = false; // Reseta flag de listeners ao recarregar
            // showIntroModal(); // Descomente se quiser o modal de introdução
        }
        
        const listContainer = document.getElementById('actions-list-container');
        if (!State.isConnected) {
             renderNoData(listContainer, 'Connect your wallet to view and manage decentralized actions.');
             // Remove listeners se o usuário desconectar
             container._listenersInitialized = true; // Previne re-anexação
             return;
        }

        renderLoading(listContainer);
        const allActions = await loadAllActions();
        let filteredActions = allActions;
        if (filter !== 'all') {
            filteredActions = allActions.filter(action => action.actionType === parseInt(filter));
        }
        // Ordena por ID (mais recente primeiro)
        filteredActions.sort((a, b) => b.id - a.id);

        if (filteredActions.length === 0) {
            renderNoData(listContainer, `No ${filter === 'all' ? '' : ACTION_TYPES[parseInt(filter)]} actions found.`);
        } else {
            const onPageChange = (newPage) => { actionsCurrentPage = newPage; ActionsPage.render(true, filter); };
            renderPaginatedList(filteredActions, listContainer, getActionCardHTML, 6, actionsCurrentPage, onPageChange, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6');
        }
        
        // MUDANÇA: Listeners agora são anexados (ou re-anexados se necessário)
        setupActionsPageListeners();
        
        // Listener para as abas de filtro
        document.getElementById('actions-tabs')?.addEventListener('click', (e) => {
             if (e.target.classList.contains('tab-btn')) {
                 const newFilter = e.target.dataset.filter;
                 if (newFilter !== currentFilter) {
                     actionsCurrentPage = 1; // Reseta a paginação ao mudar de filtro
                     ActionsPage.render(true, newFilter);
                 }
             }
        });
    }
};