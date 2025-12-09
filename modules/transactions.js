// js/modules/transactions.js
// ✅ VERSÃO FINAL V5.3 (CONTRATOS V5.2): Alinhamento de Assinatura (Booster ID) + Rental Fix

const ethers = window.ethers;

import { State } from '../state.js';
import { showToast, closeModal } from '../ui-feedback.js';
import { addresses, nftPoolABI, rentalManagerABI } from '../config.js'; 
import { formatBigNumber } from '../utils.js';
import { loadUserData, getHighestBoosterBoostFromAPI, loadRentalListings } from './data.js';

// --- Tolerance Constants ---
const APPROVAL_TOLERANCE_BIPS = 100n; 
const BIPS_DENOMINATOR = 10000n; 

/**
 * ⚡ GAS HELPER (CRITICAL FIX FOR ARBITRUM)
 * Calcula o gás dinamicamente com margem de segurança de 20%.
 */
async function getGasWithMargin(contract, method, args) {
    try {
        const estimatedGas = await contract[method].estimateGas(...args);
        return { gasLimit: (estimatedGas * 120n) / 100n };
    } catch (error) {
        console.warn(`⚠️ Gas estimation failed for ${method}. Using safe fallback.`, error);
        return { gasLimit: 2000000n };
    }
}

// ====================================================================
// CORE SIGNER/RUNNER UTILITY
// ====================================================================

async function getConnectedSigner() {
    if (!State.isConnected) {
        showToast("Wallet not connected.", "error");
        return null;
    }
    
    if (State.web3Provider) {
        try {
            const provider = new ethers.BrowserProvider(State.web3Provider);
            const signer = await provider.getSigner(); 
            return signer;
        } catch (e) {
            console.error("Signer acquisition failed (BrowserProvider):", e);
            showToast("Failed to acquire wallet signer. Please check permissions in MetaMask.", "error");
            return null;
        }
    }

    showToast("Wallet provider not found.", "error");
    return null;
}


// ====================================================================
// GENERIC WRAPPERS & UTILITIES
// ====================================================================

