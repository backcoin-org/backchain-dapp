// modules/transactions.js

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, FAUCET_AMOUNT_WEI } from '../config.js';
import { formatBigNumber } from '../utils.js';
// =================================================================
// --- IMPORT CORRECTION (Line 10) ---
import { loadUserData, getHighestBoosterBoostFromAPI, safeContractCall } from './data.js';
// =================================================================

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100; // 1% in BIPS
const BIPS_DENOMINATOR = 10000;

// Generic Transaction Wrapper (Maintained)
async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    if (!btnElement) {
        console.warn("Transaction executed without a button element for feedback.");
    }

    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...'; // Better feedback
    }

    try {
        const tx = await txPromise;
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Awaiting Confirmation...'; // Better feedback
        showToast('Submitting transaction...', 'info');
        const receipt = await tx.wait();
        showToast(successMessage, 'success', receipt.hash);

        // Reload user data after a successful transaction
        // Use a small delay to give the blockchain time to update the balance
        setTimeout(loadUserData, 1500); // <-- Added delay

        return true;
    } catch (e) {
        console.error("Transaction Error:", e); // Log full error
        let reason = 'Transaction rejected or failed.'; // Default message

        // Try to extract the specific error message
        if (e.reason) {
            reason = e.reason;
        } else if (e.data && e.data.message) { // Provider errors (ex: MetaMask)
             reason = e.data.message;
        } else if (e.message) {
             reason = e.message;
        }

        // Specific Faucet messages (from the new contract)
        if (reason.includes("Faucet: Address has already claimed")) {
            reason = "You have already claimed tokens from this faucet.";
        }
        if (reason.includes("Faucet: Insufficient funds")) {
            reason = "Faucet is empty! Please contact an admin.";
        }
        // Specific Notary messages
        if (reason.includes("Notary: Insufficient pStake")) {
             reason = "You don't meet the minimum pStake requirement.";
        }
         if (reason.includes("Notary: Insufficient BKC balance for fee")) {
             reason = "Insufficient $BKC balance for the notary fee.";
        }
        // Common Ethers error messages
        if (e.code === 'ACTION_REJECTED') reason = 'Transaction rejected by user.';
        if (e.code === 'INSUFFICIENT_FUNDS') reason = 'Insufficient ETH for gas fees.';


        showToast(`${failMessage}: ${reason}`, "error");
        return false;
    } finally {
        if(btnElement) {
            // Small delay before re-enabling the button on failure,
            // so the user can read the error toast.
            setTimeout(() => {
                if (btnElement) { // Check if it still exists
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
            }, 1000);
        }
    }
}


// --- Approval Helper Functions (Maintained) ---
async function ensureApproval(spenderAddress, requiredAmount, btnElement, purpose) {
    if (!State.signer) return false;

    // Calculate amount with tolerance (to avoid failures from small fluctuations)
    const toleratedAmount = (requiredAmount * BigInt(BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BigInt(BIPS_DENOMINATOR);

    const originalText = btnElement ? btnElement.innerHTML : null; // Get original text BEFORE any loader
    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };
    const resetBtn = () => {
         if(btnElement && originalText) {
             btnElement.innerHTML = originalText;
             // Re-enabling depends on context, so not forced here
         }
    };

    try {
        setBtnLoading("Checking allowance"); // Immediate feedback
        const allowance = await State.bkcTokenContract.allowance(State.userAddress, spenderAddress);

        if (allowance < toleratedAmount) {
            showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
            setBtnLoading("Approving"); // Update text

            const approveTx = await State.bkcTokenContract.approve(spenderAddress, toleratedAmount);
            await approveTx.wait();
            showToast('Approval successful!', "success");
        }
        return true; // Returns true if it already had it or if approved successfully
    } catch (e) {
        console.error("Approval Error:", e);
        showToast(`Approval Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        resetBtn(); // Restore button on approval error
        return false;
    }
    // No finally needed here, reset is done in catch
}


// --- DELEGATION / UNSTAKE (Maintained) ---
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
//  ADJUSTMENT 1: executeForceUnstake
// ====================================================================
export async function executeForceUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    // =================================================================
    // --- CORRECTION: Get booster ID for penalty discount ---
    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI(); // <-- FUNCTION NAME CORRECTED
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    // --- END CORRECTION ---
    
    // The 'confirm' should be moved to the UI event listener, but we keep the logic
    if (!confirm("Are you sure? This action will incur a penalty (which may be reduced by your Booster NFT).")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`)
    
    // Pass the boosterIdToSend as the second argument
    const forceUnstakeTxPromise = State.delegationManagerContract.forceUnstake(index, boosterIdToSend); 
    
    return await executeTransaction(
        forceUnstakeTxPromise,
        'Force unstake successful!',
        'Error performing force unstake',
        btnElement
    );
}
// ====================================================================


// --- VALIDATOR (Maintained) ---
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


// --- POP MINING / CERTIFICATES (Maintained) ---
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
        // Clear inputs only if the transaction is successful
        const recipientInput = document.getElementById('recipientAddressInput');
        const amountInput = document.getElementById('certificateAmountInput');
        if(recipientInput) recipientInput.value = '';
        if(amountInput) amountInput.value = '';
    }
    return success;
}

