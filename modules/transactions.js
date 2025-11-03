// modules/transactions.js

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, FAUCET_AMOUNT_WEI } from '../config.js';
import { formatBigNumber } from '../utils.js';
// --- CORREÇÃO: Importar getHighestBoosterBoost ---
import { loadUserData, getHighestBoosterBoost, safeContractCall } from './data.js';

// --- Constantes de Tolerância ---
const APPROVAL_TOLERANCE_BIPS = 100; // 1% em BIPS
const BIPS_DENOMINATOR = 10000;

// Transação Genérica de Wrapper
async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    if (!btnElement) {
        console.warn("Transaction executed without a button element for feedback.");
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...'; // Melhor feedback
    }

    try {
        const tx = await txPromise;
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Awaiting Confirmation...'; // Melhor feedback
        showToast('Submitting transaction...', 'info');
        const receipt = await tx.wait();
        showToast(successMessage, 'success', receipt.hash);

        // Atualiza os dados do usuário após uma transação de sucesso
        // Usar um pequeno delay para dar tempo da blockchain atualizar o balance
        setTimeout(loadUserData, 1500); // <-- Adicionado delay

        return true;
    } catch (e) {
        console.error("Transaction Error:", e); // Log completo do erro
        let reason = 'Transaction rejected or failed.'; // Mensagem padrão

        // Tenta extrair a mensagem de erro específica
        if (e.reason) {
            reason = e.reason;
        } else if (e.data && e.data.message) { // Erros de provedor (ex: MetaMask)
             reason = e.data.message;
        } else if (e.message) {
             reason = e.message;
        }

        // Mensagens específicas do Faucet (do novo contrato)
        if (reason.includes("Faucet: Address has already claimed")) {
            reason = "You have already claimed tokens from this faucet.";
        }
        if (reason.includes("Faucet: Insufficient funds")) {
            reason = "Faucet is empty! Please contact an admin.";
        }
        // Mensagens específicas do Notary
        if (reason.includes("Notary: Insufficient pStake")) {
             reason = "You don't meet the minimum pStake requirement.";
        }
         if (reason.includes("Notary: Insufficient BKC balance for fee")) {
             reason = "Insufficient $BKC balance for the notary fee.";
        }
        // Mensagens de erro comuns do Ethers
        if (e.code === 'ACTION_REJECTED') reason = 'Transaction rejected by user.';
        if (e.code === 'INSUFFICIENT_FUNDS') reason = 'Insufficient ETH for gas fees.';


        showToast(`${failMessage}: ${reason}`, "error");
        return false;
    } finally {
        if(btnElement) {
            // Pequeno delay antes de reativar o botão em caso de falha,
            // para o usuário ler o toast de erro.
            setTimeout(() => {
                if (btnElement) { // Verifica se ainda existe
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
            }, 1000);
        }
    }
}


