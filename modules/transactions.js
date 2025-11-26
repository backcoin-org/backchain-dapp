// js/modules/transactions.js
// ✅ VERSÃO FINAL DAPP: Transações Completas (Core + Rental Market + Utilitários)

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, FAUCET_AMOUNT_WEI, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js';

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100n; 
const BIPS_DENOMINATOR = 10000n; 

// ====================================================================
// GENERIC WRAPPERS & UTILITIES
// ====================================================================

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
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Confirming...';
        showToast('Submitting transaction...', 'info');
        
        const receipt = await tx.wait();
        showToast(successMessage, 'success', receipt.hash);

        // General data refresh sequence
        setTimeout(async () => {
            await loadUserData();
            await loadRentalListings(); // Specific refresh for rental market
        }, 1500); 

        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        let reason = 'Transaction rejected or failed.';

        if (e.reason) reason = e.reason;
        else if (e.data && e.data.message) reason = e.data.message;
        else if (e.message) reason = e.message;

        if (e.code === 'ACTION_REJECTED') reason = 'Transaction rejected by user.';
        if (e.code === 'INSUFFICIENT_FUNDS') reason = 'Insufficient ETH for gas fees.';

        // Custom error mapping for clearer feedback
        if (reason.includes("Notary: Insufficient pStake")) reason = "You don't meet the minimum pStake requirement.";
        if (reason.includes("Fee transfer failed") || reason.includes("insufficient allowance")) reason = "Insufficient BKC allowance or balance.";
        if (reason.includes("NP: No available NFTs")) reason = "Pool is currently sold out.";
        if (reason.includes("InsufficientPStake")) reason = "Your pStake is too low to rent NFTs.";

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
 * Ensures the user has approved a specific amount of BKC (ERC20) OR a specific NFT (ERC721).
 * Automatically detects type based on input.
 * @param {Object} tokenContract - The contract instance (BKC or BoosterNFT).
 * @param {string} spenderAddress - The contract address to approve.
 * @param {BigInt|number} amountOrTokenId - Amount (for ERC20) or TokenID (for ERC721).
 * @param {HTMLElement} btnElement - The button for UI feedback.
 * @param {string} purpose - A description for the toast message.
 * @returns {Promise<boolean>} - True if approval is met or successful, false otherwise.
 */