async function executeTransaction(txPromise, successMessage, failMessage, btnElement) {
    const originalText = btnElement ? btnElement.innerHTML : 'Processing...';
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Processing...';
    }

    try {
        const tx = await txPromise;
        
        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block mr-2"></div> Confirming...';
        showToast('Submitting transaction to blockchain...', 'info');
        
        const receipt = await tx.wait();
        
        showToast(successMessage, 'success', receipt.hash);

        // --- OPTIMISTIC UPDATE ---
        await loadUserData(); 
        
        if (window.location.hash.includes('rental') || window.location.hash.includes('dashboard')) {
             if (typeof loadRentalListings === 'function') await loadRentalListings(); 
        }
        
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

        // Tratamento específico para erros comuns de RPC
        if (reason.includes("Internal JSON-RPC error") || reason.includes("code=-32603")) {
            reason = "RPC Error: Network busy or Gas estimation failed. Please reset MetaMask activity.";
        }
        if (e.code === 'ACTION_REJECTED') reason = 'You rejected the transaction in your wallet.';
        if (reason.includes("execution reverted")) reason = "Execution Reverted (Check Contract State/Input).";
        
        if (reason.includes("Insufficient pStake")) reason = "Minimum pStake requirement not met.";
        if (reason.includes("TransferFailed")) reason = "Token transfer failed (Check BKC balance/allowance).";
        if (reason.includes("insufficient allowance")) reason = "Contract not approved to spend tokens.";
        
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

async function ensureApproval(tokenContract, spenderAddress, amountOrTokenId, btnElement, purpose) {
    const signer = await getConnectedSigner(); 
    if (!signer) return false;
    
    const approvedTokenContract = tokenContract.connect(signer);

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
        let isERC721 = false;
        try {
            const fn = tokenContract.interface.getFunction("setApprovalForAll");
            isERC721 = !!fn; 
        } catch (e) { isERC721 = false; }

        if (!isERC721) {
            const requiredAmount = BigInt(amountOrTokenId);
            if (requiredAmount === 0n) return true;
            
            setBtnLoading("Checking Allowance");
            const allowance = await tokenContract.allowance(State.userAddress, spenderAddress); 

            const toleratedAmount = (requiredAmount * (BIPS_DENOMINATOR + APPROVAL_TOLERANCE_BIPS)) / BIPS_DENOMINATOR;

            if (allowance < toleratedAmount) {
                showToast(`Approving ${formatBigNumber(toleratedAmount).toFixed(2)} $BKC for ${purpose}...`, "info");
                setBtnLoading("Approving");

                // ✅ FIX: Gás dinâmico para evitar "Insufficient Funds" em aprovações
                const args = [spenderAddress, toleratedAmount];
                const gasOpts = await getGasWithMargin(approvedTokenContract, 'approve', args);
                
                const approveTx = await approvedTokenContract.approve(...args, gasOpts);
                await approveTx.wait();
                showToast('Approval successful!', "success");
            }
            return true;
        } 
        else {
            const tokenId = BigInt(amountOrTokenId);
            setBtnLoading("Checking NFT Approval");
            
            let approvedAddr = ethers.ZeroAddress;
            try { approvedAddr = await tokenContract.getApproved(tokenId); } catch(e) {} 
            
            const isApprovedAll = await tokenContract.isApprovedForAll(State.userAddress, spenderAddress);
            
            if (approvedAddr.toLowerCase() !== spenderAddress.toLowerCase() && !isApprovedAll) {
                showToast(`Approving NFT #${tokenId}...`, "info");
                setBtnLoading("Approving NFT");
                
                // ✅ FIX: Gás dinâmico para aprovação de NFT
                const args = [spenderAddress, tokenId];
                const gasOpts = await getGasWithMargin(approvedTokenContract, 'approve', args);

                const approveTx = await approvedTokenContract.approve(...args, gasOpts);
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
// 1. RENTAL MARKET TRANSACTIONS (V5 FIXES)
// ====================================================================

// V5 FIX: Removido maxDurationHours, pois a duração é fixa em 1h
export async function executeListNFT(tokenId, pricePerHourWei, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;

    const approved = await ensureApproval(State.rewardBoosterContract, addresses.rentalManager, tokenId, btnElement, "Listing NFT");
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    // Argumentos do V5: tokenId, price
    const args = [BigInt(tokenId), BigInt(pricePerHourWei)]; 
    
    const gasOpts = await getGasWithMargin(rentalContract, 'listNFT', args);
    const txPromise = rentalContract.listNFT(...args, gasOpts);
    
    return await executeTransaction(txPromise, `NFT #${tokenId} listed successfully!`, "Error listing NFT", btnElement);
}

// V5 FIX: Removido hoursToRent, pois a duração é fixa em 1h
export async function executeRentNFT(tokenId, totalCostWei, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;

    // Aprovação baseada no custo total (1H)
    const approved = await ensureApproval(State.bkcTokenContract, addresses.rentalManager, BigInt(totalCostWei), btnElement, "Rental Payment");
    if (!approved) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    // Argumentos do V5: tokenId
    const args = [BigInt(tokenId)];

    const gasOpts = await getGasWithMargin(rentalContract, 'rentNFT', args);
    const txPromise = rentalContract.rentNFT(...args, gasOpts);

    // Mensagem de sucesso ajustada
    return await executeTransaction(txPromise, `NFT #${tokenId} rented for 1 hour!`, "Error renting NFT", btnElement);
}

export async function executeWithdrawNFT(tokenId, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.rentalManager) return false;

    const rentalContract = new ethers.Contract(addresses.rentalManager, rentalManagerABI, signer); 
    const args = [BigInt(tokenId)];

    const gasOpts = await getGasWithMargin(rentalContract, 'withdrawNFT', args);
    const txPromise = rentalContract.withdrawNFT(...args, gasOpts);

    return await executeTransaction(txPromise, `NFT #${tokenId} withdrawn!`, "Error withdrawing NFT", btnElement);
}


// ====================================================================
// 2. CORE TRANSACTIONS (Delegation, Unstake, Claims)
// ====================================================================

// Assinatura V5: totalAmount, durationSeconds, boosterIdToSend
export async function executeDelegation(totalAmount, durationSeconds, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;
    
    const totalAmountBigInt = BigInt(totalAmount); 
    const durationBigInt = BigInt(durationSeconds);
    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    try {
        const balance = await State.bkcTokenContract.balanceOf(State.userAddress);
        if (balance < totalAmountBigInt) {
            showToast(`Insufficient balance!`, "error");
            return false;
        }
    } catch(e) { }

    const MAX_DURATION = 315360000n; 
    if (durationBigInt > MAX_DURATION) {
        showToast("Invalid duration (Max: 10 Years).", "error");
        return false;
    }

    const approved = await ensureApproval(State.bkcTokenContract, addresses.delegationManager, totalAmountBigInt, btnElement, "Delegation");
    if (!approved) return false;
    
    const delegationContract = State.delegationManagerContract.connect(signer); 
    const args = [totalAmountBigInt, durationBigInt, boosterIdBigInt];

    const gasOpts = await getGasWithMargin(delegationContract, 'delegate', args);
    const delegateTxPromise = delegationContract.delegate(...args, gasOpts);
    
    const success = await executeTransaction(delegateTxPromise, 'Delegation successful!', 'Error delegating tokens', btnElement);
    if (success) closeModal();
    return success;
}

// Assinatura V5: index, boosterIdToSend
export async function executeUnstake(index, boosterIdToSend) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;

    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    const btnElement = document.querySelector(`.unstake-btn[data-index='${index}']`);
    const delegationContract = State.delegationManagerContract.connect(signer); 
    const args = [index, boosterIdBigInt];

    const gasOpts = await getGasWithMargin(delegationContract, 'unstake', args);
    const unstakeTxPromise = delegationContract.unstake(...args, gasOpts);
    
    return await executeTransaction(unstakeTxPromise, 'Unstake successful!', 'Error unstaking tokens', btnElement);
}

// Assinatura V5: index, boosterIdToSend
export async function executeForceUnstake(index, boosterIdToSend) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;

    const boosterIdBigInt = BigInt(boosterIdToSend);
    
    if (!confirm("Are you sure? Force unstaking applies a 50% penalty.")) return false;
    
    const btnElement = document.querySelector(`.force-unstake-btn[data-index='${index}']`);
    const delegationContract = State.delegationManagerContract.connect(signer); 
    const args = [index, boosterIdBigInt];

    const gasOpts = await getGasWithMargin(delegationContract, 'forceUnstake', args);
    const forceUnstakeTxPromise = delegationContract.forceUnstake(...args, gasOpts); 
    
    return await executeTransaction(forceUnstakeTxPromise, 'Force unstake successful!', 'Error performing force unstake', btnElement);
}

// Assinatura V5: stakingRewards, minerRewards, boosterIdToSend
export async function executeUniversalClaim(stakingRewards, minerRewards, boosterIdToSend, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !addresses.delegationManager) return false;
    
    const boosterIdBigInt = BigInt(boosterIdToSend); // Usa o ID passado pelo cliente
    
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
        if (stakingRewards > 0n) {
            showToast("Claiming rewards...", "info");
            const delegationContract = State.delegationManagerContract.connect(signer); 
            // Argumento V5: apenas boosterId
            const args = [boosterIdBigInt];
            
            const gasOpts = await getGasWithMargin(delegationContract, 'claimReward', args);
            const tx = await delegationContract.claimReward(...args, gasOpts);
            
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

export async function executeBuyBooster(poolAddress, price, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Buy';
    const priceBigInt = BigInt(price);
    
    if (priceBigInt <= 0n) { showToast("Price is zero.", "error"); return false; }
    if (priceBigInt > State.currentUserBalance) { showToast("Insufficient BKC balance.", "error"); return false; }

    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div>'; }
    
    try {
        const approved = await ensureApproval(State.bkcTokenContract, poolAddress, priceBigInt, btnElement, "NFT Purchase");
        if (!approved) { if(btnElement) btnElement.innerHTML = originalText; return false; }

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Buying...';

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        // buyNextAvailableNFT(boosterId)
        const args = [boosterIdToSend];

        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
        const gasOpts = await getGasWithMargin(poolContract, 'buyNextAvailableNFT', args);
        const buyTxPromise = poolContract.buyNextAvailableNFT(...args, gasOpts);
        
        return await executeTransaction(buyTxPromise, 'Purchase successful!', 'Error during purchase', btnElement);

    } catch (e) {
        console.error("Error buying booster:", e);
        showToast(`Error: ${e.reason || e.message || 'Transaction rejected.'}`, "error");
        return false;
    } finally {
         if(btnElement) setTimeout(() => { if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; } }, 1000);
    }
}

export async function executeSellBooster(poolAddress, tokenIdToSell, boosterTokenIdForDiscount, btnElement) {
    const signer = await getConnectedSigner();
    if (!signer || !poolAddress) return false;
    
    const originalText = btnElement ? btnElement.innerHTML : 'Sell NFT';
    const tokenIdBigInt = BigInt(tokenIdToSell);
    
    if (tokenIdBigInt <= 0n) { showToast("No NFT selected.", "error"); return false; }

    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div>'; }

    try {
        const approved = await ensureApproval(State.rewardBoosterContract, poolAddress, tokenIdBigInt, btnElement, "NFT Sale");
        if (!approved) return false;

        if (btnElement) btnElement.innerHTML = '<div class="loader inline-block"></div> Selling...';

        const boosterIdToSend = BigInt(boosterTokenIdForDiscount);
        const minPrice = 0n; 
        
        const poolContract = new ethers.Contract(poolAddress, nftPoolABI, signer); 
        // sellNFT(tokenId, boosterId, minPrice)
        const args = [tokenIdBigInt, boosterIdToSend, minPrice];

        const gasOpts = await getGasWithMargin(poolContract, 'sellNFT', args);
        const sellTxPromise = poolContract.sellNFT(...args, gasOpts);

        return await executeTransaction(sellTxPromise, 'Sale successful!', 'Error during sale', btnElement);

    } catch (e) {
        console.error("Error selling booster:", e);
        showToast(`Error: ${e.reason || e.message}`, "error");
        return false;
    } finally {
        if(btnElement) setTimeout(() => { if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; } }, 1000);
    }
}


