// js/modules/transactions.js
// ✅ VERSÃO FINAL V4.2: Fix "Approval to Current Owner" (Proteção de Propriedade)

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
        showToast('Submitting transaction to blockchain...', 'info');
        
        // Aguarda a confirmação do bloco
        const receipt = await tx.wait();
        
        showToast(successMessage, 'success', receipt.hash);

        // --- OPTIMISTIC UPDATE ---
        await loadUserData(); 
        
        if (window.location.hash.includes('rental') || window.location.hash.includes('dashboard')) {
             await loadRentalListings(); 
        }
        
        // Atualização de segurança
        setTimeout(async () => {
            await loadUserData();
            if (typeof loadRentalListings === 'function') await loadRentalListings();
            if (window.updateUIState) window.updateUIState(true);
        }, 3000);

        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        let reason = 'Transaction rejected or failed.';

        if (e.reason) reason = e.reason;
        else if (e.data && e.data.message) reason = e.data.message;
        else if (e.message) reason = e.message;

        if (e.code === 'ACTION_REJECTED') reason = 'You rejected the transaction in your wallet.';
        if (e.code === 'INSUFFICIENT_FUNDS') reason = 'You do not have enough ETH (Sepolia) for gas fees.';
        
        if (reason.includes("Notary: Insufficient pStake")) reason = "Minimum pStake requirement not met.";
        if (reason.includes("Fee transfer failed") || reason.includes("insufficient allowance")) reason = "Insufficient BKC balance or allowance.";
        if (reason.includes("NP: No available NFTs")) reason = "Pool is currently sold out.";
        if (reason.includes("InsufficientPStake")) reason = "Your pStake is too low to use this service.";
        if (reason.includes("RentalActive")) reason = "NFT is currently rented and cannot be withdrawn.";
        if (reason.includes("NotOwner")) reason = "You do not own this NFT.";

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
 * Ensures approval for ERC20 (Amount) OR ERC721 (TokenID).
 * INCLUI VERIFICAÇÃO DE PROPRIEDADE REAL (ON-CHAIN) PARA EVITAR ERRO DE RPC.
 */
