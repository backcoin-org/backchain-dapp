// modules/transactions.js

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
// [CORRIGIDO] Importa 'addresses' do config.js (que deve carregar o deployment-addresses.json)
// (REFA) Importa o nftPoolABI para criar instâncias de contrato
import { addresses, FAUCET_AMOUNT_WEI, nftPoolABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, safeContractCall } from './data.js';

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100; // 1% in BIPS
const BIPS_DENOMINATOR = 10000;

/**
 * Generic wrapper to execute a transaction and provide UI feedback.
 * @param {Promise} txPromise - The promise returned by the contract function call.
 * @param {string} successMessage - Message to show on success.
 * @param {string} failMessage - Message to show on failure.
 * @param {HTMLElement} btnElement - The button element to show loading/disabled states.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    if (!btnElement) {
        console.warn("Transaction executed without a button element for feedback.");
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
    }

    try {
        const tx = await txPromise;
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Awaiting Confirmation...';
        showToast('Submitting transaction...', 'info');
        
        const receipt = await tx.wait();
        showToast(successMessage, 'success', receipt.hash);

        // Reload user data after a successful transaction
        setTimeout(loadUserData, 1500); // Delay to allow state propagation

        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        let reason = 'Transaction rejected or failed.';

        // Extract detailed error reason
        if (e.reason) {
            reason = e.reason;
        } else if (e.data && e.data.message) {
             reason = e.data.message;
        } else if (e.message) {
             reason = e.message;
        }

        // Handle common error codes
        if (e.code === 'ACTION_REJECTED') reason = 'Transaction rejected by user.';
        if (e.code === 'INSUFFICIENT_FUNDS') reason = 'Insufficient ETH for gas fees.';

        // Handle contract-specific reverts
        if (reason.includes("Notary: Insufficient pStake")) {
             reason = "You don't meet the minimum pStake requirement.";
        }
        if (reason.includes("Ecosystem: Insufficient pStake")) {
             reason = "Insufficient pStake for this service. Delegate more BKC.";
        }
        if (reason.includes("Fee transfer failed or insufficient allowance")) {
             reason = "Insufficient BKC allowance or balance to pay the fee.";
        }
        // [NOVO] Erro comum de Pool Sold Out
        if (reason.includes("ERC721: approve caller is not owner nor approved for all") || reason.includes("ERC721: owner query for nonexistent token")) {
             reason = "NFT not found or approval failed. Ensure the Booster is in your wallet and not already approved.";
        }
        if (reason.includes("NP: No available NFTs to buy")) {
             reason = "Pool is currently sold out (no NFTs in reserve).";
        }


        showToast(`${failMessage}: ${reason}`, "error");
        return false;
    } finally {
        if(btnElement) {
            setTimeout(() => {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
            }, 1000);
        }
    }
}


/**
 * Ensures the user has approved a specific amount of BKC tokens for a spender.
 * @param {string} spenderAddress - The contract address to approve.
 * @param {BigInt} requiredAmount - The amount of tokens required.
 * @param {HTMLElement} btnElement - The button for UI feedback.
 * @param {string} purpose - A description for the toast message (e.g., "Delegation").
 * @returns {Promise<boolean>} - True if approval is met or successful, false otherwise.
 */