// ====================================================================
// 4. FAUCET & NOTARY (ENTERPRISE LOGIC)
// ====================================================================

export async function executeInternalFaucet(btnElement) {
    const signer = await getConnectedSigner();
    if (!signer) return false;
    
    const network = await State.provider.getNetwork();
    if (network.chainId !== 421614n) return showToast("Testnet only.", "warning");

    const originalText = btnElement ? btnElement.innerHTML : 'Get Tokens';
    if (btnElement) { btnElement.disabled = true; btnElement.innerHTML = '<div class="loader inline-block"></div> Minting...'; }

    try {
        if (State.faucetContract) {
            const faucetContract = State.faucetContract.connect(signer); 
            const gasOpts = await getGasWithMargin(faucetContract, 'claim', []);
            const tx = await faucetContract.claim(gasOpts);
            return await executeTransaction(tx, 'Tokens sent!', 'Faucet Error', btnElement);
        } else if (State.bkcTokenContract) {
            const amount = ethers.parseUnits("20", 18); 
            const bkcTokenContract = State.bkcTokenContract.connect(signer); 
            const args = [State.userAddress, amount];
            
            const gasOpts = await getGasWithMargin(bkcTokenContract, 'mint', args);
            const tx = await bkcTokenContract.mint(...args, gasOpts); 
            return await executeTransaction(tx, '20 BKC Minted!', 'Mint Error', btnElement);
        } else {
            throw new Error("Faucet not available.");
        }
    } catch (e) {
        console.error("Faucet Error:", e);
        showToast(`Error: ${e.reason || e.message}`, "error");
        if(btnElement) { btnElement.disabled = false; btnElement.innerHTML = originalText; }
        return false;
    }
}