async function ensureApproval(tokenContract, spenderAddress, amountOrTokenId, btnElement, purpose) {
    if (!State.signer) return false;
    
    if (!spenderAddress || spenderAddress.includes('...')) {
        showToast(`Error: Invalid contract address for ${purpose}.`, "error");
        return false;
    }

    const setBtnLoading = (text) => {
        if(btnElement) {
            btnElement.innerHTML = `<div class="loader inline-block mr-2"></div> ${text}...`;
            btnElement.disabled = true;
        }
    };

    try {
        const isERC721 = typeof tokenContract.setApprovalForAll === 'function';

        if (!isERC721) {
            // --- ERC20 LOGIC ---
            const requiredAmount = BigInt(amountOrTokenId);
            if (requiredAmount === 0n) return true;
            
            setBtnLoading("Checking Allowance");
            const allowance = await tokenContract.allowance(State.userAddress, spenderAddress);

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
        else {
            // --- ERC721 LOGIC ---
            const tokenId = BigInt(amountOrTokenId);
            setBtnLoading("Verifying Ownership");
            
            // 🛑 SANITY CHECK: Verificar proprietário real na Blockchain antes de aprovar
            try {
                const currentOwner = await tokenContract.ownerOf(tokenId);
                
                // Se o usuário NÃO é o dono
                if (currentOwner.toLowerCase() !== State.userAddress.toLowerCase()) {
                    console.warn(`Ownership mismatch for Token #${tokenId}. Real Owner: ${currentOwner}`);
                    showToast("Sync Error: You no longer own this NFT. Refreshing...", "error");
                    // Força atualização dos dados
                    await loadUserData(true);
                    return false; // Aborta para evitar erro de RPC
                }

                // Se o spender JÁ É o dono (Ex: Pool), não precisa aprovar (e aprovar daria erro)
                if (currentOwner.toLowerCase() === spenderAddress.toLowerCase()) {
                    return true;
                }

            } catch (e) {
                console.warn("Could not verify owner (Token might be burned)", e);
                // Se falhar a leitura, tentamos seguir com a aprovação padrão
            }

            setBtnLoading("Checking NFT Approval");
            
            // 1. Check specific approval
            let approvedAddr = ethers.ZeroAddress;
            try { approvedAddr = await tokenContract.getApproved(tokenId); } catch(e) {} 
            
            // 2. Check operator approval
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
        if(btnElement) btnElement.disabled = false;
        
        let msg = e.reason || e.message || 'Transaction rejected.';
        if (msg.includes("approval to current owner")) msg = "Token already owned by target.";
        
        showToast(`Approval Error: ${msg}`, "error");
        return false;
    }
}


// ====================================================================
// 1. RENTAL MARKET TRANSACTIONS (AirBNFT)
// ====================================================================

export async function executeListNFT(tokenId, pricePerHourWei, maxDurationHours, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected or Config missing", "error");

    const approved = await ensureApproval(
        State.rewardBoosterContract, 
        addresses.rentalManager, 
        tokenId, 
        btnElement, 
        "Listing NFT"
    );
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    const txPromise = rentalContract.listNFT(BigInt(tokenId), BigInt(pricePerHourWei), BigInt(maxDurationHours));
    
    return await executeTransaction(txPromise, `NFT #${tokenId} listed successfully!`, "Error listing NFT", btnElement);
}

export async function executeRentNFT(tokenId, hoursToRent, totalCostWei, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected", "error");

    const approved = await ensureApproval(
        State.bkcTokenContract, 
        addresses.rentalManager, 
        BigInt(totalCostWei), 
        btnElement, 
        "Rental Payment"
    );
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    const txPromise = rentalContract.rentNFT(BigInt(tokenId), BigInt(hoursToRent));

    return await executeTransaction(txPromise, `NFT #${tokenId} rented for ${hoursToRent} hours!`, "Error renting NFT", btnElement);
}

export async function executeWithdrawNFT(tokenId, btnElement) {
    if (!State.signer || !addresses.rentalManager) return showToast("Wallet not connected", "error");

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, State.signer);
    const txPromise = rentalContract.withdrawNFT(BigInt(tokenId));

    return await executeTransaction(txPromise, `NFT #${tokenId} withdrawn!`, "Error withdrawing NFT", btnElement);
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
    
    return await executeTransaction(unstakeTxPromise, 'Unstake successful!', 'Error unstaking tokens', btnElement);
}

export async function executeForceUnstake(index) {
    if (!State.signer) return showToast("Wallet not connected.", "error");

    const { tokenId: boosterTokenId } = await getHighestBoosterBoostFromAPI();
    const boosterIdToSend = boosterTokenId ? BigInt(boosterTokenId) : 0n;
    
    if (!confirm("Are you sure? This action will incur a penalty.")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`)
    const forceUnstakeTxPromise = State.delegationManagerContract.forceUnstake(index, boosterIdToSend); 
    
    return await executeTransaction(forceUnstakeTxPromise, 'Force unstake successful!', 'Error performing force unstake', btnElement);
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
        return await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

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
        // CORREÇÃO: Usar o contrato de NFT correto para aprovação (RewardBooster)
        const approved = await ensureApproval(State.rewardBoosterContract, poolAddress, tokenIdBigInt, btnElement, "NFT Sale");
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const minPrice = 0n; 
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, State.signer);

        const sellTxPromise = poolContract.sellNFT(tokenIdBigInt, boosterIdToSend, minPrice);
        return await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);

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
    
    return await executeTransaction(claimTxPromise, `Successfully claimed ${faucetAmount} $BKC!`, 'Error claiming tokens', btnElement);
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

    return await executeTransaction(notarizeTxPromise, 'Document notarized successfully!', 'Error notarizing document', submitButton);
}