async function ensureApproval(spenderAddress, requiredAmount, btnElement, purpose) {
    if (!State.signer) return false;
    
    if (!spenderAddress || spenderAddress.includes('...')) {
        showToast(`Error: Invalid contract address for ${purpose}.`, "error");
        return false;
    }
    
    if (requiredAmount === 0n) return true;

    const toleratedAmount = (requiredAmount * BigInt(BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BigInt(BIPS_DENOMINATOR);

    const originalText = btnElement ? btnElement.innerHTML : null;
    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };
    const resetBtn = () => {
         if(btnElement && originalText) {
             btnElement.innerHTML = originalText;
         }
    };

    try {
        setBtnLoading("Checking allowance");
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, spenderAddress);

        if (allowance < toleratedAmount) {
            showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
            setBtnLoading("Approving");

            const approveTx = await State.bkcTokenContract.approve(spenderAddress, toleratedAmount);
            await approveTx.wait();
            showToast('Approval successful!', "success");
        }
        return true;
    } catch (e) {
        console.error("Approval Error:", e);
        showToast(`Approval Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        resetBtn();
        return false;
    }
}


// --- DELEGATION / UNSTAKE (Mantido) ---

export async function executeDelegation(validatorAddr, totalAmount, durationSeconds, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    
    const approved = await ensureApproval(addresses.delegationManager, totalAmount, btnElement, "Delegation");
    if (!approved) return false;
    
    const delegateTxPromise = State.delegationManagerContract.delegate(validatorAddr, totalAmount, BigInt(durationSeconds), boosterIdToSend);
    const success = await executeTransaction(delegateTxPromise, 'Delegation successful!', 'Error delegating tokens', btnElement);
    
    if (success) closeModal();
    return success;
}

export async function executeUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    
    const btnElement = document.querySelector(`.unstake-btn[data-index='${index}']`)
    const unstakeTxPromise = State.delegationManagerContract.unstake(index, boosterIdToSend);
    
    return await executeTransaction(
        unstakeTxPromise,
        'Unstake successful!',
        'Error unstaking tokens',
        btnElement
    );
}

export async function executeForceUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    
    if (!confirm("Are you sure? This action will incur a penalty (which may be reduced by your Booster NFT).")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`)
    
    const forceUnstakeTxPromise = State.delegationManagerContract.forceUnstake(index, boosterIdToSend); 
    
    return await executeTransaction(
        forceUnstakeTxPromise,
        'Force unstake successful!',
        'Error performing force unstake',
        btnElement
    );
}


// --- VALIDATOR (FLUXO UNIFICADO) (Mantido) ---

export async function registerValidator(validatorAddress, requiredFee, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const approved = await ensureApproval(addresses.delegationManager, requiredFee, btnElement, "Validator Registration Fee");
    if (!approved) return false;
    
    const registerTxPromise = State.delegationManagerContract.registerValidator(validatorAddress);
    
    return await executeTransaction(registerTxPromise, 'Validator registered!', 'Error registering validator', btnElement);
}


// --- POP MINING / CERTIFICATES (Mantido) ---

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
        const recipientInput = document.getElementById('recipientAddressInput');
        const amountInput = document.getElementById('certificateAmountInput');
        if(recipientInput) recipientInput.value = '';
        if(amountInput) amountInput.value = '';
    }
    return success;
}

export async function executeWithdraw(tokenId, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;

    const withdrawTxPromise = State.rewardManagerContract.withdraw(tokenId, boosterIdToSend); 
    
    return await executeTransaction(withdrawTxPromise, 'Withdrawal successful!', 'Error during withdrawal', btnElement);
}