async function ensureApproval(tokenContract, spenderAddress, amountOrTokenId, btnElement, purpose) {
    if (!State.signer) return false;
    
    if (!spenderAddress || spenderAddress.includes('...')) {
        showToast(`Error: Invalid contract address for ${purpose}.`, "error");
        return false;
    }

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
             btnElement.disabled = false;
         }
    };

    try {
        // --- Logic for ERC20 (Amount is BigInt) ---
        if (typeof amountOrTokenId === 'bigint') {
            const requiredAmount = amountOrTokenId;
            if (requiredAmount === 0n) return true;
            
            setBtnLoading("Checking Allowance");
            const allowance = await tokenContract.allowance(State.userAddress, spenderAddress);

            // Add tolerance buffer
            const toleratedAmount = (requiredAmount * (BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BIPS_DENOMINATOR;

            if (allowance < toleratedAmount) {
                showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
                setBtnLoading("Approving");

                const approveTx = await tokenContract.approve(spenderAddress, toleratedAmount);
                await approveTx.wait();
                showToast('Approval successful!', "success");
            }
            return true;
        } 
        // --- Logic for ERC721 (TokenID is usually Number or BigInt acting as ID) ---
        else {
            const tokenId = BigInt(amountOrTokenId);
            setBtnLoading("Checking NFT Approval");
            
            // 1. Check specific approval
            const approvedAddr = await tokenContract.getApproved(tokenId);
            // 2. Check operator approval (setApprovalForAll)
            const isApprovedAll = await tokenContract.isApprovedForAll(State.userAddress, spenderAddress);
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT #${tokenId}...`, "info");
                setBtnLoading("Approving NFT");
                
                const approveTx = await tokenContract.approve(spenderAddress, tokenId);
                await approveTx.wait();
                showToast("NFT Approval successful!", "success");
            }
            return true;
        }

    } catch (e) {
        console.error("Approval Error:", e);
        showToast(`Approval Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        resetBtn();
        return false;
    }
}


// ====================================================================
// 1. RENTAL MARKET TRANSACTIONS (AirBNFT)
// ====================================================================

/**
 * Lists an NFT for rent (Hourly basis).
 */
export async function executeListNFT(tokenId, pricePerHourWei, maxDurationHours, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected or Config missing", "error");

    // 1. Approve RentalManager to take custody of the NFT
    const approved = await ensureApproval(
        State.rewardBoosterContract, 
        addresses.rentalManager, 
        tokenId, 
        btnElement, 
        "Listing NFT"
    );
    if (!approved) return false;

    // 2. Call listNFT
    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    
    // Ensure params are BigInt
    const txPromise = rentalContract.listNFT(BigInt(tokenId), BigInt(pricePerHourWei), BigInt(maxDurationHours));
    
    return await executeTransaction(
        txPromise,
        `NFT #${tokenId} listed successfully!`,
        "Error listing NFT",
        btnElement
    );
}

/**
 * Rents a listed NFT for X hours.
 */
export async function executeRentNFT(tokenId, hoursToRent, totalCostWei, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected", "error");

    // 1. Approve RentalManager to spend User's BKC
    const approved = await ensureApproval(
        State.bkcTokenContract, 
        addresses.rentalManager, 
        BigInt(totalCostWei), 
        btnElement, 
        "Rental Payment"
    );
    if (!approved) return false;

    // 2. Call rentNFT
    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    const txPromise = rentalContract.rentNFT(BigInt(tokenId), BigInt(hoursToRent));

    return await executeTransaction(
        txPromise,
        `NFT #${tokenId} rented for ${hoursToRent} hours!`,
        "Error renting NFT",
        btnElement
    );
}

/**
 * Withdraws an NFT from listing.
 */
export async function executeWithdrawNFT(tokenId, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected", "error");

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    const txPromise = rentalContract.withdrawNFT(BigInt(tokenId));

    return await executeTransaction(
        txPromise,
        `NFT #${tokenId} withdrawn!`,
        "Error withdrawing NFT",
        btnElement
    );
}


// ====================================================================
// 2. CORE TRANSACTIONS (Delegation, Unstake, Claims)
// ====================================================================

export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const totalAmountBigInt = BigInt(totalAmount); 
    const durationBigInt = BigInt(durationSeconds);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    const approved = await ensureApproval(State.bkcTokenContract, addresses.delegationManager, totalAmountBigInt, btnElement, "Delegation");
    if (!approved) return false;
    
    const delegateTxPromise = State.delegationManagerContract.delegate(totalAmountBigInt, durationBigInt, boosterIdBigInt);
    
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
    
    if (!confirm("Are you sure? This action will incur a penalty.")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`)
    
    const forceUnstakeTxPromise = State.delegationManagerContract.forceUnstake(index, boosterIdToSend); 
    
    return await executeTransaction(
        forceUnstakeTxPromise,
        'Force unstake successful!',
        'Error performing force unstake',
        btnElement
    );
}

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
        const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
        const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;

        if (stakingRewards > 0n) {
            showToast("Claiming rewards...", "info");
            const tx = await State.delegationManagerContract.claimReward(boosterIdToSend);
            await tx.wait();
            showToast('Reward claimed successfully!', "success");
        }
        
        loadUserData(); 
        return true;
    } catch (e) {
        console.error("Error during claim:", e);
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


// ====================================================================
// 3. BOOSTER STORE (FACTORY)
// ====================================================================

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForPStake, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    const priceBigInt = BigInt(price);
    
    if (priceBigInt <= 0n) {
        showToast("Price is zero or unavailable.", "error");
        return false;
    }
    if (priceBigInt > State.currentUserBalance) {
         showToast("Insufficient BKC balance.", "error");
         return false;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }
    
    try {
        const approved = await ensureApproval(State.bkcTokenContract, poolAddress, priceBigInt, btnElement, "NFT Purchase");
        if (!approved) {
             if(btnElement) btnElement.innerHTML = originalText;
             return false;
        }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.signer);
        const boosterIdToSend = BigInt(boosterTokenIdForPStake);

        const buyTxPromise = poolContract.buyNextAvailableNFT(boosterIdToSend);
        const success = await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

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

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    if (!State.signer) return showToast("Wallet not connected.", "error");
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    const tokenIdBigInt = BigInt(tokenIdToSell);
    
    if (tokenIdBigInt <= 0n) {
        showToast("No NFT selected.", "error");
        return false;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block"></div>';
    }

    try {
        // Approve NFT Transfer
        const approved = await ensureApproval(State.rewardBoosterContract, poolAddress, tokenIdBigInt, btnElement, "NFT Sale");
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.signer);

        const sellTxPromise = poolContract.sellNFT(tokenIdBigInt, boosterIdToSend);
        const success = await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);
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


// ====================================================================
// 4. FAUCET & NOTARY
// ====================================================================

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

export async function executeNotarizeDocument(documentURI, boosterId, submitButton) {
    if (!State.signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Wallet not connected or contracts not loaded.", "error");
        return false;
    }

    const baseFee = State.systemFees?.NOTARY_SERVICE || 0n;
    const notaryAddress = await State.decentralizedNotaryContract.getAddress();
    
    if (baseFee > 0n) {
        const approved = await ensureApproval(State.bkcTokenContract, notaryAddress, baseFee, submitButton, "Notary Fee");
        if (!approved) return false;
    }

    const notarizeTxPromise = State.decentralizedNotaryContract.notarize(documentURI, BigInt(boosterId));

    const success = await executeTransaction(
        notarizeTxPromise,
        'Document notarized successfully!',
        'Error notarizing document',
        submitButton
    );

    return success;
}