export async function executeNotarizeDocument(documentURI, description, contentHash, boosterId, submitButton) {
    const signer = await getConnectedSigner();
    
    if (!signer || !State.bkcTokenContract || !State.decentralizedNotaryContract) {
        showToast("Contracts or Signer not ready.", "error");
        return false;
    }

    const notaryContract = State.decentralizedNotaryContract.connect(signer); 
    const notaryAddress = await notaryContract.getAddress(); 
    
    // 1. Fee Calculation & Approval Logic
    let feeToPay = State.systemFees?.NOTARY_SERVICE || 0n;
    try {
        if (State.ecosystemManagerContractPublic) {
            const key = ethers.id("NOTARY_SERVICE");
            // V5: Usa getFee(key) no Hub
            const realFee = await State.ecosystemManagerContractPublic.getFee(key);
            if (realFee > 0n) feeToPay = realFee;
        }
    } catch (e) {
        console.warn("Fee fetch warning:", e);
    }

    if (feeToPay > 0n) {
        const approved = await ensureApproval(State.bkcTokenContract, notaryAddress, feeToPay, submitButton, "Notary Fee");
        if (!approved) {
            showToast("Approval failed or rejected.", "error");
            return false;
        }
    }

    // 2. Prepare Parameters
    const bId = boosterId ? BigInt(boosterId) : 0n;
    const args = [documentURI, description, contentHash, bId];
    
    // 3. Call Smart Contract (Updated Signature with Dynamic Gas)
    const gasOpts = await getGasWithMargin(notaryContract, 'notarize', args);
    const notarizeTxPromise = notaryContract.notarize(...args, gasOpts);

    return await executeTransaction(notarizeTxPromise, 'Document notarized successfully!', 'Error notarizing document', submitButton);
}