// --- Funções Auxiliares para Aprovação ---
async function ensureApproval(spenderAddress, requiredAmount, btnElement, purpose) {
    if (!State.signer) return false;

    // Calcula o valor com tolerância (para evitar falhas por pequenas flutuações)
    const toleratedAmount = (requiredAmount * BigInt(BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BigInt(BIPS_DENOMINATOR);

    const originalText = btnElement ? btnElement.innerHTML : null; // Pega o texto original ANTES de qualquer loader
    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };
    const resetBtn = () => {
         if(btnElement && originalText) {
             btnElement.innerHTML = originalText;
             // A re-habilitação depende do contexto, então não forçamos here
         }
    };

    try {
        setBtnLoading("Checking allowance"); // Feedback imediato
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, spenderAddress);

        if (allowance < toleratedAmount) {
            showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
            setBtnLoading("Approving"); // Atualiza texto

            const approveTx = await State.bkcTokenContract.approve(spenderAddress, toleratedAmount);
            await approveTx.wait();
            showToast('Approval successful!', "success");
        }
        return true; // Retorna true se já tinha ou se aprovou com sucesso
    } catch (e) {
        console.error("Approval Error:", e);
        showToast(`Approval Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        resetBtn(); // Restaura o botão em caso de erro na aprovação
        return false;
    }
    // Não precisa de finally here, o reset é feito no catch
}


// --- DELEGAÇÃO / UNSTAKE ---
export async function executeDelegation(validatorAddr, totalAmount, durationSeconds, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const approved = await ensureApproval(addresses.delegationManager, totalAmount, btnElement, "Delegation");
    if (!approved) return false;
    const delegateTxPromise = State.delegationManagerContract.delegate(validatorAddr, totalAmount, BigInt(durationSeconds));
    const success = await executeTransaction(delegateTxPromise, 'Delegation successful!', 'Error delegating tokens', btnElement);
    if (success) closeModal();
    return success;
}
export async function executeUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const btnElement = document.querySelector(`.unstake-btn[data-index='${index}']`)
    const unstakeTxPromise = State.delegationManagerContract.unstake(index);
    return await executeTransaction(
        unstakeTxPromise,
        'Unstake successful!',
        'Error unstaking tokens',
        btnElement
    );
}

// ====================================================================
//  AJUSTE 1: executeForceUnstake
// ====================================================================
export async function executeForceUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    // --- CORREÇÃO: Obter o ID do booster para o desconto de penalidade ---
    const { tokenId: boosterTokenId } = await getHighestBoosterBoost();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    // --- FIM DA CORREÇÃO ---
    
    // O 'confirm' deve ser movido para o event listener da UI, mas mantemos a lógica
    if (!confirm("Are you sure? This action will incur a penalty (which may be reduced by your Booster NFT).")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`)
    
    // Passa o boosterIdToSend como segundo argumento
    const forceUnstakeTxPromise = State.delegationManagerContract.forceUnstake(index, boosterIdToSend); 
    
    return await executeTransaction(
        forceUnstakeTxPromise,
        'Force unstake successful!',
        'Error performing force unstake',
        btnElement
    );
}
// ====================================================================


// --- VALIDADOR ---
export async function payValidatorFee(feeAmount, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const approved = await ensureApproval(addresses.delegationManager, feeAmount, btnElement, "Validator Fee");
    if (!approved) return false;
    const payTxPromise = State.delegationManagerContract.payRegistrationFee();
    return await executeTransaction(payTxPromise, 'Fee paid successfully!', 'Error paying validator fee', btnElement);
}
export async function registerValidator(stakeAmount, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const approved = await ensureApproval(addresses.delegationManager, stakeAmount, btnElement, "Validator Stake");
    if (!approved) return false;
    const registerTxPromise = State.delegationManagerContract.registerValidator(State.userAddress);
    return await executeTransaction(registerTxPromise, 'Validator registered!', 'Error registering validator', btnElement);
}


// --- POP MINING / CERTIFICADOS ---
export async function createVestingCertificate(recipientAddress, amount, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    if (!ethers.isAddress(recipientAddress)) return showToast('Invalid beneficiary address.', 'error');
    if (amount <= 0n) return showToast('Invalid amount.', 'error');
    if (amount > State.currentUserBalance) return showToast("Insufficient $BKC balance.", "error");
    const approved = await ensureApproval(addresses.rewardManager, amount, btnElement, "PoP Mining Purchase");
    if (!approved) return false;
    const createTxPromise = State.rewardManagerContract.createVestingCertificate(recipientAddress, amount);
    const success = await executeTransaction(createTxPromise, 'PoP Mining completed successfully!', 'Error executing PoP Mining', btnElement);
    if (success) {
        // Limpa inputs apenas se a transação for bem-sucedida
        const recipientInput = document.getElementById('recipientAddressInput');
        const amountInput = document.getElementById('certificateAmountInput');
        if(recipientInput) recipientInput.value = '';
        if(amountInput) amountInput.value = '';
    }
    return success;
}

// ====================================================================
//  AJUSTE 2: executeWithdraw
// ====================================================================
export async function executeWithdraw(tokenId, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    // --- CORREÇÃO: Obter o ID do booster para o desconto de penalidade ---
    const { tokenId: boosterTokenId } = await getHighestBoosterBoost();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    // --- FIM DA CORREÇÃO ---

    // Passa o boosterIdToSend como segundo argumento
    const withdrawTxPromise = State.rewardManagerContract.withdraw(tokenId, boosterIdToSend); 
    
    return await executeTransaction(withdrawTxPromise, 'Withdrawal successful!', 'Error during withdrawal', btnElement);
}
// ====================================================================


// --- CLAIM DE RECOMPENSAS ---
export async function executeUniversalClaim(stakingRewards, minerRewards, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    if (stakingRewards === 0n && minerRewards === 0n) {
        showToast("No rewards to claim.", "info");
        return false;
    }
    const originalText = btnElement ? btnElement.innerHTML : 'Claiming...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div> Claiming...';
    }
    try {
        let txHashes = [];
        if (stakingRewards > 0n) {
            showToast("Claiming staking rewards...", "info");
            const tx = await State.delegationManagerContract.claimDelegatorReward();
            const receipt = await tx.wait();
            txHashes.push(receipt.hash);
        }
        if (minerRewards > 0n) {
            showToast("Claiming PoP Mining rewards...", "info");
            const tx = await State.rewardManagerContract.claimMinerRewards();
            const receipt = await tx.wait();
            txHashes.push(receipt.hash);
        }
        const successMessage = txHashes.length > 1 ? 'All rewards claimed successfully!' : 'Reward claimed successfully!';
        showToast(successMessage, "success", txHashes[0] || null);
        loadUserData(); // Atualiza dados após claim
        return true;
    } catch (e) {
        console.error("Error during universal claim:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
        if(btnElement) {
            // Reativa o botão após a conclusão (sucesso ou falha)
             setTimeout(() => {
                if(btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
             }, 1000); // Pequeno delay
        }
    }
}

// --- BOOSTER STORE ---

// ====================================================================
//  AJUSTE 3: executeBuyBooster
// ====================================================================
export async function executeBuyBooster(boostBips, price, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }
    try {
        showToast("Finding an available NFT in the pool...", "info");
        
        // --- Lógica de placeholder original (problemática, mas mantida) ---
         let availableTokenId = null;
         const poolInfo = await safeContractCall(State.nftBondingCurveContract, 'pools', [boostBips], {nftCount: 0});
         if(poolInfo.nftCount > 0) {
             console.warn("Using placeholder logic (ID 0) for tokenId selection in buyBooster.");
             availableTokenId = 0n; // Placeholder 
         } else {
             throw new Error("No NFTs available in this pool.");
         }
        // --- FIM LÓGICA PLACEHOLDER ---

        const priceWei = BigInt(price); // Preço já vem como BigInt da StorePage
        const approved = await ensureApproval(addresses.nftBondingCurve, priceWei, btnElement, "NFT Purchase");
        if (!approved) return false; // Sai se a aprovação falhar

        // Se a aprovação foi ok, atualiza o botão para "Buying"
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        // --- CORREÇÃO: Obter o ID do booster para a verificação de pStake ---
        const { tokenId: boosterTokenId } = await getHighestBoosterBoost();
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
        // --- FIM DA CORREÇÃO ---

        showToast("Submitting buy transaction...", "info");

        // A função buyNFT (Contrato V3) espera 3 argumentos [boostBips, tokenId, boosterTokenId]
        const buyTxPromise = State.nftBondingCurveContract.buyNFT(
            boostBips, 
            availableTokenId, // <-- Este é o placeholder da lógica original
            boosterIdToSend   // <-- Este é o 3º argumento que faltava
        ); 

        const success = await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

        if (success) {
            console.log("Purchase successful. Add-to-wallet requires event listening implementation.");
        }
        return success;
    } catch (e) {
        console.error("Error buying booster:", e);
        showToast(`Error: ${e.message || 'Transaction rejected.'}`, "error");
        return false; // Retorna false em caso de erro
    } finally {
        // Garante que o botão seja restaurado no final, independentemente do resultado
         if(btnElement) {
             // Pequeno delay antes de reativar
             setTimeout(() => {
                 if(btnElement) {
                     btnElement.disabled = false;
                     btnElement.innerHTML = originalText;
                 }
             }, 1000);
         }
    }
}
// ====================================================================

// ====================================================================
//  AJUSTE 4: executeSellBooster
// ====================================================================
export async function executeSellBooster(tokenId, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';

    // Garante que tokenId é um BigInt ou número válido
    let tokenIdBigInt;
    try {
        tokenIdBigInt = BigInt(tokenId);
    } catch {
        showToast("Invalid Token ID provided.", "error");
        return false;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        // 1. Aprovar o contrato do Pool para transferir o NFT
        showToast(`Approving transfer of NFT #${tokenId}...`, "info");
        const approveTx = await State.rewardBoosterContract.approve(addresses.nftBondingCurve, tokenIdBigInt);
        await approveTx.wait();
        showToast("NFT approved successfully!", "success");

        // 2. Chamar a função de venda no Pool
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        showToast("Submitting sell transaction...", "info");

        // --- CORREÇÃO: Obter o ID do booster para pStake e desconto de taxa ---
        // Nota: O usuário pode querer usar um booster diferente do que está vendendo.
        // Usar o 'highest' é a melhor lógica padrão.
        const { tokenId: boosterTokenId } = await getHighestBoosterBoost();
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
        // --- FIM DA CORREÇÃO ---

        // Passa o boosterIdToSend como segundo argumento
        const sellTxPromise = State.nftBondingCurveContract.sellNFT(tokenIdBigInt, boosterIdToSend);

        // Usa o wrapper executeTransaction
        const success = await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);
        return success; // Retorna true ou false

    } catch (e) {
        console.error("Error selling booster:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false; // Retorna false em caso de erro
    } finally {
        // Garante que o botão seja restaurado no final
        if(btnElement) {
             setTimeout(() => {
                 if(btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                 }
             }, 1000);
        }
    }
}
// ====================================================================


// --- FAUCET CLAIM ---
export async function executeFaucetClaim(btnElement) {
    if (!State.signer || !State.faucetContract) {
        showToast("Wallet not connected or Faucet not configured.", "error");
        return false;
    }
    const claimTxPromise = State.faucetContract.claim();
    const faucetAmount = formatBigNumber(FAUCET_AMOUNT_WEI);
    return await executeTransaction(
        claimTxPromise,
        `Successfully claimed ${faucetAmount} $BKC!`,
        'Error claiming tokens',
        btnElement
    );
}

// =A função executeNotarizeDocument já estava correta e foi mantida como estava =

/**
 * Executa a transação para notarizar um documento (V2 - Corrigido).
 * Esta versão busca a TAXA BASE do State (carregada pelo NotaryPage) para
 * aprovação, e passa o BOOSTER ID para o contrato.
 * @param {string} documentURI - O URI 'ipfs://...' do documento.
 * @param {BigInt} boosterId - O ID do Booster NFT do usuário (0n se não houver).
 * @param {HTMLElement} submitButton - O botão de submit para mostrar loading.
 * @returns {Promise<boolean>} - True se a transação for bem-sucedida.
 */
export async function executeNotarizeDocument(documentURI, boosterId, submitButton) {
    if (!State.signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Wallet not connected or contracts not loaded.", "error");
        return false;
    }

    // 1. Busca a Taxa Base (não descontada) que o NotaryPage.js carregou no State.
    // Esta é a taxa máxima que o usuário pode pagar.
    const baseFee = State.notaryFee; 
    if (typeof baseFee === 'undefined') {
        showToast("Notary base fee not loaded. Please refresh.", "error");
        return false;
    }

    // 2. Garantir Aprovação (Approval)
    // O usuário deve aprovar o contrato do Cartório para gastar a TAXA BASE.
    const notaryAddress = await State.decentralizedNotaryContract.getAddress();
    
    // Só precisa de aprovação se a taxa base for maior que zero
    if (baseFee > 0n) {
        const approved = await ensureApproval(notaryAddress, baseFee, submitButton, "Notary Fee");
        if (!approved) return false; // Sai se a aprovação falhar ou for rejeitada
    }

    // 3. Executar a Transação de Notarização
    // Passa os DOIS argumentos corretos para o contrato
    const notarizeTxPromise = State.decentralizedNotaryContract.notarizeDocument(
        documentURI, // 1º argumento: string
        boosterId    // 2º argumento: uint256
    );

    // Usa o wrapper executeTransaction para lidar com a transação e feedback
    const success = await executeTransaction(
        notarizeTxPromise,
        'Document notarized successfully!',
        'Error notarizing document',
        submitButton // Passa o botão para o wrapper
    );

    return success; // Retorna true ou false
}