// ====================================================================
//  ADJUSTMENT 2: executeWithdraw
// ====================================================================
export async function executeWithdraw(tokenId, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    // =================================================================
    // --- CORRECTION: Get booster ID for penalty discount ---
    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI(); // <-- FUNCTION NAME CORRECTED
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    // --- END CORRECTION ---

    // Pass the boosterIdToSend as the second argument
    const withdrawTxPromise = State.rewardManagerContract.withdraw(tokenId, boosterIdToSend); 
    
    return await executeTransaction(withdrawTxPromise, 'Withdrawal successful!', 'Error during withdrawal', btnElement);
}
// ====================================================================


// --- REWARD CLAIMS (Maintained) ---
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
        loadUserData(); // Reload data after claim
        return true;
    } catch (e) {
        console.error("Error during universal claim:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
        if(btnElement) {
            // Re-enable button after completion (success or fail)
             setTimeout(() => {
                if(btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }
             }, 1000); // Small delay
        }
    }
}

// --- BOOSTER STORE ---

// ====================================================================
//  ADJUSTMENT 3: executeBuyBooster
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
        
        // --- Original placeholder logic (problematic, but maintained) ---
         let availableTokenId = null;
         const poolInfo = await safeContractCall(State.nftBondingCurveContract, 'pools', [boostBips], {nftCount: 0});
         if(poolInfo.nftCount > 0) {
             console.warn("Using placeholder logic (ID 0) for tokenId selection in buyBooster.");
             availableTokenId = 0n; // Placeholder 
         } else {
             throw new Error("No NFTs available in this pool.");
         }
        // --- END PLACEHOLDER LOGIC ---

        const priceWei = BigInt(price); // Price already comes as BigInt from StorePage
        const approved = await ensureApproval(addresses.nftBondingCurve, priceWei, btnElement, "NFT Purchase");
        if (!approved) return false; // Exits if approval fails

        // If approval was ok, update button to "Buying"
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        // =================================================================
        // --- CORRECTION: Get booster ID for pStake check ---
        const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI(); // <-- FUNCTION NAME CORRECTED
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
        // --- END CORRECTION ---

        showToast("Submitting buy transaction...", "info");

        // The buyNFT function (V3 Contract) expects 3 arguments [boostBips, tokenId, boosterTokenId]
        const buyTxPromise = State.nftBondingCurveContract.buyNFT(
            boostBips, 
            availableTokenId, // <-- This is the placeholder from original logic
            boosterIdToSend   // <-- This is the 3rd argument that was missing
        ); 

        const success = await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

        if (success) {
            console.log("Purchase successful. Add-to-wallet requires event listening implementation.");
        }
        return success;
    } catch (e) {
        console.error("Error buying booster:", e);
        showToast(`Error: ${e.message || 'Transaction rejected.'}`, "error");
        return false; // Return false on error
    } finally {
        // Ensure button is restored at the end, regardless of outcome
         if(btnElement) {
             // Small delay before re-enabling
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
//  ADJUSTMENT 4: executeSellBooster
// ====================================================================
export async function executeSellBooster(tokenId, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';

    // Ensure tokenId is a valid BigInt or number
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
        // 1. Approve the Pool contract to transfer the NFT
        showToast(`Approving transfer of NFT #${tokenId}...`, "info");
        const approveTx = await State.rewardBoosterContract.approve(addresses.nftBondingCurve, tokenIdBigInt);
        await approveTx.wait();
        showToast("NFT approved successfully!", "success");

        // 2. Call the sell function on the Pool
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';
        showToast("Submitting sell transaction...", "info");

        // =================================================================
        // --- CORRECTION: Get booster ID for pStake and fee discount ---
        // Note: The user might want to use a different booster than the one they are selling.
        // Using the 'highest' is the best default logic.
        const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI(); // <-- FUNCTION NAME CORRECTED
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
        // --- END CORRECTION ---

        // Pass the boosterIdToSend as the second argument
        const sellTxPromise = State.nftBondingCurveContract.sellNFT(tokenIdBigInt, boosterIdToSend);

        // Use the executeTransaction wrapper
        const success = await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);
        return success; // Returns true or false

    } catch (e) {
        console.error("Error selling booster:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false; // Return false on error
    } finally {
        // Ensure button is restored at the end
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


// --- FAUCET CLAIM (Maintained) ---
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

// ====================================================================
// ====================================================================
// --- NOTARY (ADJUSTED FOR DESCRIPTION) ---
// ====================================================================
// ====================================================================

/**
 * Executes the transaction to notarize a document.
 * This version fetches the BASE FEE from State (loaded by NotaryPage) for
 * approval, and passes the user's DESCRIPTION and BOOSTER ID to the contract.
 * @param {string} documentURI - The 'ipfs://...' URI of the document.
 * @param {string} description - The user-provided description (max 256 chars).
 * @param {BigInt} boosterId - The user's Booster NFT ID (0n if none).
 * @param {HTMLElement} submitButton - The submit button for loading feedback.
 * @returns {Promise<boolean>} - True if the transaction is successful.
 */
export async function executeNotarizeDocument(documentURI, description, boosterId, submitButton) {
    if (!State.signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Wallet not connected or contracts not loaded.", "error");
        return false;
    }

    // 1. Fetch the Base Fee (undiscounted) that NotaryPage.js loaded into State.
    // This is the maximum fee the user might pay.
    const baseFee = State.notaryFee; 
    if (typeof baseFee === 'undefined') {
        showToast("Notary base fee not loaded. Please refresh.", "error");
        return false;
    }

    // 2. Ensure Approval
    // The user must approve the Notary contract to spend the BASE FEE.
    const notaryAddress = await State.decentralizedNotaryContract.getAddress();
    
    // Only needs approval if the base fee is greater than zero
    if (baseFee > 0n) {
        const approved = await ensureApproval(notaryAddress, baseFee, submitButton, "Notary Fee");
        if (!approved) return false; // Exits if approval fails or is rejected
    }

    // 3. Execute the Notarization Transaction
    // Passes the THREE correct arguments to the contract
    const notarizeTxPromise = State.decentralizedNotaryContract.notarizeDocument(
        documentURI, // 1st argument: string
        description, // 2nd argument: string
        boosterId    // 3rd argument: uint256
    );

    // Use the executeTransaction wrapper to handle the transaction and feedback
    const success = await executeTransaction(
        notarizeTxPromise,
        'Document notarized successfully!',
        'Error notarizing document',
        submitButton // Pass the button to the wrapper
    );

    return success; // Returns true or false
}