// --- REWARD CLAIMS (Mantido) ---

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

        const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;

        if (stakingRewards > 0n) {
            showToast("Claiming staking rewards...", "info");
            const tx = await State.delegationManagerContract.claimDelegatorReward(boosterIdToSend);
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
        loadUserData(); // Reload data after claim
        return true;
    } catch (e) {
        console.error("Error during universal claim:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
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


// ####################################################################
// ###               BOOSTER STORE (FACTORY) CORRECTIONS            ###
// ####################################################################

/**
 * Executes the BUY of a Booster NFT (BKC -> NFT) via the Pool Clone.
 * @param {string} poolAddress - The specific address of the NFTLiquidityPool clone.
 * @param {BigInt} price - The required BKC price.
 * @param {BigInt} boosterTokenIdForPStake - Booster ID for pStake purposes (0n if none).
 * @param {HTMLElement} btnElement - The button element for feedback.
 */
export async function executeBuyBooster(poolAddress, price, boosterTokenIdForPStake, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    
    if (price <= 0n) {
        showToast("Price is zero or unavailable.", "error");
        return false;
    }
    if (price > State.currentUserBalance) {
         showToast("Insufficient BKC balance.", "error");
         return false;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }
    
    try {
        // 1. Aprova o POOL CLONE correto
        // Aprovação deve ser feita para o preço exato (com pequena folga)
        const approved = await ensureApproval(poolAddress, price, btnElement, "NFT Purchase");
        if (!approved) {
             if(btnElement) btnElement.innerHTML = originalText;
             return false;
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        // 2. Cria uma instância do contrato do pool com o signer
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.signer);

        const boosterIdToSend = boosterTokenIdForPStake ? BigInt(boosterTokenIdForPStake) : 0n;

        showToast("Submitting buy transaction...", "info");

        // 3. Chama buyNextAvailableNFT (o pool puxa o NFT do seu próprio estoque e o BKC do usuário)
        const buyTxPromise = poolContract.buyNextAvailableNFT(
            boosterIdToSend 
        );

        const success = await executeTransaction(buyTxPromise, 'Purchase successful! Check your wallet.', 'Error during purchase', btnElement);

        return success;
    } catch (e) {
        console.error("Error buying booster:", e);
        showToast(`Error: ${e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
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

/**
 * Executes the SELL of a Booster NFT (NFT -> BKC) via the Pool Clone.
 * @param {string} poolAddress - The specific address of the NFTLiquidityPool clone.
 * @param {BigInt} tokenIdToSell - The ID of the NFT the user is selling.
 * @param {BigInt} boosterTokenIdForDiscount - Booster ID for tax discount (0n if none).
 * @param {HTMLElement} btnElement - The button element for feedback.
 */
export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    
    if (!tokenIdToSell || tokenIdToSell <= 0n) {
        showToast("No NFT selected or Token ID is invalid.", "error");
        return false;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        // 1. Aprova o POOL CLONE correto para puxar o NFT
        showToast(`Approving transfer of NFT #${tokenIdToSell.toString()}...`, "info");
        
        // A aprovação deve ser feita para o ID específico (poolAddress é o Spender)
        const approveTx = await State.rewardBoosterContract.approve(
            poolAddress,
            tokenIdToSell 
        );
        
        await approveTx.wait();
        
        showToast("NFT approved successfully! Submitting sale...", "success");

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        showToast("Submitting sell transaction...", "info");

        const boosterIdToSend = boosterTokenIdForDiscount ? BigInt(boosterTokenIdForDiscount) : 0n;

        // 2. Cria uma instância do contrato do pool com o signer
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.signer);

        // 3. Chama sellNFT no pool clone correto
        const sellTxPromise = poolContract.sellNFT(
            tokenIdToSell,
            boosterIdToSend
        );

        const success = await executeTransaction(sellTxPromise, 'Sale successful! BKC received.', 'Error during sale', btnElement);
        return success;

    } catch (e) {
        console.error("Error selling booster:", e);
        showToast(`Error: ${e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
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

// ####################################################################
// ###               FIM DAS MODIFICAÇÕES - BOOSTER STORE            ###
// ####################################################################


// --- FAUCET CLAIM (Mantido) ---

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


// --- NOTARY (Mantido) ---

/**
 * Executes the transaction to notarize a document.
 * @param {string} documentURI - The 'ipfs://...' URI of the document metadata.
 * @param {BigInt} boosterId - The user's Booster NFT ID (0n if none).
 * @param {HTMLElement} submitButton - The submit button for loading feedback.
 * @returns {Promise<boolean>} - True if the transaction is successful.
 */
export async function executeNotarizeDocument(documentURI, boosterId, submitButton) {
    if (!State.signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Wallet not connected or contracts not loaded.", "error");
        return false;
    }

    // 1. Fetch the Base Fee (undiscounted)
    const baseFee = State.notaryFee; 
    if (typeof baseFee === 'undefined') {
        showToast("Notary base fee not loaded. Please refresh.", "error");
        return false;
    }

    // 2. Aprovação da taxa base (com folga) para o contrato Notary
    const notaryAddress = await State.decentralizedNotaryContract.getAddress();
    
    if (baseFee > 0n) {
        const approved = await ensureApproval(notaryAddress, baseFee, submitButton, "Notary Fee");
        if (!approved) return false;
    }

    // 3. Execute the Notarization
    const notarizeTxPromise = State.decentralizedNotaryContract.notarize(
        documentURI,
        boosterId
    );

    const success = await executeTransaction(
        notarizeTxPromise,
        'Document notarized successfully!',
        'Error notarizing document',
        submitButton
    );

    return success;
}